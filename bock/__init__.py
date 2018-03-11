from datetime import datetime
import os

from .factory import create_wiki
from .logger import logger


# For development with gunicorn
instance = None
if os.getenv('DEBUG'):
    instance = create_wiki(articles_path=None, debug=True)

# Package metadata
__title__ = 'bock'
__version__ = '2.0.5'
__author__ = 'Nikhil Anand'
__license__ = 'MIT'
__copyright__ = '(c) {} Nikhil Anand'.format(datetime.now().year)
