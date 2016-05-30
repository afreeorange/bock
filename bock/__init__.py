from datetime import datetime

from .logger import logger
from .factory import create_wiki


__title__ = 'bock'
__version__ = '1.2.9'
__author__ = 'Nikhil Anand'
__license__ = 'MIT'
__copyright__ = '(c) {} Nikhil Anand'.format(datetime.now().year)

instance = create_wiki(debug=True)
