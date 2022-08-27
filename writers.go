package main

import (
	"database/sql"
	"fmt"
	"os"
	"path"
	"path/filepath"
	"strings"
	"sync"

	// TODO: Implement this yourself
	cp "github.com/otiai10/copy"
)

func writeFile(name string, contents []byte) {
	dirName := path.Dir(name)

	if m_err := os.MkdirAll(dirName, os.ModePerm); m_err != nil {
		fmt.Println("ERROR: Could not make folder", dirName, ":", m_err)
		fmt.Println("Halting.")
		os.Exit(EXIT_GENERAL_IO_ERROR)
	}

	if f_err := os.WriteFile(name, contents, os.ModePerm); f_err != nil {
		fmt.Println("ERROR: Could not make file", name, ":", f_err)
		fmt.Println("Halting.")
		os.Exit(EXIT_GENERAL_IO_ERROR)
	}
}

func copyTemplateAssets(config *BockConfig) {
	// Copy all the css, js, etc
	for _, a := range [3]string{"css", "img", "js"} {
		d, err := templatesContent.ReadDir("template/" + a)
		if err != nil {
			fmt.Print("Could not read " + a + "...skipping")
			break
		}

		os.MkdirAll(config.outputFolder+"/"+a, os.ModePerm)

		for _, de := range d {
			f, _ := templatesContent.ReadFile("template/" + a + "/" + de.Name())
			writeFile(config.outputFolder+"/"+a+"/"+de.Name(), f)
		}
	}

	// Then copy anything at the root level of the template folder except the
	// actual template HTML files!
	d, _ := templatesContent.ReadDir("template")
	for _, de := range d {
		if filepath.Ext(de.Name()) != ".njk" {
			f, _ := templatesContent.ReadFile("template/" + de.Name())
			os.WriteFile(config.outputFolder+"/"+de.Name(), f, os.ModePerm)
		}
	}
}

func copyAssets(config *BockConfig) {
	if err := cp.Copy(
		config.articleRoot+"/__assets",
		config.outputFolder+"/assets",
	); err != nil {
		fmt.Print("Oops, could not copy assets: ", err)
	}
}

func writeIndex(config *BockConfig) {
	writeFile(config.outputFolder+"/index.html", []byte(renderIndex()))
}

func write404(config *BockConfig) {
	writeFile(config.outputFolder+"/404.html", []byte(renderNotFound()))
}

func writeRevision(article Article, revision Revision, config *BockConfig) {
	uri := makeURI(article.path, config.articleRoot)
	os.MkdirAll(config.outputFolder+uri, os.ModePerm)
	outputPath := config.outputFolder + uri + "/revisions/" + revision.ShortId
	html, raw := renderRevision(article, revision)

	writeFile(outputPath+"/index.html", []byte(html))

	if config.meta.GenerateRaw {
		writeFile(outputPath+"/raw/index.html", []byte(raw))
	}

	if config.meta.GenerateJSON {
		jsonData, _ := jsonMarshal(revision)
		writeFile(outputPath+"/index.json", jsonData)
	}

	config.meta.RevisionCount += 1
}

func writeArticle(
	articlePath string,
	config *BockConfig,
	f os.FileInfo,
	stmt *sql.Stmt,
) {
	fileName := f.Name()
	title := removeExtensionFrom(fileName)
	uri := makeURI(articlePath, config.articleRoot)
	relativePath := makeRelativePath(articlePath, config.articleRoot)

	contents, _ := os.ReadFile(articlePath)
	untracked := true
	revisions := []Revision{}
	history, h_err := getArticleHistory(articlePath, config)

	if h_err == nil {
		untracked = false
		revisions = history.revisions
	}

	article := Article{
		FileCreated:  history.modified,
		FileModified: history.created,
		Hierarchy:    makeHierarchy(articlePath, config.articleRoot),
		Html:         "",
		ID:           makeID(articlePath),
		path:         articlePath,
		Revisions:    revisions,
		Size:         f.Size(),
		Source:       string(contents),
		Title:        title,
		Untracked:    untracked,
		URI:          uri,
	}

	// Insert just the article into Database
	// TODO: Find a way to search through revisions as well <3
	if stmt != nil {
		if _, s_err := stmt.Exec(
			makeID(articlePath),
			string(contents),
			f.ModTime().UTC(),
			title,
			uri,
		); s_err != nil {
			fmt.Println("ERROR: Could not update database with '"+relativePath+"': ", s_err)
			os.Exit(EXIT_DATABASE_ERROR)
		}
	}

	// Render the article HTML
	html, raw := renderArticle(contents, article, "article", config)
	article.Html = html

	// Start writing things
	writeFile(config.outputFolder+uri+"/index.html", []byte(html))

	if config.meta.GenerateRaw {
		writeFile(config.outputFolder+uri+"/raw/index.html", []byte(raw))
	}

	if config.meta.GenerateJSON {
		jsonData, _ := jsonMarshal(article)
		writeFile(config.outputFolder+uri+"/index.json", jsonData)
	}

	// Create revisions if applicable (i.e. at least one commit exists for article)
	revisionsLabel := "(No revisions)"
	if revisions != nil {
		revisionsLabel = "(One revision)"
		rc := len(revisions)
		if rc > 1 {
			revisionsLabel = "(" + fmt.Sprint(rc) + " revisions)"
		}

		revisionListHTML := renderRevisionList(article, history.revisions)
		writeFile(config.outputFolder+uri+"/revisions/index.html", []byte(revisionListHTML))

		for _, r := range history.revisions {
			writeRevision(article, r, config)
		}
	}

	fmt.Printf("\033[2K\r%s", relativePath+" "+revisionsLabel)

	config.meta.ArticleCount += 1
}

