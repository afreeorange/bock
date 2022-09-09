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

type HierarchicalObject struct {
	Name string `json:"name"`
	Type string `json:"type"`
	URI  string `json:"uri"`
}

type Children struct {
	Articles []HierarchicalObject `json:"articles"`
	Folders  []HierarchicalObject `json:"folders"`
}

type Article struct {
	Created   time.Time            `json:"created"`
	Hierarchy []HierarchicalObject `json:"hierarchy"`
	Html      string               `json:"html"`
	ID        string               `json:"id"`
	Modified  time.Time            `json:"modified"`
	Revisions []Revision           `json:"revisions"`
	Size      int64                `json:"sizeInBytes"`
	Source    string               `json:"source"`
	Title     string               `json:"title"`
	Untracked bool                 `json:"untracked"`
	URI       string               `json:"uri"`

	// You do NOT want to make this public!
	path string
}

type Folder struct {
	Children  Children             `json:"children"`
	Hierarchy []HierarchicalObject `json:"hierarchy"`
	ID        string               `json:"id"`
	README    string               `json:"readme"`
	Title     string               `json:"title"`
	URI       string               `json:"uri"`
}

type Entity struct {
	Children     *[]Entity `json:"children"`
	IsFolder     bool      `json:"isFolder"`
	Modified     time.Time `json:"modified"`
	Name         string    `json:"name"`
	RelativePath string    `json:"relativePath"`
	SizeInBytes  int64     `json:"sizeInBytes"`
	Title        string    `json:"title"`
	URI          string    `json:"uri"`

	Path string `json:"path"`
}

type Meta struct {
	Architecture          string        `json:"architecture"`
	ArticleCount          int           `json:"articleCount"`
	BuildDate             time.Time     `json:"buildTime"`
	CPUCount              int           `json:"cpuCount"`
	GenerateJSON          bool          `json:"generateJSON"`
	GenerateRaw           bool          `json:"generateRaw"`
	GenerationTime        time.Duration `json:"generationTime"`
	GenerationTimeRounded time.Duration `json:"generationTimeRounded"`
	MemoryInGB            int           `json:"memoryInGB"`
	Platform              string        `json:"platform"`
	RevisionCount         int           `json:"revisionCount"`
}

type BockConfig struct {
	articleRoot    string
	entityTree     *[]Entity
	listOfArticles *[]Entity
	database       *sql.DB
	meta           Meta
	outputFolder   string
	repository     *git.Repository
	started        time.Time
	workTreeStatus *git.Status
}
