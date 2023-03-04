package main

import (
	"bytes"
	"embed"

	chroma "github.com/alecthomas/chroma/formatters/html"
	"github.com/flosch/pongo2/v5"
	mathjax "github.com/litao91/goldmark-mathjax"
	"github.com/yuin/goldmark"
	highlighting "github.com/yuin/goldmark-highlighting"
	"github.com/yuin/goldmark/extension"
	"github.com/yuin/goldmark/renderer/html"
)

// ---------- Configure Renderers ----------

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

// Now configure Pongo2. We create a new 'set' of templates from the ones we
// embed. This took me forever to figure out...

//go:embed template
var templatesContent embed.FS
var pongoLoader = pongo2.NewFSLoader(templatesContent)
var templateSet = pongo2.NewSet("template", pongoLoader)

var t_archive, _ = templateSet.FromCache("template/archive.njk")
var t_article_raw, _ = templateSet.FromCache("template/article-raw.njk")
var t_article, _ = templateSet.FromCache("template/article.njk")
var t_folder, _ = templateSet.FromCache("template/folder.njk")
var t_index, _ = templateSet.FromCache("template/index.njk")
var t_not_found, _ = templateSet.FromCache("template/not-found.njk")
var t_random, _ = templateSet.FromCache("template/random.njk")
var t_revision_raw, _ = templateSet.FromCache("template/revision-raw.njk")
var t_revision, _ = templateSet.FromCache("template/revision.njk")
var t_revisionList, _ = templateSet.FromCache("template/revision-list.njk")

// ---------- End Configuring Renderers ----------

func renderIndex(config *BockConfig) string {
	html, _ := t_index.Execute(pongo2.Context{
		"type":    "index",
		"version": VERSION,
	})

	return html
}

func renderNotFound(config *BockConfig) string {
	html, _ := t_not_found.Execute(pongo2.Context{
		"type":    "not-found",
		"version": VERSION,
	})

	return html
}

func renderRandom(config *BockConfig) string {
	html, _ := t_random.Execute(pongo2.Context{
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

	baseContext := pongo2.Context{
		"created":     article.Created,
		"hierarchy":   article.Hierarchy,
		"html":        conversionBuffer.String(),
		"id":          article.Id,
		"modified":    article.Modified,
		"revisions":   article.Revisions,
		"sizeInBytes": article.Size,
		"source":      article.Source,
		"title":       article.Title,
		"untracked":   article.Untracked,
		"uri":         article.URI,

		"meta":    config.meta,
		"type":    entityType,
		"version": VERSION,
	}

	html, _ := t_article.Execute(baseContext)

	baseContext.Update(pongo2.Context{
		"type": "raw",
	})

	raw, _ := t_article_raw.Execute(baseContext)

	conversionBuffer.Reset()

	return html, raw
}

func renderFolder(folder Folder) string {
	var conversionBuffer bytes.Buffer
	if err := markdown.Convert([]byte(folder.README), &conversionBuffer); err != nil {
		panic(err)
	}

	html, _ := t_folder.Execute(pongo2.Context{
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
	html, _ := t_archive.Execute(pongo2.Context{
		"title": "Archive",
		"tree":  config.tree,
		"uri":   "/archive",

		"meta":    config.meta,
		"type":    "archive",
		"version": VERSION,
	})

	return html
}

func renderRevisionList(article Article, revisions []Revision) string {
	html, _ := t_revisionList.Execute(pongo2.Context{
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

	baseContext := pongo2.Context{
		"html":      conversionBuffer.String(),
		"hierarchy": article.Hierarchy,
		"revision":  revision,
		"source":    revision.Content,
		"title":     article.Title,
		"uri":       article.URI,

		"type":    "revision",
		"version": VERSION,
	}
	html, _ := t_revision.Execute(baseContext)

	baseContext.Update(pongo2.Context{
		"type": "revision-raw",
	})
	raw, _ := t_revision_raw.Execute(baseContext)

	conversionBuffer.Reset()

	return html, raw
}
