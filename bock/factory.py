import os
import sys

from .logger import logger
from flask import Flask
from git import Repo
from git.exc import InvalidGitRepositoryError
from whoosh.fields import Schema, TEXT, ID
from whoosh.qparser import MultifieldParser, FuzzyTermPlugin
from .api.helpers import create_search_index, populate_search_index


def create_wiki(
        articles_folder=None,
        debug=False,
        search=True,
        refresh_index=True):
    '''Wiki application factory
    '''

    # Create a Flask server and set up the routes
    app = Flask(__name__, template_folder='ui/cached_dist')
    app.debug = debug

    # Configure Markdown conversion settings
    app.config['MARKDOWN_EXTENSIONS'] = [
        'markdown.extensions.abbr',
        'markdown.extensions.admonition',
        'markdown.extensions.attr_list',
        'markdown.extensions.codehilite',
        'markdown.extensions.def_list',
        'markdown.extensions.fenced_code',
        'markdown.extensions.footnotes',
        'markdown.extensions.headerid',
        'markdown.extensions.meta',
        'markdown.extensions.sane_lists',
        'markdown.extensions.smarty',
        'markdown.extensions.tables',
        'markdown.extensions.toc',
        'markdown.extensions.wikilinks',
        'pymdownx.pymdown',
    ]

    app.config['MARKDOWN_EXTENSION_CONFIG'] = {
        'markdown.extensions.codehilite': {
            'css_class': 'code-highlight'
        }
    }

    # Set the path to the repo with Markdown articles
    app.config['ARTICLES_FOLDER'] = articles_folder
    if not articles_folder:
        app.config['ARTICLES_FOLDER'] = os.path.abspath(os.path.curdir)

    # Read from the repo; quit if not a git repo
    try:
        app.config['ARTICLE_REPO'] = Repo(app.config['ARTICLES_FOLDER'])
    except InvalidGitRepositoryError:
        logger.error('{} doesn\'t appear to be a valid '
                     'git repository'.format(app.config['ARTICLES_FOLDER']))
        sys.exit(1)

    # Article Refresh
    app.config['GITHUB_SECRET_KEY'] = os.getenv('GITHUB_SECRET_KEY', 'XXX')

    # SEARCH

    # Define a schema
    app.config['SEARCH_SCHEMA'] = Schema(
                                    title=ID(stored=True, unique=True),
                                    path=ID(stored=True),
                                    content=TEXT,
                                    )

    # Create an index
    with app.app_context():
        app.config['SEARCH_INDEX'] = create_search_index()
        populate_search_index()

    # Create a query parser
    app.config['SEARCH_PARSER'] = MultifieldParser(
                                        ['title', 'content'],
                                        schema=app.config['SEARCH_SCHEMA']
                                        )

    app.config['SEARCH_PARSER'].add_plugin(FuzzyTermPlugin())

    # Register the wiki API and UI blueprints
    from .api import api_blueprint
    app.register_blueprint(api_blueprint, url_prefix='/api')

    from .ui import ui_blueprint
    app.register_blueprint(ui_blueprint)

    return app
