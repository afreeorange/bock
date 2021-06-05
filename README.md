# Bock 🍺

A personal wiki with Python/Flask and TypeScript/React.

## Running

Where `/path/to/articles` is a folder and `git` repo full of Markdown files,

```bash
# With Poetry. Will run on http://localhost:8000
poetry install
poetry run bock-local -a /path/to/articles

# With debugging mode, a different port, a different host. 
# Uses Flask's dev server (so this is not for prod!)
poetry run bock-local -a /path/to/articles -d -p 9000 -h 0.0.0.0

# With 4 Gunicorn workers. Unspecified, uses (2n + 1) detected cores
poetry run bock-local -a /path/to/articles -w 4

# Longopts version, with a production server on http://0.0.0.0:9000 and 4 workers
poetry run bock-local \
    --article-root /path/to/articles \
    --debug \
    --port 9000 \
    --host 0.0.0.0 \
    --workers 4

# With a key that will refresh the articles (with a `git pull`)
# You need to POST http://{HOST}/api/refresh with an `Authorization` header
# set to `SOME_SECRET_KEY`
poetry run bock-local -a /path/to/articles -k SOME_SECRET_KEY

# The same as the above but if you have your articles in Github
poetry run bock-local -a /path/to/articles -k SOME_SECRET_KEY -o github

# Longopts version of the above
poetry run bock-local \
    --article-root /path/to/articles \
    --refresh-key SOME_SECRET_KEY \
    --refresh-origin github

# ALL THE LONG OPTIONS! Note that `--workers` has no effect if `--debug` is set
poetry run bock-local \
    --article-root /path/to/articles \
    --host 0.0.0.0 \
    --port 9000 \
    --debug \
    --workers 4 \
    --refresh-key SOME_SECRET_KEY \
    --refresh-origin github

# --- Docker ---

# Path to articles must be mapped to /articles in the Container!
docker run -v /path/to/articles:/articles -p 8000:8000 bock

# With debugging mode, a different port, a host, and 4 Gunicorn workers
docker run -v /path/to/articles:/articles -p 9000:9000 bock --port 9000 --debug
```

TODO: Document local versus prod, static file generation, watchmode, watchmode with static files, etc.

## Development

```bash
# Run tests
poetry run pytest

# Bump the version (uses bumpversion)
bumpversion patch
bumpversion minor

# Build the project: Wheel + Docker Image
./build
```

### TODO

* [ ] Tests
* [ ] Debugger bails for Flask :/
* [ ] Recursion depth?
* [ ] Article limit?
* [x] Packaging
* [ ] PEX?

### References

* [AsyncIO with Flask and and a SPA](https://github.com/SyntaxRules/svelte-flask/blob/main/run.py)

## License

WTFPL
