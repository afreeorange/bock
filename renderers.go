package main

import (
	"bytes"
	"embed"
	"io/fs"
	"os"
	"time"

	"afreeorange/bock/tsx"

	chroma "github.com/alecthomas/chroma/formatters/html"
	mathjax "github.com/litao91/goldmark-mathjax"
	"github.com/yuin/goldmark"
	highlighting "github.com/yuin/goldmark-highlighting"
	"github.com/yuin/goldmark/extension"
	"github.com/yuin/goldmark/renderer/html"
)

var markdown = goldmark.New(
	goldmark.WithRendererOptions(
		html.WithXHTML(),
		html.WithUnsafe(),
		html.WithHardWraps(),
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

//go:embed theme
var themeContent embed.FS

var engine *tsx.Engine

func initEngine() error {
	themeFS, err := fs.Sub(themeContent, "theme")
	if err != nil {
		return err
	}
	engine, err = tsx.NewFromFS(themeFS)
	return err
}

func initEngineFromDisk(themePath string) error {
	var err error
	engine, err = tsx.NewFromFS(os.DirFS(themePath))
	return err
}

func renderIndex(config *BockConfig) string {
	html, _ := engine.Render("Index", map[string]any{
		"type":    "index",
		"version": VERSION,
	})
	return html
}

func renderNotFound(config *BockConfig) string {
	html, _ := engine.Render("NotFound", map[string]any{
		"type":    "not-found",
		"version": VERSION,
	})
	return html
}

func renderRandom(config *BockConfig) string {
	html, _ := engine.Render("Random", map[string]any{
		"list":    config.listOfArticles,
		"type":    "random",
		"version": VERSION,
	})
	return html
}

func renderArticle(
	source []byte,
	article Article,
	entityType string,
	config *BockConfig,
) (string, string) {
	var conversionBuffer bytes.Buffer
	if err := markdown.Convert(source, &conversionBuffer); err != nil {
		panic(err)
	}

	html, _ := engine.Render("Article", map[string]any{
		"created":      article.Created.Format(time.RFC3339),
		"hierarchy":    article.Hierarchy,
		"html":         conversionBuffer.String(),
		"id":           article.ID,
		"modified":     article.Modified.Format(time.RFC3339),
		"revisions":    article.Revisions,
		"sizeInBytes":  article.Size,
		"source":       article.Source,
		"title":        article.Title,
		"untracked":    article.Untracked,
		"uri":          article.URI,
		"relativePath": article.RelativePath,

		"meta":    config.meta,
		"type":    entityType,
		"version": VERSION,
	})

	raw := article.Source
	conversionBuffer.Reset()

	return html, raw
}

func renderFolder(folder Folder) string {
	var conversionBuffer bytes.Buffer
	if err := markdown.Convert([]byte(folder.README), &conversionBuffer); err != nil {
		panic(err)
	}

	html, _ := engine.Render("Folder", map[string]any{
		"children":  folder.Children,
		"hierarchy": folder.Hierarchy,
		"readme":    conversionBuffer.String(),
		"title":     folder.Title,
		"uri":       folder.URI,

		"type":    "folder",
		"version": VERSION,
	})

	conversionBuffer.Reset()

	return html
}

func renderArchive(config *BockConfig) string {
	html, _ := engine.Render("Archive", map[string]any{
		"title": "Archive",
		"tree":  config.entityTree,
		"uri":   "/archive",

		"meta":    config.meta,
		"type":    "archive",
		"version": VERSION,
	})

	return html
}

func renderRevisionList(article Article, revisions []Revision) string {
	html, _ := engine.Render("RevisionList", map[string]any{
		"revisions": revisions,
		"hierarchy": article.Hierarchy,
		"title":     article.Title,
		"uri":       article.URI,

		"type":    "revision-list",
		"version": VERSION,
	})

	return html
}

func renderRevision(article Article, revision Revision) (string, string) {
	var conversionBuffer bytes.Buffer
	if err := markdown.Convert([]byte(revision.Content), &conversionBuffer); err != nil {
		panic(err)
	}

	revisionMap := map[string]any{
		"AuthorEmail": revision.AuthorEmail,
		"AuthorName":  revision.AuthorName,
		"Date":        revision.Date.Format(time.RFC3339),
		"Id":          revision.Id,
		"ShortId":     revision.ShortId,
		"Subject":     revision.Subject,
		"Content":     revision.Content,
	}

	html, _ := engine.Render("Revision", map[string]any{
		"html":      conversionBuffer.String(),
		"hierarchy": article.Hierarchy,
		"revision":  revisionMap,
		"source":    revision.Content,
		"title":     article.Title,
		"uri":       article.URI,

		"type":    "revision",
		"version": VERSION,
	})

	rawHTML, _ := engine.Render("RevisionRaw", map[string]any{
		"hierarchy": article.Hierarchy,
		"revision":  revisionMap,
		"source":    revision.Content,
		"title":     article.Title,
		"uri":       article.URI,

		"type":    "revision-raw",
		"version": VERSION,
	})

	conversionBuffer.Reset()

	return html, rawHTML
}
