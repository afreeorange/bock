package main

import (
	"bytes"

	"github.com/flosch/pongo2/v5"
)

var t_archive, _ = templateSet.FromCache("template/archive.html")
var t_article_raw, _ = templateSet.FromCache("template/article-raw.html")
var t_article, _ = templateSet.FromCache("template/article.html")
var t_folder, _ = templateSet.FromCache("template/folder.html")
var t_index, _ = templateSet.FromCache("template/index.html")
var t_not_found, _ = templateSet.FromCache("template/not-found.html")
var t_revision_raw, _ = templateSet.FromCache("template/revision-raw.html")
var t_revision, _ = templateSet.FromCache("template/revision.html")
var t_revisionList, _ = templateSet.FromCache("template/revision-list.html")

func renderIndex() string {
	html, _ := t_index.Execute(pongo2.Context{
		"type":    "index",
		"version": VERSION,
	})

	return html
}

func renderNotFound() string {
	html, _ := t_not_found.Execute(pongo2.Context{
		"type":    "not-found",
		"version": VERSION,
	})

	return html
}

func renderArticle(
	source []byte,
	context Article,
	entityType string,
	config *BockConfig,
) (string, string) {
	var conversionBuffer bytes.Buffer
	if err := markdown.Convert(source, &conversionBuffer); err != nil {
		panic(err)
	}

	baseContext := pongo2.Context{
		"created":     context.FileCreated,
		"hierarchy":   context.Hierarchy,
		"html":        conversionBuffer.String(),
		"id":          context.ID,
		"meta":        config.meta,
		"modified":    context.FileModified,
		"revisions":   context.Revisions,
		"sizeInBytes": context.Size,
		"source":      context.Source,
		"title":       context.Title,
		"untracked":   context.Untracked,
		"uri":         context.URI,

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

func renderFolder(context Folder) string {
	html, _ := t_folder.Execute(pongo2.Context{
		"children":  context.Children,
		"hierarchy": context.Hierarchy,
		"readme":    context.README,
		"title":     context.Title,
		"uri":       context.URI,

		"type":    "folder",
		"version": VERSION,
	})

	return html
}

func renderArchive(config *BockConfig) string {
	html, _ := t_archive.Execute(pongo2.Context{
		"meta":  config.meta,
		"title": "Archive",
		"uri":   "/archive",

		"type":    "archive",
		"version": VERSION,
	})

	return html
}

func renderRevisionList(article Article, revisions []Revision) string {
	html, _ := t_revisionList.Execute(pongo2.Context{
		"revisions": revisions,
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
		"html":     conversionBuffer.String(),
		"revision": revision,
		"source":   revision.Content,
		"title":    article.Title,
		"uri":      article.URI,

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
