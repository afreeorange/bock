bock
====

A Python-based attempt at a [quick personal wiki][wiki_link]. [These][realms_wiki] wikis [exist][gollum] but aren't the way I'd like them. I write stuff, push to [this repo][article_repo] which triggers a webhook to pull on my server. This project makes my Markdown articles all pretty and searchable.

Installation
------------

In a virtualenv

    pip install git+https://github.com/afreeorange/bock.git

### GitHub Push

To push articles from GitHub, set an environment variable called `GITHUB_SECRET_KEY` with the... GitHub Secret Key and set the URL to

    http://server/api/refresh_articles

Usage
-----

In a folder full of Markdown articles, run `bock`. This will start a server on port 8000. To set a different path, 

    bock --article-path /path/to/articles
    
    # This works too
    bock -a /path/to/articles

As of now, this will regenerate a full index in `/path/to/articles/.search_index` every time you run that command. However, it will update the index selectively whenever you create, move, modify, or remove articles while the server's running.

Notes
-----

* `/` is used for article namespaces
* `_` is not allowed in titles
* `.md` is the only valid extension for Markdown files.
* The UI must be built before the source distribution
* Namespaces are done using folders. They're removed in article titles and in the `title` tag.
* Headings go up to `<h4>`
* List items go three levels deep

Development
-----------

```bash
# In a folder full of articles
gunicorn bock:instance --reload

# In the "ui" folder
gulp serve
```

Now connect to `localhost:3000` for BrowserSync awesomeness.

TODO
----

* [ ] Write and finish tests for UI
* [ ] Write and finish tests for API
* [ ] Fix routing with "/" problem in Angular (only works in Chrome, not Safari or FF)
* [ ] If article path is really a folder, generate list of articles
* [ ] Fix problem with compare (strange Unicode chars from binary to str conversion)
* [ ] Use and update an existing search index if found
* [ ] Redo logging

[realms_wiki]: https://github.com/scragg0x/realms-wiki
[gollum]: https://github.com/gollum/gollum
[article_repo]: https://github.com/afreeorange/wiki.nikhil.io.articles
[wiki_link]: http://wiki.nikhil.io
