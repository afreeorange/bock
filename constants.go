package main

import (
	"embed"
	"regexp"
	"strings"

	chroma "github.com/alecthomas/chroma/formatters/html"
	"github.com/flosch/pongo2/v5"
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
)

// Things to ignore when walking the article repository. NOTE: In Golang, only
// primitive types (like `int`, `string`, etc) can be constants.
var IGNORED_FOLDERS_REGEX = regexp.MustCompile(
	strings.Join([]string{
		"__assets",
		"_assets",
		"\\.circleci",
		"\\.git",
		"css",
		"img",
		"js",
		"node_modules",
	}, "|"))

var IGNORED_FILES_REGEX = regexp.MustCompile("Home.md")

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
	),
)

//go:embed template
var templatesContent embed.FS
var pongoLoader = pongo2.NewFSLoader(templatesContent)
var templateSet = pongo2.NewSet("template", pongoLoader)

// var _ = pongo2.RegisterFilter("round", func(in, param *pongo2.Value) (out *pongo2.Value, err *pongo2.Error) {
// 	var rounded *pongo2.Value

// 	if s, err := strconv.ParseFloat(in.String(), 32); err == nil {
// 		rounded = pongo2.AsSafeValue(math.Round(s))
// 	} else {
// 		return pongo2.AsSafeValue("!_COULD_NOT_ROUND_VALUE"), &pongo2.Error{OrigError: err}
// 	}

// 	return rounded, nil
// })