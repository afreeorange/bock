from . import api_blueprint
from .helpers import search_articles


@api_blueprint.route('/search/<string:term>')
def search(term):
    return search_articles(term)
