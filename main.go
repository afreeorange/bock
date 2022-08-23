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
	var versionInfo bool
	var articleRoot string
	var outputFolder string
	var generateJSON bool
	var generateRaw bool
	var useOnDiskFS bool
	var minifyOutput bool

	flag.BoolVar(&versionInfo, "v", false, "Version info")
	flag.StringVar(&articleRoot, "a", "", "Article root")
	flag.StringVar(&outputFolder, "o", "", "Output folder")
	flag.BoolVar(&generateJSON, "j", false, "Create JSON source files")
	flag.BoolVar(&generateRaw, "r", false, "Create Raw markdown source files")
	flag.BoolVar(&useOnDiskFS, "d", false, "Use on-disk filesystem to clone article repository (slower; cloned to memory by default)")
	flag.BoolVar(&minifyOutput, "m", false, "Minify all output (HTML, JS, CSS)")

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

	// Some bookkeeping
	start := time.Now()
	v, _ := mem.VirtualMemory()

	// Check if provided root exists
	if _, err := os.Stat(articleRoot); os.IsNotExist(err) {
		fmt.Println("That article root is not a folder or does not exist.")
		os.Exit(EXIT_BAD_ARTICLE_ROOT)
	}

	// Check if it can be read as a git repository
	var repository *git.Repository
	var err error
	fs := memfs.New()
	if useOnDiskFS {
		repository, err = git.PlainOpen(articleRoot)
	} else {
		repository, err = git.Clone(memory.NewStorage(), fs, &git.CloneOptions{
			URL: articleRoot,
		})
	}

	if err != nil {
		fmt.Println("That article root does not appear to be a git repository.")
		os.Exit(EXIT_NOT_A_GIT_REPO)
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
		articleRoot:  articleRoot,
		database:     nil,
		outputFolder: outputFolder,
		meta: Meta{
			Architecture:   runtime.GOARCH,
			ArticleCount:   0,
			BuildDate:      time.Now().UTC(),
			CPUCount:       runtime.NumCPU(),
			GenerateJSON:   generateJSON,
			GenerateRaw:    generateRaw,
			GenerationTime: 0,
			MemoryInGB:     int(v.Total / (1024 * 1024 * 1024)),
			Platform:       runtime.GOOS,
			RevisionCount:  0,
		},
		started:        time.Now(),
		repository:     repository,
		workTreeStatus: &status,
	}

	// Database setup
	db := makeDatabase(&config)
	defer db.Close()
	config.database = db

	// Copy static assets over
	copyTemplateAssets(&config)
	copyAssets(&config)

	// Process all articles
	if process_error := writeArticles(&config); process_error != nil {
		fmt.Println("Could not write articles: ", err)
	}

	// Tock
	end := time.Now()
	generationTime := end.Sub(start)
	config.meta.GenerationTime = generationTime
	config.meta.GenerationTimeRounded = generationTime.Round(time.Second)

	// Write the index page and other pages
	fmt.Println("Writing index")
	writeIndex(&config)

	fmt.Println("Writing 404 page")
	write404(&config)

	fmt.Println("Writing archive")
	writeArchive(&config)

	fmt.Print("Writing /Home: ")
	writeHome(&config)

	fmt.Printf(
		"\nDone! Finished processing %d articles and %d revisions in %s\n",
		config.meta.ArticleCount,
		config.meta.RevisionCount,
		config.meta.GenerationTime,
	)
}
