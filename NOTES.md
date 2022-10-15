## Development Notes

```bash
# Initialize this project
go mod init afreeorange/bock

# Remove unused mods
go mod tidy

# Remove a package
go get package@none

# Build
CGO_ENABLED=1 go build --tags "fts5" -o "dist/bock-$(uname)-$(uname -m)" .
```

### TODO

* [x] FIX THE NAVIGATION FFS
* [x] FIX THE PATH GENERATION PROBLEM FFS
* [x] FIX FOLDER generation
* [x] Breadcrumbs > Revision
* [ ] Table of Contents
* [ ] Recent Changes (Global)
* [ ] Syntax Highlighting
* [x] JSON for Revision
* [ ] STATS : Oldest and newest article
* [ ] STATS : Average number of revisions
* [ ] STATS : Total words
* [ ] STATS : Average words per article (length)
* [ ] STATS : Recent articles
* [ ] Compare Page
* [x] Fix timestamps; make them consistent
* [x] Fix builds on cimg/go:1.18
* [x] 404 Page
* [ ] Template argument
* [ ] Revisions argument
* [x] Better, less buggy tree
* [ ] Gist of recursive tree generation!
- [ ] Fix issue with apostrophes 🤦‍♀️
* [ ] Use `context` in lieu of `config` struct? What are the dis/advantages?
* [ ] [Markdown highlight in Raw view](https://www.zupzup.org/go-markdown-syntax-highlight-chroma/)
* [ ] [Filtering logs with filename is very slow in `go-git`](https://github.com/go-git/go-git/issues/137)```

---

```bash
rm -rf $HOME/Desktop/temp/*;time go run --tags "fts5" . -a $HOME/personal/wiki.nikhil.io.articles -o $HOME/Desktop/temp
pushd $HOME/Desktop/temp; find . -type f -exec gzip -9 '{}' \; -exec mv '{}.gz' '{}' \;; popd
aws s3 sync $HOME/Desktop/temp/ s3://wiki.nikhil.io/ --delete --content-encoding gzip --size-only --profile nikhil.io
```

## Libraries

* A possible [progress bar](https://github.com/vbauerster/mpb).
* Hugo uses [afero](https://github.com/spf13/afero) as its filesystem abstraction layer. I have not needed it. Yet.
* Structured Logging with [Logrus](https://github.com/sirupsen/logrus).
* [This is Commander](https://github.com/spf13/cobra) but for golang <3 Maybe not necessary here since the `flag` library in STDLIB has everything I need. But longopts are nice!
* [Cobra](https://cobra.dev/) is a full-featured CLI app framework
* [gin](https://github.com/codegangsta/gin) for live-reloading
* [Martini](https://github.com/go-martini/martini) for a web framework
* [Gore](https://github.com/x-motemen/gore) for a REPL
* [Minifier](https://github.com/tdewolff/minify) for HTML, CSS, XML, etc
* [Awesome Go](https://awesome-go.com/)
* [go-flags](https://github.com/jessevdk/go-flags) for CLI opt parsing. A bit heavy but appears to get the job done.

## References

* [Go Proverbs](https://go-proverbs.github.io/) - Based on a talk by Rob Pike at GopherFest 2015
* [Go Maps in Action](https://go.dev/blog/maps)
* https://maelvls.dev/go111module-everywhere/
* https://github.com/flosch/pongo2/issues/68
* [Colors in `fmt`](https://golangbyexample.com/print-output-text-color-console/)
* [Versioning](https://stackoverflow.com/questions/11354518/application-auto-build-versioning)
* [Strings](https://dhdersch.github.io/golang/2016/01/23/golang-when-to-use-string-pointers.html)
* [getopts](https://pkg.go.dev/github.com/pborman/getopt)
* [Concurrency and Parallelism "Crash Course"](https://levelup.gitconnected.com/a-crash-course-on-concurrency-parallelism-in-go-8ea935c9b0f8)
* [Templates and Embed](https://philipptanlak.com/mastering-html-templates-in-go-the-fundamentals/#parsing-templates)
* [Recursive copying](https://blog.depa.do/post/copy-files-and-directories-in-go). I love that you have to implement quite a few things by hand in Golang!
* [Chroma/Pygment style reference](https://xyproto.github.io/splash/docs/all.html)
* [Enabling FTS5 with `go-sqlite`](https://github.com/mattn/go-sqlite3/issues/340)
* [Build Tags in Golang](https://www.digitalocean.com/community/tutorials/customizing-go-binaries-with-build-tags)
* [Go Routines Under the Hood](https://osmh.dev/posts/goroutines-under-the-hood)
* [A million files in `git` repo](https://canvatechblog.com/we-put-half-a-million-files-in-one-git-repository-heres-what-we-learned-ec734a764181).
* [A Crash Course on Concurrency & Parallelism in Go](https://levelup.gitconnected.com/a-crash-course-on-concurrency-parallelism-in-go-8ea935c9b0f8)
* [How to have an in-place string that updates on stdout](https://stackoverflow.com/a/52367312)
* [Intro to Golang logging](https://www.honeybadger.io/blog/golang-logging/)

### Concurrency/Parallelism

If you understand this enough you can roll your own with WaitGroup and channels.

* https://github.com/remeh/sizedwaitgroup
* https://github.com/nozzle/throttler

### Books and Other Media

* [Learning Go](https://miek.nl/go/learninggo.html)
* [Lexical Scanning in Go](https://www.youtube.com/watch?v=HxaD_trXwRE)
* Head-First Go is awesome

### Afero Experiment

```go
package main

import (
	"fmt"
	"os"
	"path"
	"path/filepath"
	"strings"

	"github.com/spf13/afero"
)

var fpath = "/Users/nikhil/personal/wiki.nikhil.io.articles"
var fpsaf = path.Dir(fpath) + "/"
var articleFolder = strings.Replace(fpath, fpsaf, "", -1)

func main() {
	fmt.Println("Starting...")

	memFS := afero.NewMemMapFs()
	var _ = memFS

	fmt.Print("Transferring articles to memory: ")
	filepath.Walk(fpath, func(p string, f os.FileInfo, err error) error {
		if f.IsDir() {
			name := strings.Replace(p, fpsaf, "", -1)
			fmt.Print("F")
			memFS.MkdirAll(name, os.ModePerm)
		} else {
			name := strings.Replace(p, fpsaf, "", -1)
			fmt.Print(".")
			contents, _ := os.ReadFile(p)
			afero.WriteFile(memFS, name, contents, os.ModePerm)
		}

		return nil
	})

	fmt.Println()
	fmt.Println("Done")

	fmt.Println("Checking in-memory FS")
	c, _ := afero.ReadFile(memFS, articleFolder+"/"+"Food/Thai Curry Experiments/Thai Green Curry Chicken - Instant Pot.md")
	fmt.Println(">>>", string(c))
}
```

## Rules for Article Repository

* `Home.md` will be the generated homepage 🏠
* Anything in `__assets` folder in your article repository will be copied over to the output folder as-is.
* Reserved paths
  * `/archive`
  * `/{Article Path}/raw`
  * `/{Article Path}/revisions`

## Templating

Uses [pongo2](https://github.com/flosch/pongo2) for a Django/Nunjucks-style syntax since I don't yet like the Golang's [`text/template`](https://pkg.go.dev/text/template). There's a base template that's embedded in the built binary which isn't too bad-looking but I'll add a way to specify custom templates later. Here are [all of Pongo2's filters](https://github.com/flosch/pongo2/blob/master/template_tests/filters.tpl).

The base template uses [the Gruvbox palette](https://github.com/morhetz/gruvbox).

### Template Types

- `archive`
- `article`
- `folder`
- `index`
- `not-found`
- `random`
- `raw`
- `revision`
- `revision-list`
- `revision-raw`

## Search

Powered by [SQL.js](https://github.com/sql-js/sql.js/).

## Simple Progress Bar

```go
package main

import (
	"fmt"
)

// Bar ...
type Bar struct {
	percent int64  // progress percentage
	cur     int64  // current progress
	total   int64  // total value for progress
	rate    string // the actual progress bar to be printed
	graph   string // the fill value for progress bar
}

func (bar *Bar) NewOption(start, total int64) {
	bar.cur = start
	bar.total = total
	if bar.graph == "" {
		bar.graph = "â–ˆ"
	}
	bar.percent = bar.getPercent()
	for i := 0; i < int(bar.percent); i += 2 {
		bar.rate += bar.graph // initial progress position
	}
}

func (bar *Bar) getPercent() int64 {
	return int64((float32(bar.cur) / float32(bar.total)) * 100)
}

func (bar *Bar) Play(cur int64) {
	bar.cur = cur
	last := bar.percent
	bar.percent = bar.getPercent()
	if bar.percent != last && bar.percent%2 == 0 {
		bar.rate += bar.graph
	}
	fmt.Printf("\r[%-50s]%3d%% %8d/%d", bar.rate, bar.percent, bar.cur, bar.total)
}

func (bar *Bar) Finish() {
	fmt.Println()
}
```

### Tree Generating Reference

```go
package main

import (
	"encoding/json"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

var articleRoot = "/Users/nikhil/personal/wiki.nikhil.io.articles"

// var articleRoot = "/Users/nikhil/haha"

var IGNORED_PATHS_REGEX = regexp.MustCompile(
	strings.Join([]string{
		"__a",
		"__assets",
		"_a",
		"_assets",
		".circleci",
		".git",
		"css",
		"img",
		"js",
		"node_modules",
	}, "|"))

type Entity struct {
	IsDir        bool   `json:"isDir"`
	IsSymlink    bool   `json:"isSymlink"`
	LinksTo      string `json:"linksTo"`
	Name         string `json:"name"`
	Path         string `json:"path"`
	RelativePath string `json:"relativePath"`
	Size         int64  `json:"size"`
	URI          string `json:"uri"`

	Children *[]Entity `json:"children"`
}

/*
Recursively create a tree of entities (files and folders)

Inspired by an iterative version here: https://stackoverflow.com/a/32962550
*/
func makeTree(path string, tree *[]Entity, ignoredPaths *regexp.Regexp) {
	currentRoot, _ := os.Stat(path)
	entityInfo := getEntityInfo(currentRoot, path)

	// Make list of the child entities in the path and then filter out any
	// children on the ignored paths list. Note that it is less code to use
	// `ioutil.ReadDir` since it returns the `fs.FileInfo` type but it's
	// deprecated.
	_children, _ := os.ReadDir(path)
	var children []fs.FileInfo

	for _, de := range _children {
		child, _ := de.Info()

		if !ignoredPaths.MatchString(child.Name()) {
			children = append(children, child)
		}
	}

	for i, c := range children {
		child := getEntityInfo(c, filepath.Join(entityInfo.Path, c.Name()))
		*tree = append(*tree, *child)

		if c.IsDir() {
			makeTree(child.Path, (*tree)[i].Children, ignoredPaths)
		}
	}
}

func getEntityInfo(entityInfo fs.FileInfo, path string) *Entity {
	entity := Entity{
		IsDir:    entityInfo.IsDir(),
		Size:     entityInfo.Size(),
		Name:     entityInfo.Name(),
		Path:     path,
		Children: &[]Entity{},
	}

	// Follow symlinks
	if entityInfo.Mode()&os.ModeSymlink == os.ModeSymlink {
		entity.IsSymlink = true
		entity.LinksTo, _ = filepath.EvalSymlinks(filepath.Join(path, entityInfo.Name()))
	}

	return &entity
}

func main() {
	var tree []Entity
	makeTree(articleRoot, &tree, IGNORED_PATHS_REGEX)

	s, _ := json.MarshalIndent(tree, "", "   ")
	fmt.Println(string(s))
}
```

### A Simple Progress Bar

```golang
package main

import (
	"fmt"
	"time"
)

// Bar ...
type Bar struct {
	percent int64  // progress percentage
	cur     int64  // current progress
	total   int64  // total value for progress
	rate    string // the actual progress bar to be printed
	graph   string // the fill value for progress bar
}

func (bar *Bar) New(start, total int64) {
	bar.cur = start
	bar.total = total

	if bar.graph == "" {
		bar.graph = "."
	}

	bar.percent = bar.getPercent()

	for i := 0; i < int(bar.percent); i += 2 {
		bar.rate += bar.graph
	}
}

func (bar *Bar) getPercent() int64 {
	return int64((float32(bar.cur) / float32(bar.total)) * 100)
}

func (bar *Bar) Play(cur int64) {
	bar.cur = cur
	last := bar.percent

	bar.percent = bar.getPercent()

	if bar.percent != last && bar.percent%2 == 0 {
		bar.rate += bar.graph
	}

	fmt.Printf(
		// This is the key thing here to 'redraw' things on screen...
		"\r[%-50s] %2d%% %8d of %d",
		bar.rate,
		bar.percent,
		bar.cur,
		bar.total,
	)
}

func (bar *Bar) Finish() {
	fmt.Println()
}

func main() {
	// Use the bar!
	var bar Bar
	bar.New(0, 100)

	for i := 0; i <= 100; i++ {
		time.Sleep(100 * time.Millisecond)
		bar.Play(int64(i))
	}
	bar.Finish()
}
```

### Pongo2 Custom Filter Sample

```golang
var _ = pongo2.RegisterFilter("round", func(in, param *pongo2.Value) (out *pongo2.Value, err *pongo2.Error) {
	var rounded *pongo2.Value

	if s, err := strconv.ParseFloat(in.String(), 32); err == nil {
		rounded = pongo2.AsSafeValue(math.Round(s))
	} else {
		return pongo2.AsSafeValue("!_COULD_NOT_ROUND_VALUE"), &pongo2.Error{OrigError: err}
	}

	return rounded, nil
})
```

### Local Builds

```bash
docker run -ti -v /Users/nikhil/personal/bock:/home/circleci/project cimg/go:1.18 /home/circleci/project/.scripts/build.sh
```


