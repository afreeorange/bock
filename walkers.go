// These walk filesystems

package main

import (
	"errors"
	"fmt"
	"io/fs"
	"log"
	"os"
	"path"
	"path/filepath"
	"sort"
	"strings"

	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing/object"
)

// makeListsOfEntities returns relative paths to the list of all valid articles
// folders found in the supplied absolute or relative article path. A 'valid'
// article is something that ends in '.md', is not a dotfile, and does not
// match any of the excluded paths specified in constants.go. Folders are
// derived from valid article paths: any folder that contains an *invalid*
// article path will not be in the returned list.
func makeListsOfEntities(config *BockConfig) (
	listOfArticlePaths []string,
	listOfFolderPaths []string,
	err error,
) {
	walkFunction := func(
		entityPath string,
		entityInfo os.FileInfo,
		walkErr error,
	) error {
		relativePath := makeRelativePath(entityPath, config.articleRoot)

		isValidArticle := (!entityInfo.IsDir() &&
			!IGNORED_ENTITIES_REGEX.MatchString(entityPath) &&
			!hasDotEntities(path.Dir(relativePath)) &&
			filepath.Ext(entityPath) == ".md")

		if isValidArticle {
			listOfArticlePaths = append(listOfArticlePaths, entityPath)

			/*
			   Now process folder lists. For example,

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
			folderPath := path.Dir(entityPath)
			folderSplits := strings.Split(makeRelativePath(folderPath, config.articleRoot), "/")

			// Because this walk function is applied to each path found, this gets reset!
			p := ""

			if len(folderSplits) > 1 {
				for _, s := range folderSplits {
					p += "/" + s
					listOfFolderPaths = append(listOfFolderPaths, config.articleRoot+p)
				}
			} else {
				listOfFolderPaths = append(listOfFolderPaths, folderPath)
			}
		}

		return nil
	}

	err = filepath.Walk(config.articleRoot, walkFunction)
	listOfFolderPaths = uniqueStringsInList(listOfFolderPaths)

	return listOfArticlePaths, listOfFolderPaths, err
}

func makeTreeOfEntities(config *BockConfig) []Folder {
	tree := []Folder{}

	// Bootstrap: create and append the root entity (a folder)
	tree = append(tree, Folder{
		Children: Children{Articles: nil, Folders: nil},
		Title:    "Root",
		URI:      "/ROOT",
		path:     ".",
	})

	// These loops took me an embarrassingly LONG while to write :/

	for _, ap := range *config.listOfArticlePaths {
		// First, remove the article root and get relative paths. Then split
		// into fragments.
		pathFragments := strings.Split(makeRelativePath(ap, config.articleRoot), "/")
		fmt.Println(">>>", pathFragments)

		// // Now loop over each fragment
		// for _, fragment := range pathFragments {

		// 	subFolder := tree[0]

		// 	// Simple: we have a root-level article. Append it!
		// 	if strings.HasSuffix(fragment, ".md") {
		// 		subFolder.Children.Articles = append(subFolder.Children.Articles, Article{
		// 			path:  ap,
		// 			Id:    "Foo",
		// 			Title: fragment,
		// 			URI:   "Lol",
		// 			Size:  0,
		// 			// Created: ,
		// 			Hierarchy: []HierarchicalEntity{},
		// 		})
		// 	}
		// }

		// // Use this to build the URI. Reset with each iteration.
		// uri := ""

		// Start at the root entity for each iteration
		// subEntity := tree[0]

		// for _, fragment := range pathFragments {
		// 	fmt.Println("", fragment)

		// maybeChildIndex := findChildWithName(subEntity.Children, fragment)
		// uri = uri + "/" + fragment
		// fmt.Println(">>>", fragment, uri)

		// // This path fragment does not exist in the current entity. We need
		// // to create something. It could be an article or a folder.
		// //
		// if maybeChildIndex == -1 {
		// 	if index+1 == len(pathFragments) {
		// 		// This is the last element of the path fragments: We have an
		// 		// article. Just append its metadata.
		// 		//
		// 		*subEntity.Children = append(*subEntity.Children, article)
		// 	} else {
		// 		// We need to create a new folder here.
		// 		//
		// 		*subEntity.Children = append(*subEntity.Children, Entity{
		// 			Children:     &[]Entity{},
		// 			IsFolder:     true,
		// 			Name:         fragment,
		// 			RelativePath: strings.TrimPrefix(uri, "/"),
		// 			SizeInBytes:  0,
		// 			Title:        fragment,
		// 			URI:          makeURI(uri, config.articleRoot),
		// 			path:         article.path,
		// 		})
		// 	}
		// }

		// // Now recompute the index and update the sub entity we're dealing with.
		// // It's some child of the entity we started with!
		// childIndex := findChildWithName(subEntity.Children, fragment)
		// subEntity = (*subEntity.Children)[childIndex]
		// }
	}

	return tree
}

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
			log.Println("Could not get files for commit: ", c.Hash)
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
		Name:         info.Name(),
		path:         path,
		RelativePath: makeRelativePath(path, config.articleRoot),
		SizeInBytes:  info.Size(),
		Title:        removeExtensionFrom(info.Name()),
		URI:          makeURI(path, config.articleRoot),
	}

	return &entity
}

// Return the array index of entity with the given name if exists in another
// entity's list of children. If it doesn't exist, return -1. Helper function
// for `makeEntityTree`.
func findChildWithName(children *[]Entity, name string) int {
	for index, c := range *children {
		if c.Name == name {
			return index
		}
	}

	return -1
}
