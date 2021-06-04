import multiprocessing
import os
import random
import sys

# NOTE: Gunicorn will NOT exit gracefully because of this:
# https://github.com/benoitc/gunicorn/issues/1391
#
# This is OK for now. I think.
import gunicorn.app.base
from flask import Flask, Response, jsonify, request, send_file
from flask_cors import CORS
from git import InvalidGitRepositoryError, NoSuchPathError, Repo

from bock import __name__ as package_name
from bock import __version__
from bock.constants import (
    ASSET_PATH,
    EXIT_CODE_ARTICLE_ROOT_NOT_FOUND,
    EXIT_CODE_NOT_A_GIT_REPOSITORY,
    EXIT_CODE_NOT_AN_ABSOLUTE_PATH,
    MAX_NUMBER_OF_WORKERS,
    MIN_CHARS_IN_SEARCH_TERM,
)
from bock.helpers import (
    article_data,
    folder_data,
    path_characteristics,
    pull_changes,
    valid_key__github,
)
from bock.logger import log
from bock.repository import (
    all_articles,
    get_diff,
    get_revision,
    get_revisions,
    get_statistics,
)
from bock.search import get_search_index, search_articles


def pre_flight_check_and_setup(article_root):
    log.info(f"Checking if {article_root} is a git repo")

    try:
        repo = Repo(article_root)

    except NoSuchPathError:
        log.error(f"Could not find {article_root}")
        sys.exit(EXIT_CODE_ARTICLE_ROOT_NOT_FOUND)

    except InvalidGitRepositoryError:
        log.error(f"{article_root} is not a git repository")
        sys.exit(EXIT_CODE_NOT_A_GIT_REPOSITORY)

    # Make sure we have absolute paths; makes life easier
    if not os.path.isabs(article_root):
        log.error(f"Not an absolute path: {article_root}")
        log.error("Please specify an absolute path and try again")
        sys.exit(EXIT_CODE_NOT_AN_ABSOLUTE_PATH)

    article_root = article_root.rstrip("/")
    search_index = get_search_index(article_root)

    if not search_index:
        log.warn(
            "Looks like the search index was not initialized. "
            "You need to run me after you start the watcher! "
            "Will still start the server."
        )

    return article_root, search_index, repo


def number_of_workers():
    return (
        MAX_NUMBER_OF_WORKERS
        if MAX_NUMBER_OF_WORKERS
        else (multiprocessing.cpu_count() * 2) + 1
    )


app = Flask(package_name)

# "In the simplest case, initialize the Flask-Cors extension with default
# arguments in order to allow CORS for all domains on all routes."
#
# This is all we want for local development ♥️
#
# References:
# https://flask-cors.readthedocs.io/en/latest/#simple-usage
CORS(app)


# --- API Routes ---


@app.route("/api/search/<string:term>")
def search(term):
    if not app.config["SEARCH_INDEX"]:
        return {"message": "Search is currently unavailable. Sorry."}, 500

    if len(term) < MIN_CHARS_IN_SEARCH_TERM:
        return {
            "message": (
                "Search term must be at least ",
                f"{MIN_CHARS_IN_SEARCH_TERM} characters in length",
            )
        }

    try:
        results = search_articles(
            app.config["ARTICLE_ROOT"],
            app.config["SEARCH_INDEX"],
            f"*{term}*",
        )
        return jsonify(results)

    except Exception as e:
        log.error(f"Error searching: {str(e)}")
        return {"message": "Could not retrieve search results"}, 500


@app.route("/api/articles/<path:maybe_article>/compare")
def compare(maybe_article):
    is_folder, maybe_folder, is_file, maybe_file = path_characteristics(
        app.config["ARTICLE_ROOT"], maybe_article
    )

    if not is_folder and not is_file:
        return {"message": "Could not find that file or folder"}, 404

    if "a" not in request.args or "b" not in request.args:
        return {"message": "Must give me two SHAs"}, 400

    try:
        ret = get_diff(
            maybe_file,
            app.config["ARTICLE_ROOT"],
            app.config["ARTICLE_REPO"],
            request.args.get("a"),
            request.args.get("b"),
        )

        return Response(ret, mimetype="text/plain")

    except TypeError:
        return {
            "message": "Could not figure out the diff with those SHAs",
        }, 400


@app.route("/api/articles/<path:maybe_article>/revisions/<string:sha>")
def revision(maybe_article, sha):
    is_folder, _, is_file, maybe_file = path_characteristics(
        app.config["ARTICLE_ROOT"], maybe_article
    )

    if not is_folder and not is_file:
        return {"message": "Could not find that file or folder"}, 404

    revision = get_revision(
        maybe_file,
        app.config["ARTICLE_ROOT"],
        app.config["ARTICLE_REPO"],
        sha,
    )

    return (
        revision if revision else {"message": "Could not find that revision"},
        200 if revision else 400,
    )


