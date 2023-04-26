package main

import (
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing/object"
)

func makeHierarchy(path string, articleRoot string) []HierarchicalEntity {
	a := strings.Replace(path, articleRoot, "", -1)
	b := strings.Split(a, "/")
	c := []HierarchicalEntity{}

	uriPath := ""

	for _, p := range b {
		uri := strings.ReplaceAll(strings.TrimSuffix(p, filepath.Ext(p)), " ", "_")

		if p == "" {
			c = append(c, HierarchicalEntity{
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

			c = append(c, HierarchicalEntity{
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

func getEntityInfo(config *BockConfig, info fs.FileInfo, path string) *Entity {
	entity := Entity{
		Children:     &[]Entity{},
		IsFolder:     info.IsDir(),
		Modified:     info.ModTime(),
		Name:         info.Name(),
		path:         path,
		RelativePath: makeRelativePath(path, config.articleRoot),
		SizeInBytes:  info.Size(),
		Title:        removeExtensionFrom(info.Name()),
		URI:          makeURI(path, config.articleRoot),
	}

	return &entity
}

func makeEntityTree(config *BockConfig) []Entity {
	tree := []Entity{}

	// Bootstrap: create adn append the root entity (a folder)
	tree = append(tree, Entity{
		Children:     &[]Entity{},
		IsFolder:     true,
		Modified:     time.Now(),
		Name:         "ROOT",
		RelativePath: ".",
		SizeInBytes:  0,
		Title:        "Root",
		URI:          "/ROOT",
		path:         ".",
	})

	// These loops took me an embarrassingly LONG while to write :/

	for _, article := range *config.listOfArticles {
		pathFragments := strings.Split(article.RelativePath, "/")

		// Use this to build the URI. Reset with each iteration.
		uri := ""

		// Start at the root entity for each iteration
		subEntity := tree[0]

		for index, fragment := range pathFragments {
			maybeChildIndex := findChildWithName(subEntity.Children, fragment)
			uri = uri + "/" + fragment

			// This path fragment does not exist in the current entity. We need
			// to create something. It could be an article or a folder.
			//
			if maybeChildIndex == -1 {
				if index+1 == len(pathFragments) {
					// This is the last element of the path fragments: We have an
					// article. Just append its metadata.
					//
					*subEntity.Children = append(*subEntity.Children, article)
				} else {
					// We need to create a new folder here.
					//
					*subEntity.Children = append(*subEntity.Children, Entity{
						Children:     &[]Entity{},
						IsFolder:     true,
						Modified:     time.Now(),
						Name:         fragment,
						RelativePath: strings.TrimPrefix(uri, "/"),
						SizeInBytes:  0,
						Title:        fragment,
						URI:          makeURI(uri, config.articleRoot),
						path:         article.path,
					})
				}
			}

			// Now recompute the index and update the sub entity we're dealing with.
			// It's some child of the entity we started with!
			childIndex := findChildWithName(subEntity.Children, fragment)
			subEntity = (*subEntity.Children)[childIndex]
		}
	}

	return tree
}

func makeListOfEntities(config *BockConfig) (
	listOfArticles []Entity,
	listOfFolders []string,
	err error,
) {
	walkFunction := func(entityPath string, entityInfo os.FileInfo, walkErr error) error {
		relativePath := makeRelativePath(entityPath, config.articleRoot)

		isValidArticle := (!entityInfo.IsDir() &&
			!IGNORED_ENTITIES_REGEX.MatchString(entityPath) &&
			!hasDotEntities(path.Dir(relativePath)) &&
			filepath.Ext(entityPath) == ".md")

		if isValidArticle {
			listOfArticles = append(
				listOfArticles,
				*getEntityInfo(config, entityInfo, entityPath),
			)

			folderPath := path.Dir(entityPath)

			/*
			   For example,

			   /article/root/sso-react
			   /article/root/sso-react/build/refresh
			   /article/root/sso-react/public/refresh
			   /article/root/sso-react/src/i18n

			   should be

			   /article/root/sso-react
			   /article/root/sso-react/build
			   /article/root/sso-react/build/refresh
			   /article/root/sso-react/public
			   /article/root/sso-react/public/refresh
			   /article/root/sso-react/src
			   /article/root/sso-react/src/i18n

			   That's what we're doing here.
			*/
			folderSplits := strings.Split(makeRelativePath(folderPath, config.articleRoot), "/")
			p := ""
			if len(folderSplits) > 1 {
				for _, s := range folderSplits {
					p += "/" + s
					listOfFolders = append(listOfFolders, config.articleRoot+p)
				}
			} else {
				listOfFolders = append(listOfFolders, folderPath)
			}
		}

		return nil
	}

	// It strikes me that error-handling in Go is a bit strange... looks like
	// things can just fall through.
	err = filepath.Walk(config.articleRoot, walkFunction)
	listOfFolders = uniqueStringsInList(listOfFolders)

	return listOfArticles, listOfFolders, err
}
