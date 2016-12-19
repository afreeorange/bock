import logging
import os
import sys

from .lib import BockCore
from flask import Flask
from git import InvalidGitRepositoryError, NoSuchPathError

logger = logging.getLogger(__name__)


def create_wiki(articles_path=None, debug=False):
    app = Flask(__name__)
    app.debug = debug

    app.config['articles_path'] = articles_path if articles_path \
        else os.path.abspath(os.path.curdir)

    try:
        app.config['bock_core'] = BockCore(
            articles_path=app.config['articles_path']
        )
    except InvalidGitRepositoryError:
        logger.error('{} is not a git repository'.format(
            app.config['articles_path'])
        )
        sys.exit(1)
    except NoSuchPathError:
        logger.error('{} is not a valid filesystem path'.format(
            app.config['articles_path'])
        )
        sys.exit(1)
    else:
        logger.info('Set article path to {}'.format(
            app.config['articles_path'])
        )

    app.config['github_key'] = os.getenv('BOCK_GITHUB_KEY', 'XXX')
    logger.info('Set Github key to {}'.format(app.config['github_key']))

    # Register API and UI blueprints
    from .api import api_blueprint
    app.register_blueprint(api_blueprint, url_prefix='/api')

    from .ui import ui_blueprint
    app.register_blueprint(ui_blueprint)

    return app
