bock :beer:
===========

A Python-based attempt at a [quick Markdown-based personal wiki][wiki_link] with a 'modern' responsive frontend based on [MithrilJS][mithril].

Other [such][realms_wiki] [wikis][gollum] exist but aren't the way I'd like them.

I write my articles and [push them to Github][article_repo]. This triggers a webhook to pull the changes onto my server. This project makes my articles all pretty, searchable, and Time-Machine-able 😍

Installation
------------

In a virtualenv

    pip install git+https://github.com/afreeorange/bock.git

There's a Docker option too. See "Usage".

### Environment Variables

* `BOCK_GA_TOKEN` - The Google Analytics token. I use it to build a cached version of the SPA in `bock/ui`.
* `BOCK_GITHUB_KEY` - The Github webhook's secret key.

### Webhook

I have [a webhook](https://developer.github.com/webhooks/creating/) that pushes everything to

    http://{server}/api/refresh_articles

Usage
-----

In a git repository full of Markdown articles, run `bock`. This will start a server on port 8000. To set a different path,

```bash
# Equivalent commands
bock --article-path /path/to/articles
bock -a /path/to/articles

# Or if using Docker
docker run -v /path/to/articles:/articles -p 8000:8000 afreeorange/bock
```

As of now, this will regenerate a full index in `/path/to/articles/.search_index` every time you run that command. However, it will update the index selectively whenever you create, move, modify, or remove articles while the server's running.

Notes on Namespaces and Titles
------------------------------

Use only alphanumeric and these chars in folder names (namespaces) and article titles.

    ; @ & = + $ , - . ! ~ * ' ( )

Foward-slashes will be turned into `~2F`. That's just how it is.

Development
-----------

### API

```bash
# In a folder full of articles
export DEBUG=true && gunicorn bock:instance --reload
```

### UI

```bash
# In the "ui" folder, install dependencies
npm install

# Start a live-reloading server on localhost:9000
npm start

# Build
npm run build
```

TODO
----

* [ ] Write and finish tests for UI
* [ ] Write and finish tests for API
* [ ] If article path is really a folder, generate list of articles
* [ ] Fix problem with compare (strange Unicode chars from binary to str conversion)
* [ ] Use and update an existing search index if found
* [X] Add Google Analytics
* [ ] Add some shortcut for search overlay
* [ ] Fix issue with document name change (history disappears)
* [X] Add alphabetical list of article titles
* [ ] Add caching (?)
* [x] Add syntax highlighting for raw Markdown view
* [X] Fix ToC bottom border (shouldn't be the same as title)
* [X] Move to ES6 and Webpack
* [X] Fix issue with Compare view where it incorrectly shows "renamed" (issue due to spaces in title.)
* [ ] Add 'Recent Activity'to /Home

Notes
-----

### Miscellaneous

* `_` is not allowed in titles.
* Files/attachments go in `_files`.
* `.md` is the only valid extension for Markdown files.
* Namespaces are done using folders. They're removed in article titles and in the `title` tag.
* Headings go up to `<h4>`.
* List items go three levels deep.

### [RFC 2396](http://www.ietf.org/rfc/rfc2396.txt)

#### Reserved Characters

`; / ? : @ & = + $ ,`

* `/` turns in to a `:`, strangely enough
* `:` Cannot be used on OS X
* `?` does not work
* Everything else does

#### Unreserved Characters

`- _ . ! ~ * ' ( )`

* All of these work, with the exception of `_` (which, in this app, is used for pretty URLs)

#### 'Unwise' Characters

`{ } | \ ^ [ ] ` `

* True to their name: don't use.
* `\` messes up `os.path`.
* The rest get encoded.

#### Excluded Set

`< > # % "` and space

* But space is okay since it gets turned into underscore in the Angular app (it's in its encoded form in the API.)

[realms_wiki]: https://github.com/scragg0x/realms-wiki
[gollum]: https://github.com/gollum/gollum
[article_repo]: https://github.com/afreeorange/wiki.nikhil.io.articles
[wiki_link]: http://wiki.nikhil.io
[mithril]: https://mithril.js.org
