import os

from .factory import create_wiki

# For development with gunicorn
instance = None
if os.getenv('DEBUG'):
    instance = create_wiki(articles_path=None, debug=True)
