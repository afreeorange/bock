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
	// Copy all static assets from theme/static/
	staticDirs := []string{"css", "img", "js"}
	for _, a := range staticDirs {
		d, err := themeContent.ReadDir("theme/static/" + a)
		if err != nil {
			fmt.Print("Could not read " + a + "...skipping")
			continue
		}

		os.MkdirAll(config.outputFolder+"/"+a, os.ModePerm)

		for _, de := range d {
			f, _ := themeContent.ReadFile("theme/static/" + a + "/" + de.Name())
			writeFile(config.outputFolder+"/"+a+"/"+de.Name(), f)
		}
	}

	// Copy root-level static files (robots.txt, etc.)
	d, _ := themeContent.ReadDir("theme/static")
	for _, de := range d {
		if !de.IsDir() {
			f, _ := themeContent.ReadFile("theme/static/" + de.Name())
			os.WriteFile(config.outputFolder+"/"+de.Name(), f, os.ModePerm)
		}
	}
}

// copyTemplateAssetsFromDisk copies static assets from an on-disk theme path.
// Used by the dev server when theme files change.
func copyTemplateAssetsFromDisk(config *BockConfig, themePath string) {
	staticRoot := filepath.Join(themePath, "static")
	for _, a := range []string{"css", "img", "js"} {
		srcDir := filepath.Join(staticRoot, a)
		entries, err := os.ReadDir(srcDir)
		if err != nil {
			continue
		}
		os.MkdirAll(config.outputFolder+"/"+a, os.ModePerm)
		for _, de := range entries {
			if de.IsDir() {
				continue
			}
			f, _ := os.ReadFile(filepath.Join(srcDir, de.Name()))
			writeFile(config.outputFolder+"/"+a+"/"+de.Name(), f)
		}
	}
	// Root-level static files
	entries, _ := os.ReadDir(staticRoot)
	for _, de := range entries {
		if !de.IsDir() {
			f, _ := os.ReadFile(filepath.Join(staticRoot, de.Name()))
			os.WriteFile(config.outputFolder+"/"+de.Name(), f, os.ModePerm)
		}
	}
}

func copyAssets(config *BockConfig) error {
	err := cp.Copy(
		config.articleRoot+"/__assets",
		config.outputFolder+"/assets",
	)

	return err
}

func writeIndex(config *BockConfig) {
	writeFile(config.outputFolder+"/index.html", []byte(renderIndex(config)))
}

func write404(config *BockConfig) {
	writeFile(config.outputFolder+"/404.html", []byte(renderNotFound(config)))
}

