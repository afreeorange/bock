package main

import (
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"time"

	"afreeorange/bock/server"

	"github.com/dustin/go-humanize"
	"github.com/go-git/go-billy/v5/memfs"
	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/storage/memory"
	"github.com/shirou/gopsutil/v3/mem"
)

// doBuild runs a full one-shot build. DB is closed when it returns.
func doBuild(opts BuildOptions) {
	config := doInitialBuild(opts)
	config.database.Close()
}

// doInitialBuild runs a full build and returns the config with the DB still open.
func doInitialBuild(opts BuildOptions) *BockConfig {
	start := time.Now()
	v, _ := mem.VirtualMemory()

	articleRoot := strings.TrimRight(opts.ArticleRoot, "/")
	outputFolder := strings.TrimRight(opts.OutputFolder, "/")

	if _, err := os.Stat(articleRoot); os.IsNotExist(err) {
		fmt.Println("That article root is not a folder or does not exist.")
		os.Exit(EXIT_BAD_ARTICLE_ROOT)
	}

	if opts.ThemePath != "" {
		if err := initEngineFromDisk(opts.ThemePath); err != nil {
			fmt.Println("ERROR: Could not initialize template engine from", opts.ThemePath, ":", err)
			os.Exit(EXIT_GENERAL_IO_ERROR)
		}
	} else {
		if err := initEngine(); err != nil {
			fmt.Println("ERROR: Could not initialize template engine:", err)
			os.Exit(EXIT_GENERAL_IO_ERROR)
		}
	}

	var repository *git.Repository
	var repoErr error
	var repoStatus git.Status

	if opts.GenerateRevisions {
		if opts.UseOnDiskFS {
			repository, repoErr = git.PlainOpen(articleRoot)
		} else {
			fs := memfs.New()
			repository, repoErr = git.Clone(
				memory.NewStorage(),
				fs,
				&git.CloneOptions{URL: articleRoot},
			)
		}

		if repoErr != nil {
			fmt.Println("That article root does not appear to be a git repository.")
			fmt.Println("You can try running me again with '--without-revisions' and I won't check if it's a git repository.")
			os.Exit(EXIT_NOT_A_GIT_REPO)
		}

		workingTree, _ := repository.Worktree()
		repoStatus, _ = workingTree.Status()

		if !repoStatus.IsClean() {
			fmt.Println("WARN: Working tree is not clean!")
		}
	} else {
		fmt.Println("I am not going to generate article revisions.")
	}

	fmt.Println("Making", outputFolder, "if it doesn't exist")
	os.MkdirAll(outputFolder, os.ModePerm)

	config := &BockConfig{
		articleRoot:    articleRoot,
		entityTree:     nil,
		listOfArticles: nil,
		recentArticles: &[]Entity{},
		gitModified:    map[string]time.Time{},
		database:       nil,
		outputFolder:   outputFolder,
		meta: Meta{
			Architecture:      runtime.GOARCH,
			ArticleCount:      0,
			BuildDate:         time.Now().UTC(),
			CPUCount:          runtime.NumCPU(),
			GenerateJSON:      opts.GenerateJSON,
			GenerateRaw:       opts.GenerateRaw,
			GenerateRevisions: opts.GenerateRevisions,
			GenerationTime:    0,
			MemoryInGB:        int(v.Total / (1024 * 1024 * 1024)),
			Platform:          runtime.GOOS,
			RevisionCount:     0,
		},
		started:        time.Now(),
		repository:     repository,
		workTreeStatus: &repoStatus,
	}

	listOfArticles, listOfFolders, _ := makeListOfEntities(config)

	if len(listOfArticles) == 0 {
		fmt.Println("I could not find any articles to render :/")
		fmt.Println("Quitting.")
		os.Exit(EXIT_NO_ARTICLES_TO_RENDER)
	}

	config.listOfArticles = &listOfArticles
	config.listOfFolders = &listOfFolders
	config.meta.ArticleCount = len(listOfArticles)
	config.meta.FolderCount = len(listOfFolders)

	fmt.Println("Found", config.meta.ArticleCount, "articles")

	entityTree := makeEntityTree(config)
	config.entityTree = &entityTree

	db := makeDatabase(config)
	config.database = db

	fmt.Print("Creating template assets")
	copyTemplateAssets(config)
	fmt.Println("... done")

	fmt.Print("Copying assets")
	if copyError := copyAssets(config); copyError != nil {
		fmt.Println("; could not find '__assets' in repository. Ignoring.")
	} else {
		fmt.Println("... done")
	}

	writeEntities(config)

	// Must happen after writeEntities, which is where git commit dates are
	// harvested. Home renders last and is the only consumer.
	recentArticles := makeRecentArticles(config)
	config.recentArticles = &recentArticles
	finalizeDatabase(db)

	fmt.Print("Writing index page")
	writeIndex(config)
	fmt.Println("... done")

	fmt.Print("Writing 404 page")
	write404(config)
	fmt.Println("... done")

	fmt.Print("Writing archive page")
	writeArchive(config)
	fmt.Println("... done")

	fmt.Print("Writing tree")
	writeTree(config)
	fmt.Println("... done")

	fmt.Print("Writing random page")
	writeRandom(config)
	fmt.Println("... done")

	end := time.Now()
	generationTime := end.Sub(start)
	config.meta.GenerationTime = generationTime
	config.meta.GenerationTimeRounded = humanizeDuration(start, end)

	fmt.Print("Writing /Home: ")
	writeHome(config)
	fmt.Println("... done")

	fmt.Printf(
		"\nDone! Finished processing %d articles, %d folders, and %d revisions in %s\n",
		config.meta.ArticleCount,
		config.meta.FolderCount,
		config.meta.RevisionCount,
		config.meta.GenerationTime,
	)

	return config
}

