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

* [ ] FIX THE NAVIGATION FFS
* [ ] Table of Contents
* [ ] Recent Changes (Global)
* [ ] Syntax Highlighting
* [x] JSON for Revision
* [ ] STATS : Oldest and newest article
* [ ] STATS : Average number of revisions
* [ ] STATS : Total words
* [ ] STATS : Average words per article (length)
* [ ] Compare Page
* [ ] Fix timestamps; make them consistent
* [x] Fix builds on cimg/go:1.18
* [x] 404 Page
* [ ] Template argument
* [ ] [Markdown highlight in Raw view](https://www.zupzup.org/go-markdown-syntax-highlight-chroma/)
* [ ] [Filtering logs with filename is very slow in `go-git`](https://github.com/go-git/go-git/issues/137)

### Versioning

Did this before I specified the version in `constants.go`. It has its advantages.

```golang

```

---

```bash
rm -rf $HOME/Desktop/temp/*; time go run --tags "fts5" . -a $HOME/personal/wiki.nikhil.io.articles -o $HOME/Desktop/temp
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

## References

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

### Concurrency/Parallelism

If you understand this enough you can roll your own with WaitGroup and channels.

* https://github.com/remeh/sizedwaitgroup
* https://github.com/nozzle/throttler

### Books

* [Learning Go](https://miek.nl/go/learninggo.html)
* [Lexical Scanning in Go](https://www.youtube.com/watch?v=HxaD_trXwRE)

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

Uses [pongo2](https://github.com/flosch/pongo2) for a Django/Nunjucks-style syntax since I don't yet like the Golang's [`text/template`](https://pkg.go.dev/text/template). There's a base template that's embedded in the built binary which isn't too bad-looking but I'll add a way to specify custom templates later.

### Template Types

- `archive`
- `article`
- `folder`
- `index`
- `not-found`
- `raw`
- `revision`
- `revision-list`
- `revision-raw`

## Search

Powered by [SQL.js](https://github.com/sql-js/sql.js/).
