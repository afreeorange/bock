from datetime import datetime
import os

from .factory import create_wiki
from .logger import logger


# For development with gunicorn
instance = None
if os.getenv('DEBUG'):
    instance = create_wiki()

# Package metadata
__title__ = 'bock'
__version__ = '1.4.1'
__author__ = 'Nikhil Anand'
__license__ = 'MIT'
__copyright__ = '(c) {} Nikhil Anand'.format(datetime.now().year)
