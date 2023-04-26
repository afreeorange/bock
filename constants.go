package main

import (
	_ "embed"
	"regexp"
	"strings"
)

//go:embed VERSION
var v []byte
var VERSION string = strings.Trim(string(v), "\n")

// One of the strangest things I learned about Golang!
const DATE_LAYOUT string = "2006-01-02 15:04:05 -0700"

// The name of the SQLite database we will generate from the article repository
const DATABASE_NAME string = "articles.db"

// Where static assets (like images) are placed in the article repository
const ARTICLE_REPOSITORY_ASSETS_FOLDER = "__assets"

// Exit codes
const (
	EXIT_BAD_ARTICLE_ROOT int = iota + 10
	EXIT_DATABASE_ERROR
	EXIT_GENERAL_IO_ERROR
	EXIT_NO_ARTICLE_ROOT
	EXIT_NO_OUTPUT_FOLDER
	EXIT_NOT_A_GIT_REPO
	EXIT_NO_ARTICLES_TO_RENDER
	EXIT_COULD_NOT_GENERATE_LIST_OF_ENTITIES
	EXIT_COULD_NOT_WRITE_ENTITY_TREE
	EXIT_COULD_NOT_CREATE_OUTPUT_FOLDER
	EXIT_INVALID_FLAG_SUPPLIED
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
