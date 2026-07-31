<img src="https://public.nikhil.io/bock-logo.png" style="width: 14em;" align="right" />

# bock

A small personal Markdown and `git`-powered wiki I wrote to teach myself Go. [You can see it in action here](https://wiki.nikhil.io/).

I have old [Node](https://github.com/afreeorange/bock/tree/node) and [Python](https://github.com/afreeorange/bock/tree/python) versions of this as well for giggles.

## Usage

See [the releases page](https://github.com/afreeorange/bock/releases) for a few pre-built binaries.

Here's how you can run from source:

```bash
git clone https://github.com/afreeorange/bock.git
cd bock && npm install

# Build mode: generate a static wiki
go run --tags "fts5" . build --in=/path/to/repo --out=/path/to/output

# Serve mode: build + live-reload dev server
go run --tags "fts5" . serve --in=/path/to/repo --out=/path/to/output
```

Add `--help` to see all options.

## Commands

### `build`

One-shot static site generation. Reads a git repository of Markdown files, renders everything to HTML, and exits.

```
bock build --in=<path> --out=<path> [options]
```

Options:

- `--in=<path>` &mdash; Path to article repository (required)
- `--out=<path>` &mdash; Output directory (required)
- `--with-json-files` &mdash; Generate JSON alongside HTML
- `--with-raw-markdown-files` &mdash; Generate raw markdown source files
- `--without-revisions` &mdash; Skip git history (much faster)
- `--using-disk-fs` &mdash; Use on-disk git instead of in-memory clone

### `serve`

Builds the wiki and starts a dev server with WebSocket-based live reload. Revisions are always skipped in serve mode for speed.

```
bock serve --in=<path> --out=<path> [options]
```

Additional options:

- `--port=<number>` &mdash; Port to serve on (default 8080)
- `--theme=<path>` &mdash; Theme directory on disk (defaults to `./theme/` if present)

The server watches both the article repository and the theme directory. When files change:

- **Article changes** (.md files) &mdash; incrementally rebuild that article only
- **Theme template changes** (.tsx) &mdash; re-compile the engine and re-render all pages concurrently
- **Static asset changes** (css/js/img) &mdash; copy to output without re-rendering

After any change, the server broadcasts a `reload` message over the WebSocket and the browser refreshes automatically.

## TSX Templating

All page templates and components live in `theme/` as TSX files:

```
theme/
  pages/         # Page templates (one per route type)
  components/    # Shared components (Base, Nav, Footer, etc.)
  static/        # CSS, JS, images served as-is
  tsconfig.json  # IDE type checking via Preact
  globals.d.ts   # Types for formatDate, humanizeNumber
```

Templates are pure function components &mdash; no hooks, no state, no lifecycle methods. They are compiled at startup by esbuild (via Go's esbuild API) and rendered server-side in [goja](https://github.com/dop251/goja) (a Go JS runtime) using [Preact](https://preactjs.com/) + [preact-render-to-string](https://github.com/preactjs/preact-render-to-string).

Two helper functions are injected as globals:

- `formatDate(isoString, goLayout)` &mdash; formats an ISO date using Go's time layout syntax
- `humanizeNumber(n)` &mdash; formats a number with commas (e.g. `1,234,567`)

To rebuild the Preact runtime bundle after upgrading the npm dependency:

```bash
npm install
make bundle
```

## Terminology and Setup

An **Entity** is either

- An **Article**, a Markdown file ending in `.md` somewhere in your article repository, or
- A **Folder**, which is exactly what you think it is. You can organize your articles into folders at any depth.
- A **Revision**, which is a `git` commit that modifies an Article.

Other stuff:

- The name of the Markdown file is the _title_ of the article and will be served at a simplified URI with underscores. For example,
  - `/Notes on Photography.md` will be served at `/Notes_on_Photography`
  - `/Tech Stuff/OpenBSD/pf Notes.md` will be served at `/Tech_Stuff/OpenBSD/pf_Notes`
- The root of the generated wiki will always redirect to `/Home` (for now) so you will need a `Home.md`.
  - You'll be warned if you don't have one.
  - It will be generated if you don't have one.
- The paths `raw`, `revisions`, `random`, and `archive` are reserved. So, for example, don't create a `raw.md` anywhere. It will be overwritten.
- You can place static assets in `__assets` in your article repository. You can reference all assets in there in your Markdown files prefixed with `/assets` (e.g. `__assets/some-file.jpg` &rarr; `/assets/some-file.jpg`). [Here's an example](https://wiki.nikhil.io/Types_of_Documentation/raw.txt).
- Any dotfiles or dotfolders are ignored when generating the entity-tree.
  - This includes `node_modules`. See [this file](https://github.com/afreeorange/bock/blob/master/constants.go) for other things. It's a small list.

## What It Does

The build command generates the following (using [this article](https://wiki.nikhil.io/CNN-IBNs_List_of_the_100_Greatest_Indian_Films_of_All_Time) as an example):

- Every Markdown article in your repository rendered as [HTML](https://wiki.nikhil.io/CNN-IBNs_List_of_the_100_Greatest_Indian_Films_of_All_Time/), [Raw Markdown](https://wiki.nikhil.io/CNN-IBNs_List_of_the_100_Greatest_Indian_Films_of_All_Time/raw/), and [JSON](https://wiki.nikhil.io/CNN-IBNs_List_of_the_100_Greatest_Indian_Films_of_All_Time/index.json)
- A [listing of all revisions](https://wiki.nikhil.io/CNN-IBNs_List_of_the_100_Greatest_Indian_Films_of_All_Time/revisions) for each article, if applicable. Some articles can be untracked and they will be annotated as such.
- Each article's revision rendered as [HTML](https://wiki.nikhil.io/CNN-IBNs_List_of_the_100_Greatest_Indian_Films_of_All_Time/revisions/04c7d651/) and [Raw Markdown](https://wiki.nikhil.io/CNN-IBNs_List_of_the_100_Greatest_Indian_Films_of_All_Time/revisions/04c7d651/raw)
- Each folder's structure in [HTML](https://wiki.nikhil.io/Food/) and [JSON](https://wiki.nikhil.io/Food/index.json)
- [An archive page](https://wiki.nikhil.io/archive/) with full-text search via SQLite and [SQL.js](https://github.com/sql-js/sql.js/)
- A Homepage at [`/Home`](https://wiki.nikhil.io/Home/)
- A page that redirects to a random article at [`/random`](https://wiki.nikhil.io/random/)
- A 404 Page at [`/404.html`](https://wiki.nikhil.io/404.html)

## Architecture

```
main.go           CLI: parse flags, dispatch to build/serve
build.go          Build orchestration, serve mode, re-render logic
renderers.go      Markdown (goldmark) + TSX (Preact/goja) rendering
writers.go        File and database output

tsx/
  engine.go       Compiles TSX via esbuild, renders via goja
  engine_test.go  Unit tests for the rendering engine
  preact.js       Bundled Preact runtime (go:embed-ed into binary)
  preact-entry.js Entry file for rebuilding preact.js

server/
  server.go       HTTP server, WebSocket hub, fsnotify file watcher
  reload.js       Client-side script: reconnects + reloads on message
```
