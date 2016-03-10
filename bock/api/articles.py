from . import api_blueprint
from .helpers import list_of_articles, list_of_modified_articles
from flask import jsonify


@api_blueprint.route('/articles')
def articles():
    '''Generate a list of wiki articles
    '''

    modified_articles = list_of_modified_articles()

    return jsonify({
            'title': 'Articles',
            'articles': [
                {
                    'title': _,
                    'uncommitted': True if _ in modified_articles else False
                }
                for _
                in list_of_articles()
            ]
        })
