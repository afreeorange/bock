[![CircleCI](https://circleci.com/gh/afreeorange/bockgo/tree/master.svg?style=svg)](https://circleci.com/gh/afreeorange/bockgo/tree/master)

# bock 🍺

A small personal Markdown and `git`-powered wiki I wrote to teach myself Go. [You can see it in action here](https://wiki.nikhil.io/).

I have old [Node](https://github.com/afreeorange/bock/tree/node) and [Python](https://github.com/afreeorange/bock/tree/python) versions of this as well for giggles.

## Usage

See [the releases page](https://github.com/afreeorange/bock/releases) for a few pre-built binaries.

Here's how you can run from source:

```bash
# Clone repo
git clone https://github.com/afreeorange/bock.git

# Now point it at a git repository full of Markdown files
# and tell it where to generate the output. You need to use
# absolute paths for now.
go run --tags "fts5" . --in=/path/to/repo --out=/path/to/output --without-revisions

# If your article repository is managed by git, you can omit
# that last flag to generate ✨article revisions✨
go run --tags "fts5" . --in=/path/to/repo --out=/path/to/output
```

Add a `--help` flag to see some more options.

## Terminology and Setup

An **Entity** is either

- An **Article**, a Markdown file ending in `.md` somewhere in your article repository, or
- A **Folder**, which is exactly what you think it is. You can organize your articles into folders at any depth.
- A **Revision** is a `git` commit that modifies an Article.

Other stuff:

- The name of the Markdown file is the _title_ of the article and will be served at a simplified URI with underscores. For example,
  - `/Notes on Deleuze.md` will be served at `/Notes_on_Deleuze`
  - `/Tech Stuff/OpenBSD/pf Notes.md` will be served at `/Tech_Stuff/OpenBSD/pf_Notes`
- The root of the generated wiki will always redirect to `/Home` (for now) so you will need a `Home.md`.
  - You'll be warned if you don't have one.
  - It will be generated if you don't have one.
- The paths `raw`, `revisions`, `random`, and `archive` are reserved. So, for example, don't create a `raw.md` anywhere. It will be overwritten.
- You can place static assets in `__assets` in your article repository. You can reference all assets in there in your Markdown files prefixed with `/assets` (e.g. `__assets/some-file.jpg` &rarr; `/assets/some-file.jpg`). [Here's an example](https://wiki.nikhil.io/Types_of_Documentation/raw/).
- Any dotfiles or dotfolders are ignored when generating the entity-tree.
  - This includes `node_modules`. See [this file](https://github.com/afreeorange/bock/blob/master/constants.go) for other things. It's a small list.

That's really about it.

## What It Does

The first command in the "Usage" section will generate the following (using [this article](https://wiki.nikhil.io/CNN-IBNs_List_of_the_100_Greatest_Indian_Films_of_All_Time) as an example):

* Every Markdown article in your repository rendered as [HTML](https://wiki.nikhil.io/CNN-IBNs_List_of_the_100_Greatest_Indian_Films_of_All_Time/), [Raw Markdown](https://wiki.nikhil.io/CNN-IBNs_List_of_the_100_Greatest_Indian_Films_of_All_Time/raw/), and [JSON](https://wiki.nikhil.io/CNN-IBNs_List_of_the_100_Greatest_Indian_Films_of_All_Time/index.json)
* A [listing of all revisions](https://wiki.nikhil.io/CNN-IBNs_List_of_the_100_Greatest_Indian_Films_of_All_Time/revisions) for each article, if applicable. Some articles can be untracked and they will be annotated as such.
* Each article's revision rendered as [HTML](https://wiki.nikhil.io/CNN-IBNs_List_of_the_100_Greatest_Indian_Films_of_All_Time/revisions/04c7d651/) and [Raw Markdown](https://wiki.nikhil.io/CNN-IBNs_List_of_the_100_Greatest_Indian_Films_of_All_Time/revisions/04c7d651/raw) (Unless you set `-R=false`. Things will go _much_ faster too!)
* Each folder's structure in [HTML](https://wiki.nikhil.io/Food/) and [JSON](https://wiki.nikhil.io/Food/index.json)
* [An archive page](https://wiki.nikhil.io/archive/) that lets you search your articles thanks to SQLite and [SQL.js](https://github.com/sql-js/sql.js/)
* A Homepage (if it doesn't exist as `Home.md`) at [`/Home`](https://wiki.nikhil.io/Home/)
* A page that redirects to some random article at [`/random`](https://wiki.nikhil.io/random/)
* An index page that redirects to `/Home`
* A 404 Page at [`/404.html`](https://wiki.nikhil.io/404.html)

A giant work in progress but works pretty well for me so far. Uses a baby implementation of Go's [WaitGroups](https://gobyexample.com/waitgroups) so will be slow on older machines or those with less memory.

## Upcoming Features

- [ ] Recently added articles
- [ ] Recently updated articles
- [ ] Articles that have not been checked in! "Warning you have x untracked articles...."
- [ ] Revision Search in DB
- [ ] Categories/Tags
- [ ] Frontmatter support
- [ ] Local development server with live-reloading
- [ ] Customizable Templates with config JSON/YAML
- [x] Option to disable revision histories
- [ ] Better/finer concurrency control
- [ ] [Table of Contents](https://github.com/abhinav/goldmark-toc)
- [ ] [Treeviews in CSS](https://iamkate.com/code/tree-views/)
- [x] MathJAX Support
  - [ ] Self-hosted MathJAX
- [ ] [Password-protected articles](https://github.com/robinmoisson/staticrypt)?
- [ ] [SQLite Driver without CGO](https://gitlab.com/cznic/sqlite)? Appears to be slower but I don't care.
