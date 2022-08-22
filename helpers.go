package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing/object"
	uuid "github.com/satori/go.uuid"
)

// The JSON marshaller in Golang's STDLIB cannot be configured to disable HTML
// escaping. That's what this function does.
func jsonMarshal(t interface{}) ([]byte, error) {
	buffer := &bytes.Buffer{}

	encoder := json.NewEncoder(buffer)
	encoder.SetEscapeHTML(false)
	encoder.SetIndent("", "  ")

	err := encoder.Encode(t)
	return buffer.Bytes(), err
}

func makeURI(path string, articleRoot string) string {
	uri := strings.ReplaceAll(strings.Replace(path, articleRoot, "", -1), " ", "_")
	return strings.TrimSuffix(uri, filepath.Ext(uri))
}

func makeRelativePath(path string, articleRoot string) string {
	return strings.TrimPrefix(strings.Replace(path, articleRoot, "", -1), "/")
}

func makeID(path string) string {
	return uuid.NewV5(uuid.NamespaceURL, path).String()
}

func removeExtensionFrom(path string) string {
	return strings.TrimSuffix(path, filepath.Ext(path))
}

func makeHierarchy(path string, articleRoot string) []HierarchicalObject {
	a := strings.Replace(path, articleRoot, "", -1)
	b := strings.Split(a, "/")
	c := []HierarchicalObject{}

	uriPath := ""

	for _, p := range b {
		uri := strings.ReplaceAll(strings.TrimSuffix(p, filepath.Ext(p)), " ", "_")

		if p == "" {
			c = append(c, HierarchicalObject{
				Name: "ROOT",
				Type: "folder",
				URI:  "/ROOT",
			})
		} else {
			name := strings.TrimSuffix(p, filepath.Ext(p))
			type_ := "folder"
			uriPath += "/" + uri
			uriPath = strings.TrimLeft(uriPath, "/")

			if filepath.Ext(p) == ".md" {
				type_ = "article"
			}

			c = append(c, HierarchicalObject{
				Name: name,
				Type: type_,
				URI:  uriPath,
			})
		}
	}

	return c
}

type ArticleHistory struct {
	created   time.Time
	modified  time.Time
	revisions []Revision
}

func getArticleHistory(articlePath string, config *BockConfig) (ArticleHistory, error) {
	relativePath := makeRelativePath(articlePath, config.articleRoot)
	revisions := []Revision{}
	ret := ArticleHistory{}

	// TODO: Why does this not work with in-memory FS?
	if config.workTreeStatus.IsUntracked(relativePath) {
		return ret, errors.New("file is untracked")
	}

	commits, _ := config.repository.Log(&git.LogOptions{FileName: &relativePath})

	commits.ForEach(func(c *object.Commit) error {
		fc, err := c.Files()

		if err != nil {
			fmt.Println("Could not get files for commit: ", c.Hash)
		} else {
			fc.ForEach(func(f *object.File) error {
				if f.Name == relativePath {
					rev := Revision{}

					rev.AuthorEmail = c.Author.Email
					rev.AuthorName = c.Author.Name
					rev.Date = c.Author.When.UTC()
					rev.Id = c.Hash.String()
					rev.ShortId = c.Hash.String()[0:8]
					rev.Subject = c.Message

					contents, _ := f.Contents()
					rev.Content = string(contents)

					revisions = append(revisions, rev)
				}

				return nil
			})
		}

		return nil
	})

	sort.Slice(revisions, func(i, j int) bool {
		return revisions[i].Date.After(revisions[j].Date)
	})

	if len(revisions) == 0 {
		return ret, errors.New("file is untracked")
	}

	ret.created = revisions[0].Date.UTC()
	ret.modified = revisions[len(revisions)-1].Date.UTC()
	ret.revisions = revisions

	return ret, nil
}
