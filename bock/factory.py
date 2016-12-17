import os
import logging

from flask import Flask
from .lib import BockCore

logger = logging.getLogger(__name__)


def create_wiki(articles_path=None, debug=False):
    app = Flask(__name__)
    app.debug = debug

    app.config['articles_path'] = articles_path
    if not articles_path:
        app.config['articles_path'] = os.path.abspath(os.path.curdir)
        logger.info('Set article path')

    app.config['bock_core'] = BockCore(
        articles_path=app.config['articles_path']
    )

    app.config['github_key'] = os.getenv('BOCK_GITHUB_KEY', 'XXX')
    logger.info('Github key is {}'.format(app.config['github_key']))

    # Register API and UI blueprints
    from .api import api_blueprint
    app.register_blueprint(api_blueprint, url_prefix='/api')

    from .ui import ui_blueprint
    app.register_blueprint(ui_blueprint)

    return app
