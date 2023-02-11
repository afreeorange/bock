package main

import (
	"embed"
	"regexp"
	"strings"

	chroma "github.com/alecthomas/chroma/formatters/html"
	"github.com/flosch/pongo2/v5"
	mathjax "github.com/litao91/goldmark-mathjax"
	"github.com/yuin/goldmark"
	highlighting "github.com/yuin/goldmark-highlighting"
	"github.com/yuin/goldmark/extension"
	"github.com/yuin/goldmark/renderer/html"
)

//go:embed VERSION
var v []byte
var VERSION string = strings.Trim(string(v), "\n")

const DATE_LAYOUT string = "2006-01-02 15:04:05 -0700"
const DATABASE_NAME string = "articles.db"

// Exit codes
const (
	EXIT_BAD_ARTICLE_ROOT int = iota + 10
	EXIT_DATABASE_ERROR
	EXIT_GENERAL_IO_ERROR
	EXIT_NO_ARTICLE_ROOT
	EXIT_NO_OUTPUT_FOLDER
	EXIT_NOT_A_GIT_REPO
	EXIT_NO_ARTICLES_TO_RENDER
)

// Things to ignore when walking the article repository. NOTE: In Golang, only
// primitive types (like `int`, `string`, etc) can be constants. NOTE: Folders
// beginning with `.` are automatically excluded in the function that uses this
// pattern.
var IGNORED_ENTITIES_REGEX = regexp.MustCompile(strings.Join([]string{
	"__assets",
	"css",
	"Home.md", // This is dealt with separately
	"img",
	"js",
	"node_modules",
}, "|"))

// We use Goldmark as the Markdown converter. Configure it here.
var markdown = goldmark.New(
	goldmark.WithRendererOptions(
		html.WithXHTML(),
		html.WithUnsafe(),
	),
	goldmark.WithExtensions(
		extension.Footnote,
		extension.Linkify,
		extension.Strikethrough,
		extension.Table,
		extension.Typographer,
		extension.GFM,
		highlighting.NewHighlighting(
			highlighting.WithFormatOptions(
				chroma.WithClasses(true),
			),
		),
		mathjax.MathJax,
	),
)

//go:embed template
var templatesContent embed.FS
var pongoLoader = pongo2.NewFSLoader(templatesContent)
var templateSet = pongo2.NewSet("template", pongoLoader)
