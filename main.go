package main

import (
	_ "embed"
	"fmt"
	"os"
	"strings"

	_ "github.com/mattn/go-sqlite3"
)

func logo() {
	fmt.Println("     __               __       ")
	fmt.Println("    / /_  ____  _____/ /__     ")
	fmt.Println("   / __ \\/ __ \\/ ___/ //_/   ")
	fmt.Println("  / /_/ / /_/ / /__/ ,<        ")
	fmt.Println(" /_.___/\\____/\\___/_/|_|     ")
	fmt.Println(" v" + VERSION + "              ")
	fmt.Println("                               ")
}

var help = `
Usage: bock <command> [options]

Commands:
  build     Build the wiki (default if no command given)
  serve     Build and serve with live-reload

Build options:
  --in=<path>                 Path to markdown articles (git repository)
  --out=<path>                Where to write the output
  --with-json-files           Generate JSON source files
  --with-raw-markdown-files   Generate raw markdown source files
  --without-revisions         Skip git history (much faster)
  --using-disk-fs             Use on-disk git clone instead of memory

Serve options (in addition to build options):
  --port=<number>             Port to serve on (default 8080)
  --theme=<path>              Theme directory on disk (for live theme dev)

Other:
  --version                   Show version
  --help                      Show this message
`

func parseFlags(args []string) BuildOptions {
	opts := BuildOptions{
		GenerateRevisions: true,
	}

	for _, arg := range args {
		switch {
		case strings.HasPrefix(arg, "--in="):
			opts.ArticleRoot = arg[len("--in="):]
		case strings.HasPrefix(arg, "--out="):
			opts.OutputFolder = arg[len("--out="):]
		case arg == "--with-json-files":
			opts.GenerateJSON = true
		case arg == "--with-raw-markdown-files":
			opts.GenerateRaw = true
		case arg == "--without-revisions":
			opts.GenerateRevisions = false
		case arg == "--using-disk-fs":
			opts.UseOnDiskFS = true
		case strings.HasPrefix(arg, "--theme="):
			opts.ThemePath = arg[len("--theme="):]
		case strings.HasPrefix(arg, "--port="):
			// handled in serve command
		case arg == "--version":
			fmt.Println(VERSION)
			os.Exit(0)
		case arg == "--help":
			logo()
			fmt.Println(help)
			os.Exit(0)
		default:
			fmt.Println("I don't know what this means:", arg)
			fmt.Println("Use --help to see usage.")
			os.Exit(EXIT_INVALID_FLAG_SUPPLIED)
		}
	}

	return opts
}

func parsePort(args []string) int {
	for _, arg := range args {
		if strings.HasPrefix(arg, "--port=") {
			portStr := arg[len("--port="):]
			port := 8080
			fmt.Sscanf(portStr, "%d", &port)
			return port
		}
	}
	return 8080
}

func main() {
	args := os.Args[1:]

	if len(args) == 0 {
		logo()
		fmt.Println(help)
		os.Exit(0)
	}

	// Determine subcommand
	subcommand := "build"
	flagArgs := args

	if args[0] == "build" || args[0] == "serve" {
		subcommand = args[0]
		flagArgs = args[1:]
	}

	opts := parseFlags(flagArgs)

	if opts.ArticleRoot == "" {
		fmt.Println("You must give me an article root (--in=<path>)")
		os.Exit(EXIT_NO_ARTICLE_ROOT)
	}

	if opts.OutputFolder == "" {
		fmt.Println("You must give me an output folder (--out=<path>)")
		os.Exit(EXIT_NO_OUTPUT_FOLDER)
	}

	logo()

	switch subcommand {
	case "build":
		doBuild(opts)
	case "serve":
		port := parsePort(flagArgs)
		doBuild(opts)
		doServe(opts, port)
	}
}