@app.route("/api/articles/<path:maybe_article>")
def article(maybe_article):
    is_folder, maybe_folder, is_file, maybe_file = path_characteristics(
        app.config["ARTICLE_ROOT"], maybe_article
    )
    if not is_folder and not is_file:
        return {"message": "Could not find that file or folder"}, 404

    if is_file:
        _ = article_data(
            maybe_file,
            app.config["ARTICLE_ROOT"],
            app.config["ARTICLE_REPO"],
        )
        _["revisions"] = get_revisions(maybe_file, app.config["ARTICLE_REPO"])

        return _

    if is_folder:
        return folder_data(
            maybe_folder,
            app.config["ARTICLE_ROOT"],
        )


@app.route("/api/articles/stats")
def stats():
    return get_statistics(
        app.config["ARTICLE_ROOT"],
        [
            _["name"]
            for _ in all_articles(
                app.config["ARTICLE_ROOT"],
                preserve_root=True,
                preserve_extension=True,
            )
        ],
    )


@app.route("/api/articles/all")
def articles():
    _ = all_articles(app.config["ARTICLE_ROOT"])

    return jsonify(
        {
            "articles": _,
            "count": len(_),
        }
    )


@app.route("/api/articles")
@app.route("/api/articles/")
def root():
    return folder_data(
        app.config["ARTICLE_ROOT"],
        app.config["ARTICLE_ROOT"],
    )


@app.route("/api/articles/random")
def random_article():
    return random.choice(all_articles(app.config["ARTICLE_ROOT"]))


@app.route("/api/refresh", methods=["POST"])
def refresh_articles():
    if not app.config["REFRESH_KEY"]:
        return {"message": "App not configured to refresh"}, 500

    # If we aren't using any refresh origin
    if not app.config["REFRESH_ORIGIN"]:
        key_in_request = request.headers.get("Authorization")

        if not key_in_request:
            return {"message": "You have not specified a refresh key"}, 400

        if key_in_request != app.config["REFRESH_KEY"]:
            return {"message": "Invalid key"}, 401

    elif app.config["REFRESH_ORIGIN"] == "github" and not valid_key__github(
        app.config["REFRESH_KEY"], request
    ):
        return {"message": "Invalid signature"}, 401

    errors = pull_changes(app.config["ARTICLE_REPO"])

    return {
        "message": "Attempted refresh",
        "errors": errors,
    }, 500 if errors else 200


@app.route("/api")
def hello():
    return {"message": f"Welcome to {package_name} v{__version__}"}


# --- Static Routes ---


@app.route("/assets/<path:asset>")
def assets(asset):
    return send_file(f"{app.config['ARTICLE_ROOT']}/{ASSET_PATH}/{asset}")


# These handlers serve up the SPA only in a "I'm running Bock locally" context

# TODO: Why do these need to be defined explicitly? Why cannot a lazy-ass
# `<path:asset>` take care of all the routing?
def spa_static_js_asset(spa_asset):
    return send_file(f"ui/cached_dist/static/js/{spa_asset}")


def spa_static_css_asset(spa_asset):
    return send_file(f"ui/cached_dist/static/css/{spa_asset}")


# Take care of anything that might be in the `public` folder
def spa_index_with_article_or_public_asset(maybe_article_path):
    _ = f"{os.path.abspath('.')}/{package_name}/ui/cached_dist/{maybe_article_path}"

    if os.path.exists(_):
        return send_file(_)

    return send_file(f"ui/cached_dist/index.html")


def spa_index():
    return send_file(f"ui/cached_dist/index.html")


# --- Define server config ---


# TODO: This needs to obey the logging setup we have!
class ProductionApp(gunicorn.app.base.BaseApplication):
    def __init__(self, app, options=None):
        self.options = options or {}
        self.application = app
        super().__init__()

    def load_config(self):
        config = {
            key: value
            for key, value in self.options.items()
            if key in self.cfg.settings and value is not None
        }

        for key, value in config.items():
            self.cfg.set(key.lower(), value)

    def load(self):
        return self.application


def run_server(
    article_root,
    host,
    port,
    debug,
    local_invocation=False,
    workers=MAX_NUMBER_OF_WORKERS,
    refresh_key=None,
    refresh_origin=None,
):
    article_root, search_index, repo = pre_flight_check_and_setup(
        article_root,
    )

    app.config["ARTICLE_REPO"] = repo
    app.config["ARTICLE_ROOT"] = article_root
    app.config["SEARCH_INDEX"] = search_index
    app.config["REFRESH_KEY"] = refresh_key
    app.config["REFRESH_ORIGIN"] = refresh_origin

    # Use something like Nginx to serve up the SPA. But if we're running Bock
    # locally, just serve up the UI ♥️
    if local_invocation:
        app.add_url_rule(
            "/static/js/<path:spa_asset>",
            "spa_static_js_asset",
            spa_static_js_asset,
        )
        app.add_url_rule(
            "/static/css/<path:spa_asset>",
            "spa_static_css_asset",
            spa_static_css_asset,
        )
        app.add_url_rule(
            "/<path:maybe_article_path>",
            "spa_index_with_article_or_public_asset",
            spa_index_with_article_or_public_asset,
        )
        app.add_url_rule(
            "/",
            "spa_index",
            spa_index,
        )

    if debug:
        app.run(
            host=host,
            port=port,
            debug=debug,
        )

    else:
        ProductionApp(
            app,
            {
                "bind": f"{host}:{port}",
                "workers": workers,
            },
        ).run()
