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

	// Set up the App config. We pass a reference to this baby around and keep
	// everything in one place <3
	config := BockConfig{
		articleRoot:        strings.TrimRight(articleRoot, "/"),
		database:           nil,
		entityTree:         nil,
		listOfArticlePaths: nil,
		listOfFolderPaths:  nil,
		meta: Meta{
			Architecture:               runtime.GOARCH,
			ArticleCount:               0,
			BuildDate:                  time.Now().UTC(),
			CPUCount:                   runtime.NumCPU(),
			GenerateDatabase:           generateDatabase,
			GenerateJSON:               generateJSON,
			GenerateRaw:                generateRaw,
			GenerateRevisions:          generateRevisions,
			GenerationTime:             0,
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

	setupOutputFolder(outputFolder, &config)
	setupArticleRoot(articleRoot, &config) // Doing this second since it's way more 'expensive'
	setupDatabase(&config)

	log.Println("Found", config.meta.ArticleCount, "articles and", config.meta.FolderCount, "folders")

	// --- At this point, we have things to build/write ---

	writeTemplateAssets(&config)

	// // Make a tree of entities: articles and folders
	// entityTree := makeEntityTree(&config)
	// config.entityTree = &entityTree

	// // Copy static assets over
	// fmt.Print("Creating template assets")
	// copyTemplateAssets(&config)
	// fmt.Println("... done")

	// fmt.Print("Copying assets")
	// copyError := copyAssets(&config)
	// if copyError != nil {
	// 	fmt.Println("; could not find '__assets' in repository. Ignoring.")
	// } else {
	// 	fmt.Println("... done")
	// }

	// // Process all articles. TODO: Errors?
	// writeEntities(&config)

	// // Write the index page and other pages
	// fmt.Print("Writing index page")
	// writeIndex(&config)
	// fmt.Println("... done")

	// fmt.Print("Writing 404 page")
	// write404(&config)
	// fmt.Println("... done")

	// fmt.Print("Writing archive page")
	// writeArchive(&config)
	// fmt.Println("... done")

	// fmt.Print("Writing tree")
	// writeTree(&config)
	// fmt.Println("... done")

	// fmt.Print("Writing random page")
	// writeRandom(&config)
	// fmt.Println("... done")

	// fmt.Print("Writing /Home: ")
	// writeHome(&config)
	// fmt.Println("... done")

	// Tock
	end := time.Now()
	generationTime := end.Sub(start)
	config.meta.GenerationTime = generationTime
	config.meta.GenerationTimeRounded = generationTime.Round(time.Second)

	// Summary
	log.Printf(
		"Done! Finished processing %d articles, %d folders, and %d revisions in %s\n",
		config.meta.ArticleCount,
		config.meta.FolderCount,
		config.meta.RevisionCount,
		config.meta.GenerationTime,
	)

}