// humanizeDuration renders start..end as relative time, e.g. "5 seconds".
// go-humanize says "now" under a second; say something sensible instead.
func humanizeDuration(start, end time.Time) string {
	if end.Sub(start) < time.Second {
		return "less than a second"
	}

	return strings.TrimSpace(humanize.RelTime(start, end, "", ""))
}

// resolveThemePath returns the on-disk theme directory to watch.
// Prefers --theme flag; falls back to ./theme/ relative to CWD.
func resolveThemePath(explicit string) string {
	if explicit != "" {
		return explicit
	}
	// Look for theme/ in the current working directory
	cwd, _ := os.Getwd()
	candidate := filepath.Join(cwd, "theme")
	if info, err := os.Stat(candidate); err == nil && info.IsDir() {
		return candidate
	}
	return ""
}

func doServe(opts BuildOptions, port int) {
	themePath := resolveThemePath(opts.ThemePath)

	// Serve always loads theme from disk so changes are picked up
	if themePath != "" {
		opts.ThemePath = themePath
	}

	// Skip revisions in serve mode — they are expensive
	opts.GenerateRevisions = false

	// Show all nav icons in serve mode
	opts.GenerateRaw = true
	opts.GenerateJSON = true

	config := doInitialBuild(opts)

	// Show revision icon even though we skipped git history
	config.meta.GenerateRevisions = true
	reRenderAll(config)
	defer config.database.Close()

	articleRoot := strings.TrimRight(opts.ArticleRoot, "/")

	watchDirs := []string{articleRoot}
	if themePath != "" {
		watchDirs = append(watchDirs, themePath)
		fmt.Println("Watching theme at", themePath)
	}

	err := server.Serve(server.Config{
		OutputDir: opts.OutputFolder,
		WatchDirs: watchDirs,
		Port:      port,
		OnChange: func(changedPaths []string) {
			themeChanged := false
			staticChanged := false
			var articlePaths []string

			for _, p := range changedPaths {
				if themePath != "" && strings.HasPrefix(p, themePath) {
					themeChanged = true
					// Static assets (css/js/img) need copying, not re-rendering
					if strings.HasPrefix(p, filepath.Join(themePath, "static")) {
						staticChanged = true
					}
				} else {
					ext := filepath.Ext(p)
					if ext == ".md" && strings.HasPrefix(p, articleRoot) {
						articlePaths = append(articlePaths, p)
					}
				}
			}

			if themeChanged {
				if staticChanged {
					fmt.Println("Static assets changed — copying")
					copyTemplateAssetsFromDisk(config, themePath)
				}

				// Only re-compile and re-render if non-static files changed
				if !staticChanged || len(changedPaths) > countStaticPaths(changedPaths, themePath) {
					fmt.Println("Theme changed — re-rendering")
					if err := initEngineFromDisk(themePath); err != nil {
						fmt.Println("ERROR re-init engine:", err)
						return
					}
					reRenderAll(config)
				}
				return
			}

			for _, p := range articlePaths {
				rebuildArticle(config, p)
			}
		},
	})
	if err != nil {
		fmt.Println("Server error:", err)
		os.Exit(EXIT_GENERAL_IO_ERROR)
	}
}

func countStaticPaths(paths []string, themePath string) int {
	staticPrefix := filepath.Join(themePath, "static")
	n := 0
	for _, p := range paths {
		if strings.HasPrefix(p, staticPrefix) {
			n++
		}
	}
	return n
}

// reRenderAll re-renders every article and special page using the current
// engine. Does NOT redo git/entity discovery or touch the DB — just re-applies
// templates.
func reRenderAll(config *BockConfig) {
	start := time.Now()

	articles := *config.listOfArticles
	sem := make(chan struct{}, runtime.NumCPU())
	var wg sync.WaitGroup

	for _, e := range articles {
		wg.Add(1)
		sem <- struct{}{}
		go func(articlePath string) {
			defer wg.Done()
			defer func() { <-sem }()
			renderToDisk(config, articlePath)
		}(e.path)
	}
	wg.Wait()

	recent := makeRecentArticles(config)
	config.recentArticles = &recent

	writeIndex(config)
	write404(config)
	writeArchive(config)
	writeRandom(config)

	homePath := config.articleRoot + "/Home.md"
	if _, err := os.Stat(homePath); err == nil {
		renderToDisk(config, homePath)
	}

	fmt.Printf("Re-rendered %d pages in %s\n", len(articles), time.Since(start))
}

// renderToDisk renders a single article to its output file without touching the DB.
func renderToDisk(config *BockConfig, articlePath string) {
	info, err := os.Stat(articlePath)
	if err != nil {
		return
	}

	contents, err := os.ReadFile(articlePath)
	if err != nil {
		return
	}

	article := Article{
		Hierarchy:    makeHierarchy(articlePath, config.articleRoot),
		ID:           makeID(articlePath),
		path:         articlePath,
		Size:         info.Size(),
		Source:       string(contents),
		Title:        removeExtensionFrom(info.Name()),
		Untracked:    true,
		URI:          makeURI(articlePath, config.articleRoot),
		RelativePath: makeRelativePath(articlePath, config.articleRoot),
	}

	html, _ := renderArticle(contents, &article, "article", config)
	writeFile(config.outputFolder+article.URI+"/index.html", []byte(html))
}
