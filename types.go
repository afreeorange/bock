package main

import (
	"database/sql"
	"time"

	"github.com/go-git/go-git/v5"
)

type Revision struct {
	AuthorEmail string    `json:"authorEmail"`
	AuthorName  string    `json:"authorName"`
	Date        time.Time `json:"date"`
	Id          string    `json:"id"`
	ShortId     string    `json:"shortId"`
	Subject     string    `json:"subject"`
	Content     string    `json:"content"`
}

type HierarchicalEntity struct {
	Name string `json:"name"`
	Type string `json:"type"`
	URI  string `json:"uri"`
}

type Children struct {
	Articles []HierarchicalEntity `json:"articles"`
	Folders  []HierarchicalEntity `json:"folders"`
}

type ArticleHistory struct {
	created   time.Time
	modified  time.Time
	revisions []Revision
}

type Article struct {
	Id    string `json:"id"`
	Title string `json:"title"`
	URI   string `json:"uri"`

	Hierarchy []HierarchicalEntity `json:"hierarchy"`

	Size     int64     `json:"sizeInBytes"`
	Created  time.Time `json:"created"`
	Modified time.Time `json:"modified"`

	Html   string `json:"html"`
	Source string `json:"source"`

	Untracked bool       `json:"untracked"`
	Unsaved   bool       `json:"unsaved"`
	Revisions []Revision `json:"revisions"`

	// This is the *absolute* path! You do NOT want to make this public!
	path string
}

type Folder struct {
	Id    string `json:"id"`
	Title string `json:"title"`
	URI   string `json:"uri"`

	Hierarchy []HierarchicalEntity `json:"hierarchy"`

	README string `json:"readme"`

	Children Children `json:"children"`

	// This is the *absolute* path! You do NOT want to make this public!
	path string
}

type Meta struct {
	Architecture               string        `json:"architecture"`
	ArticleCount               int           `json:"articleCount"`
	BuildDate                  time.Time     `json:"buildTime"`
	CPUCount                   int           `json:"cpuCount"`
	FolderCount                int           `json:"folderCount"`
	GenerateDatabase           bool          `json:"generateDatabase"`
	GenerateJSON               bool          `json:"generateJSON"`
	GenerateRaw                bool          `json:"generateRaw"`
	GenerateRevisions          bool          `json:"generateRevisions"`
	GenerationTime             time.Duration `json:"generationTime"`
	GenerationTimeRounded      time.Duration `json:"generationTimeRounded"`
	IsRepository               bool          `json:"isRepository"`
	MemoryInGB                 int           `json:"memoryInGB"`
	Platform                   string        `json:"platform"`
	RevisionCount              int           `json:"revisionCount"`
	UsingOnDiskFSForRepository bool          `json:"usingOnDiskFSForRepository"`
}

type BockConfig struct {
	articleRoot        string
	database           *sql.DB
	tree               *[]Folder // Since we always have a `ROOT` folder
	listOfArticlePaths *[]string
	listOfArticles     *[]Article
	listOfFolderPaths  *[]string
	listOfFolders      *[]Folder
	meta               Meta
	outputFolder       string
	repository         *git.Repository
	started            time.Time
	workTreeStatus     *git.Status
}

// --- Remove this ---

type Entity struct {
	Children     *[]Entity `json:"children"`
	IsFolder     bool      `json:"isFolder"`
	Name         string    `json:"name"`
	RelativePath string    `json:"relativePath"`
	SizeInBytes  int64     `json:"sizeInBytes"`
	Title        string    `json:"title"`
	URI          string    `json:"uri"`

	// You do NOT want to make this public!
	path string
}
