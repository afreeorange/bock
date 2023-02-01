package main

import (
	_ "embed"
	"flag"
	"fmt"
	"log"
	"os"
	"runtime"
	"strings"
	"time"

	_ "github.com/mattn/go-sqlite3"
	"github.com/shirou/gopsutil/v3/mem"
)

func init() {
	fmt.Println("     __               __       ")
	fmt.Println("    / /_  ____  _____/ /__     ")
	fmt.Println("   / __ \\/ __ \\/ ___/ //_/   ")
	fmt.Println("  / /_/ / /_/ / /__/ ,<        ")
	fmt.Println("  /_.___/\\____/\\___/_/|_|    ")
	fmt.Println("  v" + VERSION)
	fmt.Println("                               ")
}

func main() {
	var articleRoot string
	var generateJSON bool
	var generateRaw bool
	var generateRevisions bool
	var generateDatabase bool
	var minifyOutput bool
	var outputFolder string
	var useOnDiskFS bool
	var versionInfo bool

	flag.StringVar(&articleRoot, "a", "", "Article root")
	flag.BoolVar(&generateJSON, "j", false, "Create JSON source files")
	flag.BoolVar(&generateRaw, "r", false, "Create Raw markdown source files")
	flag.BoolVar(&generateRevisions, "R", true, "Create article revisions based on git history (default: true)")
	flag.BoolVar(&generateDatabase, "D", true, "Create an SQLite database of your articles and their contents (default: true)")
	flag.BoolVar(&minifyOutput, "m", false, "Minify all output (HTML, JS, CSS)")
	flag.StringVar(&outputFolder, "o", "", "Output folder")
	flag.BoolVar(&useOnDiskFS, "d", false, "Use on-disk filesystem to clone article repository (slower; cloned to memory by default)")
	flag.BoolVar(&versionInfo, "v", false, "Version info")

	flag.Parse()

	// Some bookkeeping. Tick.
	start := time.Now()
	v, _ := mem.VirtualMemory()

	if versionInfo {
		fmt.Println(VERSION)
		os.Exit(0)
	}

	// Set up the App config. We pass a reference to this around and keep
	// everything in one place <3 This is mutated a lot by (a) the bootstrap
	// functions and (b) the helper functions, and no others.
	config := BockConfig{
		articleRoot:        strings.TrimRight(articleRoot, "/"),
		database:           nil,
		tree:               nil,
		listOfArticlePaths: nil,
		listOfArticles:     nil,
		listOfFolderPaths:  nil,
		listOfFolders:      nil,
		meta: Meta{
			Architecture:               runtime.GOARCH,
			ArticleCount:               0,
			BuildDate:                  time.Now().UTC(),
			CPUCount:                   runtime.NumCPU(),
			FolderCount:                0,
			GenerateDatabase:           generateDatabase,
			GenerateJSON:               generateJSON,
			GenerateRaw:                generateRaw,
			GenerateRevisions:          generateRevisions,
			GenerationTime:             0,
			GenerationTimeRounded:      0,
			IsRepository:               false,
			MemoryInGB:                 int(v.Total / (1024 * 1024 * 1024)),
			Platform:                   runtime.GOOS,
			RevisionCount:              0,
			UsingOnDiskFSForRepository: useOnDiskFS,
		},
		outputFolder:   strings.TrimRight(outputFolder, "/"),
		repository:     nil,
		started:        time.Now(),
		workTreeStatus: nil,
	}

	// --- Start updating the application configuration object ---

	setupOutputFolder(outputFolder, &config) // Order matters here
	setupDatabase(&config)
	setupArticleRoot(articleRoot, &config) // This is the most expensive step!

	// --- At this point, we have things to build/write ---

	// Copy static assets. These are for the template itself and whatever one
	// may find in the specified article root.
	writeTemplateAssets(&config)
	writeRepositoryAssets(&config)

	// Generate a tree of entities (articles and folders), the 404, the archive
	// page, and so on
	writeTreeOfEntities(&config)
	write404(&config)
	writeArchive(&config)
	writeRandom(&config)
	writeIndex(&config)

	// // Process all articles. TODO: Errors?
	// writeEntities(&config)

	// fmt.Print("Writing /Home: ")
	// writeHome(&config)
	// fmt.Println("... done")

	// Tock
	end := time.Now()
	config.meta.GenerationTime = end.Sub(start)
	config.meta.GenerationTimeRounded = roundDuration(config.meta.GenerationTime)

	// Done! Now for a summary
	if config.meta.GenerateRevisions {
		log.Printf(
			"Done! Finished processing %d articles, %d folders, and %d revisions in %s",
			config.meta.ArticleCount,
			config.meta.FolderCount,
			config.meta.RevisionCount,
			config.meta.GenerationTimeRounded,
		)
	} else {
		log.Printf(
			"Done! Finished processing %d articles, %d folders in %s",
			config.meta.ArticleCount,
			config.meta.FolderCount,
			config.meta.GenerationTimeRounded,
		)
	}
}
