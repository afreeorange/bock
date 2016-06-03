from datetime import datetime

from .factory import create_wiki
from .logger import logger


# Uncomment for development with gunicorn
instance = create_wiki(debug=True, search=False, refresh_index=False)

# Package metadata
__title__ = 'bock'
__version__ = '1.2.9'
__author__ = 'Nikhil Anand'
__license__ = 'MIT'
__copyright__ = '(c) {} Nikhil Anand'.format(datetime.now().year)
