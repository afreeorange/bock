package main

import (
	"log"
	"os"

	"github.com/go-git/go-billy/v5/memfs"
	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/storage/memory"
)

func setupRepository(config *BockConfig) {
	var repository *git.Repository
	var status git.Status
	var e error

	if config.meta.GenerateRevisions {
		if config.meta.UsingOnDiskFSForRepository {
			repository, e = git.PlainOpen(config.articleRoot)
		} else {
			fs := memfs.New()

			repository, e = git.Clone(
				memory.NewStorage(),
				fs,
				&git.CloneOptions{
					URL: config.articleRoot,
				},
			)
		}

		if e != nil {
			log.Println("That article root does not appear to be a git repository.")
			log.Println("You can try running me again with '-R=false' and I won't check if it's a git repository.")
			os.Exit(EXIT_NOT_A_GIT_REPO)
		}

		// Get the working tree's status
		workingTree, _ := repository.Worktree()
		status, _ = workingTree.Status()

		if !status.IsClean() {
			log.Println("WARNING: Working tree is not clean!")
		}

		config.meta.IsRepository = true
		config.repository = repository
		config.workTreeStatus = &status
	} else {
		config.meta.IsRepository = false
	}
}

// Checks if the supplied string is (1) a valid folder path and (2) a valid
// repository. If it is, make a list of valid articles and folders and update
// the application configuration with them. If there are no valid articles
// to render, it quits.
func setupArticleRoot(articleRoot string, config *BockConfig) {
  // Did they specify an article root?
	if articleRoot == "" {
		log.Println("You must give me an article root.")
		os.Exit(EXIT_NO_ARTICLE_ROOT)
	}

  // If so, does it exist?
	if _, err := os.Stat(articleRoot); os.IsNotExist(err) {
		log.Println("That article root is not a folder or does not exist.")
		os.Exit(EXIT_BAD_ARTICLE_ROOT)
	}

  // Run some repository checks on the specified article root and update the
  // application configuration object
	setupRepository(config)

  // Just generate lists of things first
	listOfArticlePaths, listOfFolderPaths, err := makeListsOfEntities(config)
  if err != nil {
    log.Println("Could not generate list of entities. Quitting.")
    os.Exit(EXIT_COULD_NOT_GENERATE_LIST_OF_ENTITIES)
  }

  // Now the 'heavy' step of getting article data

  // Some final updates to the application configuration object
	config.articleRoot = articleRoot
	config.listOfArticlePaths = &listOfArticlePaths
	config.listOfFolderPaths = &listOfFolderPaths
	config.meta.ArticleCount = len(listOfArticlePaths)
	config.meta.FolderCount = len(listOfFolderPaths)

	if config.meta.ArticleCount == 0 {
		log.Println("I could not find any articles to render :/")
		log.Println("Quitting.")

		os.Exit(EXIT_NO_ARTICLES_TO_RENDER)
	}
}

func setupOutputFolder(outputFolder string, config *BockConfig) {
	if outputFolder == "" {
		log.Println("You must give me an output folder.")
		os.Exit(EXIT_NO_OUTPUT_FOLDER)
	}

	if _, err := os.Stat(outputFolder); os.IsNotExist(err) {
		log.Println("Making", outputFolder, "since it doesn't exist")
		os.MkdirAll(outputFolder, os.ModePerm)
	}

	config.outputFolder = outputFolder
}

func setupDatabase(config *BockConfig) {
	if config.meta.GenerateDatabase {
		db := makeDatabase(config)
		defer db.Close()
		config.database = db
	}
}