func writeHome(config *BockConfig) {
	homePath := config.articleRoot + "/Home.md"
	_, h_err := os.Stat(homePath)

	if h_err != nil {
		fmt.Println("Could not find Home.md... making one.")
		writeFile(config.articleRoot+"/Home.md", []byte("(You need to make a `Home.md` here!)\n"))
	}

	f, _ := os.Stat(homePath)
	writeArticle(homePath, config, f, nil)
}

func writeArchive(config *BockConfig) {
	html := renderArchive(config)
	writeFile(config.outputFolder+"/archive/index.html", []byte(html))
}

func writeFolder(path string, config *BockConfig) Children {
	l, _ := os.ReadDir(path)

	folders := []HierarchicalObject{}
	articles := []HierarchicalObject{}
	title := strings.TrimLeft(strings.Replace(path, config.articleRoot, "", -1), "/")

	// Build all the children of this folder if any
	for _, f := range l {
		if !IGNORED_FOLDERS_REGEX.MatchString(f.Name()) {
			if f.IsDir() {
				folders = append(folders, HierarchicalObject{
					Name: removeExtensionFrom(f.Name()),
					Type: "folder",
					URI: makeURI(
						path, config.articleRoot) + "/" + makeURI(f.Name(),
						config.articleRoot,
					),
				})
			} else {
				articles = append(articles, HierarchicalObject{
					Name: removeExtensionFrom(f.Name()),
					Type: "article",
					URI: makeURI(
						path, config.articleRoot) + "/" + makeURI(f.Name(),
						config.articleRoot,
					),
				})
			}
		}
	}

	// Check if the folder has a readme
	readme := ""
	r, err := os.ReadFile(path + "/README.md")
	if err == nil {
		readme = string(r)
	}

	folder := Folder{
		ID:    makeID(path),
		URI:   makeURI(path, config.articleRoot),
		Title: title,
		Children: Children{
			Articles: articles,
			Folders:  folders,
		},
		Hierarchy: makeHierarchy(path, config.articleRoot),
		README:    readme,
	}

	html := renderFolder(folder)

	if path != config.articleRoot {
		writeFile(
			config.outputFolder+"/"+makeURI(path, config.articleRoot)+"/index.html",
			[]byte(html),
		)

		if config.meta.GenerateJSON {
			jsonData, _ := jsonMarshal(folder)
			writeFile(
				config.outputFolder+"/"+makeURI(path, config.articleRoot)+"/index.json",
				jsonData,
			)
		}
	} else {
		writeFile(config.outputFolder+"/ROOT/index.html", []byte(html))

		if config.meta.GenerateJSON {
			jsonData, _ := jsonMarshal(folder)
			writeFile(config.outputFolder+"/ROOT/index.json", jsonData)
		}
	}

	return Children{
		Articles: articles,
		Folders:  folders,
	}
}

func writeArticles(config *BockConfig) error {
	tx, _ := config.database.Begin()
	stmt, _ := tx.Prepare(`
  INSERT INTO articles (
      id,
      content,
      modified,
      title,
      uri
    )
    VALUES (?, ?, ?, ?, ?)
  `)

	defer stmt.Close()

	type Entity struct {
		path     string
		fileInfo os.FileInfo
	}

	entityList := []Entity{}

	// Make a list of entities
	err := filepath.Walk(
		config.articleRoot,
		func(path string, f os.FileInfo, err error) error {
			if !IGNORED_FOLDERS_REGEX.MatchString(path) {
				addToList :=
					!IGNORED_FILES_REGEX.MatchString(path) &&
						filepath.Ext(path) == ".md" || f.IsDir()

				if addToList {
					entityList = append(entityList, Entity{
						path:     path,
						fileInfo: f,
					})
				}
			}

			return nil
		})

	// Process them in a simple waitgroup... for now. This creates as many
	// coroutines as articles and gets really slow on machines with low memory.
	//
	// TODO: Use channels or buffered WaitGroups
	// for i := 10; i >= 0; i-- {
	// 	fmt.Printf("\033[2K\r%d", i)
	// 	time.Sleep(1 * time.Second)
	// }
	// fmt.Println()

	wg := new(sync.WaitGroup)
	for _, e := range entityList {
		wg.Add(1)

		go func(e Entity, stmt *sql.Stmt, config *BockConfig) {
			defer wg.Done()

			if e.fileInfo.IsDir() {
				writeFolder(e.path, config)
			} else {
				writeArticle(e.path, config, e.fileInfo, stmt)
			}
		}(e, stmt, config)
	}

	wg.Wait()

	fmt.Printf("\033[2K\r")
	fmt.Println("Finished articles")
	tx.Commit()

	return err
}
