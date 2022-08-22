[![CircleCI](https://circleci.com/gh/afreeorange/bockgo/tree/master.svg?style=svg)](https://circleci.com/gh/afreeorange/bockgo/tree/master)

# bock 🍺

A small personal Markdown and `git`-powered wiki I wrote to teach myself Go. [You can see it in action here](https://wiki.nikhil.io/).

```bash
# Clone repo
git clone https://github.com/afreeorange/bockgo.git

# Now point it at a git repository full of Markdown files
# and tell it where to generate the output
go run --tags "fts5" . -a /path/to/repo -o /path/to/output -r -j
```

* You can organize your articles into folders. You cannot use `raw`, `revisions` and `archive` as folder names.
* You can place static assets in `__assets` in your article repository. You can reference all assets in there prefixed with `/assets` (e.g. `__assets/some-file.jpg` &rarr; `/assets/some-file.jpg`).

The command will generate the following:

- Every Markdown article in your repository rendered as Raw Source, HTML, and JSON
- Each article's revision rendered as Raw Source, HTML, and JSON
- A listing of all revisions for each article (if applicable)
- Each folder's structure in HTML and JSON ([example](https://wiki.nikhil.io/Food/))
- An archive page that lets you search your articles
- A Homepage (if it doesn't exist as `Home.md`) at `/Home`
- An index page that redirects to `/Home`
- A 404 Page at `/404.html`

A giant work in progress but works pretty well for me so far. Uses a baby implementation of Go's [WaitGroups](https://gobyexample.com/waitgroups) so will be slow on older machines.
