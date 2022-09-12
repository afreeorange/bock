package main

import (
	_ "embed"
	"flag"
	"fmt"
	"os"
	"runtime"
	"strings"
	"time"

	"github.com/go-git/go-billy/v5/memfs"
	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/storage/memory"
	_ "github.com/mattn/go-sqlite3"
	"github.com/shirou/gopsutil/v3/mem"
)

func main() {
	var articleRoot string
	var generateJSON bool
	var generateRaw bool
	var generateRevisions bool
	var minifyOutput bool
	var outputFolder string
	var useOnDiskFS bool
	var versionInfo bool

	flag.StringVar(&articleRoot, "a", "", "Article root")
	flag.BoolVar(&generateJSON, "j", false, "Create JSON source files")
	flag.BoolVar(&generateRaw, "r", false, "Create Raw markdown source files")
	flag.BoolVar(&generateRevisions, "R", true, "Create article revisions based on git history (default: true)")
	flag.BoolVar(&minifyOutput, "m", false, "Minify all output (HTML, JS, CSS)")
	flag.StringVar(&outputFolder, "o", "", "Output folder")
	flag.BoolVar(&useOnDiskFS, "d", false, "Use on-disk filesystem to clone article repository (slower; cloned to memory by default)")
	flag.BoolVar(&versionInfo, "v", false, "Version info")

	flag.Parse()

	if versionInfo {
		fmt.Println(VERSION)
		os.Exit(0)
	}

	if articleRoot == "" {
		fmt.Println("You must give me an article root.")
		os.Exit(EXIT_NO_ARTICLE_ROOT)
	}

	if outputFolder == "" {
		fmt.Println("You must give me an output folder.")
		os.Exit(EXIT_NO_OUTPUT_FOLDER)
	}

	// Some bookkeeping. Tick.
	start := time.Now()
	v, _ := mem.VirtualMemory()

	// Check if provided root exists
	if _, err := os.Stat(articleRoot); os.IsNotExist(err) {
		fmt.Println("That article root is not a folder or does not exist.")
		os.Exit(EXIT_BAD_ARTICLE_ROOT)
	}

	// Check if it can be read as a git repository only if we're generating
	// revisions
	var repository *git.Repository
	var repoErr error
	if generateRevisions {
		if useOnDiskFS {
			repository, repoErr = git.PlainOpen(articleRoot)
		} else {
			fs := memfs.New()

			repository, repoErr = git.Clone(
				memory.NewStorage(),
				fs,
				&git.CloneOptions{
					URL: articleRoot,
				},
			)
		}

		if repoErr != nil {
			fmt.Println("That article root does not appear to be a git repository.")
			fmt.Println("You can try running me again with '-R=false' and I won't check if it's a git repository.")
			os.Exit(EXIT_NOT_A_GIT_REPO)
		}
	} else {
		fmt.Println("I am not going to generate article revisions.")
	}

	// Gather basic things. Create the output folder first.
	articleRoot = strings.TrimRight(articleRoot, "/")
	outputFolder = strings.TrimRight(outputFolder, "/")
	fmt.Println("Making", outputFolder, "if it doesn't exist")
	os.MkdirAll(outputFolder, os.ModePerm)

	// Get the working tree's status
	worktree, _ := repository.Worktree()
	status, _ := worktree.Status()
	if !status.IsClean() {
		fmt.Println("WARN: Working tree is not clean!")
	}

	// App config
	config := BockConfig{
		articleRoot:    articleRoot,
		entityTree:     nil,
		listOfArticles: nil,
		database:       nil,
		outputFolder:   outputFolder,
		meta: Meta{
			Architecture:      runtime.GOARCH,
			ArticleCount:      0,
			BuildDate:         time.Now().UTC(),
			CPUCount:          runtime.NumCPU(),
			GenerateJSON:      generateJSON,
			GenerateRaw:       generateRaw,
			GenerateRevisions: generateRevisions,
			GenerationTime:    0,
			MemoryInGB:        int(v.Total / (1024 * 1024 * 1024)),
			Platform:          runtime.GOOS,
			RevisionCount:     0,
		},
		started:        time.Now(),
		repository:     repository,
		workTreeStatus: &status,
	}

	// Make a flat list of absolute article paths. Use these to build the entity
	// tree. We do this to prevent unnecessary and empty folders from being
	// created.
	listOfArticles, listOfFolders, _ := makeListOfEntities(&config)

	// Do we even build anything?
	if len(listOfArticles) == 0 {
		fmt.Println("! I could not find any articles to render :/")
		fmt.Println("Quitting.")

		os.Exit(EXIT_NO_ARTICLES_TO_RENDER)
	}

	// We have things to build. Continue configuring.
	config.listOfArticles = &listOfArticles
	config.listOfFolders = &listOfFolders
	config.meta.ArticleCount = len(listOfArticles)
	config.meta.FolderCount = len(listOfFolders)

	fmt.Println("Found", config.meta.ArticleCount, "articles")

	// Make a tree of entities: articles and folders
	entityTree := makeEntityTree(&config)
	config.entityTree = &entityTree

	// Database setup
	db := makeDatabase(&config)
	defer db.Close()
	config.database = db

	// Copy static assets over
	fmt.Print("Creating template assets")
	copyTemplateAssets(&config)
	fmt.Println("... done")

	fmt.Print("Copying assets")
	copyError := copyAssets(&config)
	if copyError != nil {
		fmt.Println("; could not find '__assets' in repository. Ignoring.")
	} else {
		fmt.Println("... done")
	}

	// Process all articles. TODO: Errors?
	writeEntities(&config)

	// Write the index page and other pages
	fmt.Print("Writing index page")
	writeIndex(&config)
	fmt.Println("... done")

	fmt.Print("Writing 404 page")
	write404(&config)
	fmt.Println("... done")

	fmt.Print("Writing archive page")
	writeArchive(&config)
	fmt.Println("... done")

	fmt.Print("Writing tree")
	writeTree(&config)
	fmt.Println("... done")

	fmt.Print("Writing random page")
	writeRandom(&config)
	fmt.Println("... done")

	// Tock
	end := time.Now()
	generationTime := end.Sub(start)
	config.meta.GenerationTime = generationTime
	config.meta.GenerationTimeRounded = generationTime.Round(time.Second)

	fmt.Print("Writing /Home: ")
	writeHome(&config)
	fmt.Println("... done")

	fmt.Printf(
		"\nDone! Finished processing %d articles, %d folders, and %d revisions in %s\n",
		config.meta.ArticleCount,
		config.meta.FolderCount,
		config.meta.RevisionCount,
		config.meta.GenerationTime,
	)
}
