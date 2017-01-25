bock :beer:
===========

A Python-based attempt at a [quick personal wiki][wiki_link]. [These][realms_wiki] wikis [exist][gollum] but aren't the way I'd like them. I write stuff, push to [this repo][article_repo] which triggers a webhook to pull on my server. This project makes my Markdown articles all pretty and searchable.

Installation
------------

In a virtualenv

    pip install git+https://github.com/afreeorange/bock.git

There's a Docker option too. See "Usage".

### GitHub Push

[Create a webhook](https://developer.github.com/webhooks/creating/) that pushes "everything" to

    http://server/api/refresh_articles

On the server, and before you deploy, set an environment variable called `BOCK_GITHUB_KEY` with the secret key you configured for the webhook.

Usage
-----

In a git repository full of Markdown articles, run `bock`. This will start a server on port 8000. To set a different path,

    bock --article-path /path/to/articles

    # This works too
    bock -a /path/to/articles

    # Or if using Docker
    docker run -v /path/to/articles:/articles -p 8000:8000 afreeorange/bock

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
# In the "ui" folder
gulp serve
```

Connect to `localhost:3000` for BrowserSync awesomeness. The Google Analytics token is set via an env var called `GA_TOKEN`

### UI Router

Turns slashes into `~2F`. v0.2.11 doesn't do this but has a host of other problems. The strangest one is how [UI Router's `$state` is empty](https://github.com/angular-ui/ui-router/issues/1627) when I have article paths with slashes.

Other pertinent issues:

* https://github.com/angular-ui/ui-router/issues/2551
* https://github.com/angular-ui/ui-router/issues/1119
* https://github.com/angular-ui/ui-router/issues/1670

Another issue is that UI Router 'swallows' query params in nested states. In this snippet, and when you navigate to `article.raw`, you don't see `?raw` in the URI :/

```javascript
.state('article') {
    url: '/:articleID'
}
.state('article.raw') {
    url: '?raw'
}
```

TODO
----

* [ ] Write and finish tests for UI
* [ ] Write and finish tests for API
* [ ] Fix routing with "/" problem in Angular (only works in Chrome, not Safari or FF)
* [ ] If article path is really a folder, generate list of articles
* [ ] Fix problem with compare (strange Unicode chars from binary to str conversion)
* [ ] Use and update an existing search index if found
* [X] Add Google Analytics
* [ ] Add some shortcut for search overlay
* [ ] Fix issue with document name change (history disappears)
* [X] Add alphabetical list of article titles
* [ ] Add caching (?)
* [ ] Add syntax highlighting for raw Markdown view ([highlight.js](https://highlightjs.org)?)
* [X] Fix ToC bottom border (shouldn't be the same as title)
* [ ] Move to ES6 and Webpack
* [X] Fix issue with Compare view where it incorrectly shows "renamed" (issue due to spaces in title.)
* [ ] Add 'Recent Activity'to /Home

Notes
-----

### Miscellaneous

* `/` is used for article namespaces. However, due to issues with UI Router, slashes are turned into `~2F`. I've given up on trying to fix this.
* `_` is not allowed in titles.
* Files/attachments go in `_files`.
* `.md` is the only valid extension for Markdown files.
* Namespaces are done using folders. They're removed in article titles and in the `title` tag.
* Headings go up to `<h4>`.
* List items go three levels deep.

Based on [RFC 2396](http://www.ietf.org/rfc/rfc2396.txt):

### Reserved Characters

`; / ? : @ & = + $ ,`

* `/` turns in to a `:`, strangely enough
* `:` Cannot be used on OS X
* `?` does not work
* Everything else does

### Unreserved Characters

`- _ . ! ~ * ' ( )`

* All of these work, with the exception of `_` (which, in this app, is used for pretty URLs)

### 'Unwise' Characters

`{ } | \ ^ [ ] ` `

* True to their name: don't use.
* `\` messes up `os.path`.
* The rest get encoded.

### Excluded Set

`< > # % "` and space

* But space is okay since it gets turned into underscore in the Angular app (it's in its encoded form in the API.)

[realms_wiki]: https://github.com/scragg0x/realms-wiki
[gollum]: https://github.com/gollum/gollum
[article_repo]: https://github.com/afreeorange/wiki.nikhil.io.articles
[wiki_link]: http://wiki.nikhil.io
