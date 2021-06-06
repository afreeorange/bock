# Bock 🍺

[![CircleCI](https://circleci.com/gh/afreeorange/bock/tree/master.svg?style=svg)](https://circleci.com/gh/afreeorange/bock/tree/master)

A personal wiki with Python+Flask and TypeScript+React. Will make articles searchable (using [Whoosh](https://whoosh.readthedocs.io/en/latest/index.html)) and Time Machine™-able (using `git`) and watch a folder for changes (using [`watchgod`](https://pypi.org/project/watchgod/))

## Usage

### You need a Folder Full of Articles

[Here's an example](https://github.com/afreeorange/wiki.nikhil.io.articles). Some rules:

* Must be a `git` repo
* Articles must end with a `.md` extension
* All static assets (like JPGs or TXT files) must live in a folder called `__assets`
* Articles may be organized into folders.
* Folders can only be three levels deep.
* Some files and some folders (like `node_modules`) are ignored. See [this module](https://github.com/afreeorange/bock/blob/master/bock/constants.py) for what's ignored.

### Run Bock

Where `/path/to/articles` is a Folder Full of Articles, grab [the latest release](https://github.com/afreeorange/bock/releases) and then

```bash
# pipx is highly recommended: https://pypa.github.io/pipx
pipx install https://github.com/afreeorange/bock/releases/download/3.4.2/bock-3.4.2-py3-none-any.whl

# Now simply run this and go to http://localhost:8000 ✨
bock-local -a /path/to/articles

# You can see all flags (short and longopts) with
bock-local --help

# A 'full' example that runs the server with four workers on http://0.0.0.0:9000
bock-local \
    --article-root /path/to/articles \
    --port 9000 \
    --host 0.0.0.0 \
    --workers 4
```

This will set up a search index in your article folder called `__bock_search_index`. It will be created just once and updated when you add, remove, or revise an article.

#### Docker Image

Available at `afreeorange/bock:latest` if you don't want to mess with `pipx`. You _must_ map your article path to `/articles` in the container as shown below! Make sure you map the ports as well. All other flags (see `--help`) work as usual. Inside the container, this _will always_ start the server at `0.0.0.0`

```bash
docker run \
    --volume /path/to/articles:/articles \
    --port 8000:8000 \
    afreeorange/bock:latest
```

### Article Refresh

Refresh the Folder Full of Articles via a `git pull`. If you start the server this way,

```bash
bock-local \
    --article-root /path/to/articles \
    --refresh-key SOME_SECRET_KEY
```

you can `POST { "Authorization": "SOME_SECRET_KEY" }` to `http://localhost:8000/api/refresh` to tell the server to pull changes from some remote repo into your Folder Full of Articles. This is useful when you're not running the app locally and deploy it somewhere.

Specifying a `--refresh-origin` will allow you to use Github Webhooks with a Personal Access Token. This is what I do on [my wiki](http://wiki.nikhil.io/Hello). 

```bash
bock-local \
    --article-root /path/to/articles \
    --refresh-key SOME_SECRET_KEY \
    --refresh-origin github
```

## Development

Uses [Poetry](https://python-poetry.org/) for the backend and [CRA](https://create-react-app.dev/) to scaffold the frontend. 

```bash
# Set things up
poetry install
pushd bock/ui; yarn; popd

# Now, in one session, start the API on localhost:8000. This runs the Flask
# debugging server, allowing you to live-reload any changes. It also starts
# the file-watcher process.
poetry run bock-local -a /path/to/articles -d

# In another session, launch the UI on localhost:3000. Will also live-reload
cd bock/ui
yarn start
```

When finished,

```bash
# Commit your changes. Then bump the patch version. You can
# use `bumpversion minor` appropriately. Know what these
# things mean: https://semver.org
bumpversion patch
git push
git push --tags

# This will kick off CI jobs defined in .circleci/config.yaml
# It's a lovely read.
# Note: CircleCI will not build on tags by default.
```

To build and deploy locally,

```bash
# Build the entire project LOCALLY. Makes a wheel in dist/
.scripts/build

# Deploy manually with
.scripts/deploy-docker
.scripts/deploy-wheel
```

### TODO

* [ ] Tests
* [x] Debugger bails for Flask :/
* [x] Recursion depth?
* [ ] Article limit?
* [x] Packaging
* [ ] PEX?

## Deployment

Uses CircleCI's free tier to build [the release wheels](https://github.com/afreeorange/bock/releases) and [the Docker image](https://hub.docker.com/repository/docker/afreeorange/bock). See `.circleci/config.yml` for the CI config.

### On Target

```bash
#!/bin/bash

# Requires the Github CLI and a Personal Access Key
# https://github.com/cli/cli#installation

export GITHUB_TOKEN="SECRET"
export ARTICLE_ROOT="/path/to/articles"
export REFRESH_KEY="SOME_SECRET_KEY"
BOCK_VERSION-$(gh release list --limit 1 --repo afreeorange/bock | awk '{print $1}')

echo "Killing Bock"
pkill -f bock

echo "Upgrading to $BOCK_VERSION"
pip install -U "https://github.com/afreeorange/bock/releases/download/$BOCK_VERSION/bock-$BOCK_VERSION-py3-none-any.whl"

echo "Pulling articles in $ARTICLE_ROOT"
cd /data/wiki && git pull -s recursive -X theirs

echo "Starting local Bock"
bock-local -a "$ARTICLE_ROOT" -k "$REFRESH_KEY" -o github &
```

## References

* [AsyncIO with Flask and and a SPA](https://github.com/SyntaxRules/svelte-flask/blob/main/run.py)

## License

[WTFPL](http://wtfpl.net/)