func writeRevision(article Article, revision Revision, config *BockConfig) {
	uri := makeURI(article.path, config.articleRoot)
	os.MkdirAll(config.outputFolder+uri, os.ModePerm)
	outputPath := config.outputFolder + uri + "/revisions/" + revision.ShortId
	html, raw := renderRevision(article, revision)

	writeFile(outputPath+"/index.html", []byte(html))

	if config.meta.GenerateRaw {
		writeFile(outputPath+"/raw.txt", []byte(raw))
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
	entity Entity,
	stmt *sql.Stmt,
) {
	fileName := entity.Name
	title := removeExtensionFrom(fileName)
	uri := makeURI(articlePath, config.articleRoot)
	relativePath := makeRelativePath(articlePath, config.articleRoot)

	contents, _ := os.ReadFile(articlePath)
	untracked := true

	var history ArticleHistory
	var historyError error

	if config.meta.GenerateRevisions {
		history, historyError = getArticleHistory(articlePath, config)

		if historyError == nil {
			untracked = false
		}
	}

	article := Article{
		Created:      history.modified,
		Modified:     history.created,
		Hierarchy:    makeHierarchy(articlePath, config.articleRoot),
		Html:         "",
		ID:           makeID(articlePath),
		path:         articlePath,
		Revisions:    history.revisions,
		Size:         entity.SizeInBytes,
		Source:       string(contents),
		Title:        title,
		Untracked:    untracked,
		URI:          uri,
		RelativePath: makeRelativePath(articlePath, config.articleRoot),
	}

	// Insert just the article into Database
	// TODO: Find a way to search through revisions as well <3
	if stmt != nil {
		if _, s_err := stmt.Exec(
			makeID(articlePath),
			string(contents),
			entity.Modified.UTC(),
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
		writeFile(config.outputFolder+uri+"/raw.txt", []byte(raw))
	}

	if config.meta.GenerateJSON {
		jsonData, _ := jsonMarshal(article)
		writeFile(config.outputFolder+uri+"/index.json", jsonData)
	}

	// Create revisions if applicable (i.e. at least one commit exists for article)
	if config.meta.GenerateRevisions {
		revisionsLabel := "(No revisions)"
		if history.revisions != nil {
			revisionsLabel = "(One revision)"

			if rc := len(history.revisions); rc > 1 {
				revisionsLabel = "(" + fmt.Sprint(rc) + " revisions)"
			}

			revisionListHTML := renderRevisionList(article, history.revisions)
			writeFile(config.outputFolder+uri+"/revisions/index.html", []byte(revisionListHTML))

			for _, r := range history.revisions {
				writeRevision(article, r, config)
			}
		}

		fmt.Printf("\033[2K\r%s", relativePath+" "+revisionsLabel)
	}
}

func writeHome(config *BockConfig) {
	homePath := config.articleRoot + "/Home.md"
	_, h_err := os.Stat(homePath)

	if h_err != nil {
		fmt.Println("Could not find Home.md... making one.")
		writeFile(config.articleRoot+"/Home.md", []byte("(You need to make a `Home.md` here!)\n"))
	}

	f, _ := os.Stat(homePath)
	e := getEntityInfo(config, f, homePath)
	writeArticle(homePath, config, *e, nil)
}

func writeArchive(config *BockConfig) {
	html := renderArchive(config)
	writeFile(config.outputFolder+"/archive/index.html", []byte(html))
}

func writeFolder(absolutePath string, config *BockConfig) {
	relativePath := makeRelativePath(absolutePath, config.articleRoot)
	pathFragments := strings.Split(relativePath, "/")

	folder := (*config.entityTree)[0]
	var folderIndex int
	var folderName string
	var folders []HierarchicalEntity
	var articles []HierarchicalEntity

	// Iterate through the list and get the children of the folder
	for _, fragment := range pathFragments {
		folderIndex = findChildWithName(folder.Children, fragment)

		// Else, this is the ROOT folder
		if folderIndex != -1 {
			folder = (*folder.Children)[folderIndex]
		}

		folderName = fragment
	}

	if folderName == "" {
		folderName = "Root"
	}

	// Make the folder's children
	for _, f := range *folder.Children {
		if f.IsFolder {
			folders = append(folders, HierarchicalEntity{
				Name: removeExtensionFrom(f.Name),
				Type: "folder",
				URI: makeURI(
					absolutePath, config.articleRoot) + "/" + makeURI(f.Name,
					config.articleRoot,
				),
			})
		} else {
			articles = append(articles, HierarchicalEntity{
				Name: removeExtensionFrom(f.Name),
				Type: "article",
				URI: makeURI(
					absolutePath, config.articleRoot) + "/" + makeURI(f.Name,
					config.articleRoot,
				),
			})
		}
	}

	// Check if the folder has a readme
	README := ""
	if r, err := os.ReadFile(absolutePath + "/README.md"); err == nil {
		README = string(r)
	}

	// Make the folder struct and render it.
	html := renderFolder(
		Folder{
			ID:    makeID(absolutePath),
			URI:   makeURI(absolutePath, config.articleRoot),
			Title: folderName,
			Children: Children{
				Articles: articles,
				Folders:  folders,
			},
			Hierarchy: makeHierarchy(absolutePath, config.articleRoot),
			README:    README,
		})

	// Small little local helper to keep things short
	_writeFolder := func(isRoot bool) {
		prefix := config.outputFolder + makeURI(absolutePath, config.articleRoot)
		if isRoot {
			prefix += "/ROOT"
		}

		writeFile(prefix+"/index.html", []byte(html))

		if config.meta.GenerateJSON {
			jsonData, _ := jsonMarshal(folder)
			writeFile(prefix+"/index.json", jsonData)
		}
	}

	if absolutePath == config.articleRoot {
		_writeFolder(true)
	} else {
		_writeFolder(false)
	}
}

func writeEntities(config *BockConfig) {
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

	// Process entities in simple waitgroups... for now. This creates as many
	// coroutines as articles and gets really slow on machines with low memory.
	entityWaitGroup := new(sync.WaitGroup)

	fmt.Println("Will write", config.meta.ArticleCount, "articles")
	for _, e := range *config.listOfArticles {
		entityWaitGroup.Add(1)

		go func(e Entity, stmt *sql.Stmt, config *BockConfig) {
			defer entityWaitGroup.Done()
			writeArticle(e.path, config, e, stmt)
		}(e, stmt, config)
	}

	fmt.Println("Will write", config.meta.FolderCount, "folders")
	for _, e := range *config.listOfFolders {
		entityWaitGroup.Add(1)

		go func(e string, stmt *sql.Stmt, config *BockConfig) {
			defer entityWaitGroup.Done()
			writeFolder(e, config)
		}(e, stmt, config)
	}

	entityWaitGroup.Wait()

	fmt.Printf("\033[2K\r")
	fmt.Println("Finished writing all entities")
	tx.Commit()
}

func writeTree(config *BockConfig) {
	s, _ := jsonMarshal(config.entityTree)
	writeFile(config.outputFolder+"/tree.json", s)
}

func writeRandom(config *BockConfig) {
	html := renderRandom(config)
	writeFile(config.outputFolder+"/random/index.html", []byte(html))
}

// rebuildArticle re-renders a single article and updates the database.
// Used by the dev server for incremental rebuilds.
func rebuildArticle(config *BockConfig, articlePath string) {
	info, err := os.Stat(articlePath)
	if err != nil {
		fmt.Println("WARN: could not stat", articlePath, ":", err)
		return
	}

	entity := Entity{
		Name:        info.Name(),
		SizeInBytes: info.Size(),
		Modified:    info.ModTime(),
		path:        articlePath,
	}

	title := removeExtensionFrom(entity.Name)
	uri := makeURI(articlePath, config.articleRoot)
	relativePath := makeRelativePath(articlePath, config.articleRoot)

	contents, err := os.ReadFile(articlePath)
	if err != nil {
		fmt.Println("WARN: could not read", articlePath, ":", err)
		return
	}

	article := Article{
		Hierarchy:    makeHierarchy(articlePath, config.articleRoot),
		Html:         "",
		ID:           makeID(articlePath),
		path:         articlePath,
		Size:         entity.SizeInBytes,
		Source:       string(contents),
		Title:        title,
		Untracked:    true,
		URI:          uri,
		RelativePath: relativePath,
	}

	// Update the database row
	if config.database != nil {
		config.database.Exec(
			"INSERT OR REPLACE INTO articles (id, content, modified, title, uri) VALUES (?, ?, ?, ?, ?)",
			article.ID, string(contents), entity.Modified.UTC(), title, uri,
		)
		// Rebuild the FTS index
		config.database.Exec("INSERT INTO articles_fts(articles_fts) VALUES('rebuild')")
	}

	html, raw := renderArticle(contents, article, "article", config)
	article.Html = html

	writeFile(config.outputFolder+uri+"/index.html", []byte(html))

	if config.meta.GenerateRaw {
		writeFile(config.outputFolder+uri+"/raw.txt", []byte(raw))
	}

	if config.meta.GenerateJSON {
		jsonData, _ := jsonMarshal(article)
		writeFile(config.outputFolder+uri+"/index.json", jsonData)
	}

	fmt.Printf("  %s\n", relativePath)
}
