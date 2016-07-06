import logging
import re
import os

from flask import current_app, jsonify
from glob2 import glob
from whoosh import index
from .paths import article_title, article_title_with_extension

logger = logging.getLogger(__name__)


def search_articles(query_string):
    search_results = {
        'query': query_string,
        'count': 0,
        'results': None
    }

    query = current_app.config['SEARCH_PARSER'].parse(query_string)

    with current_app.config['SEARCH_INDEX'].searcher() as searcher:
        results = searcher.search(query, terms=True, limit=None)
        results.fragmenter.maxchars = 400
        results.fragmenter.surround = 100

        search_results['count'] = len(results)
        if search_results['count'] > 0:
            search_results['results'] = []

        for hit in results:
            full_article_path = '{}/{}'.format(
                current_app.config['ARTICLES_FOLDER'],
                hit["path"],
            )

            with open(full_article_path) as f:
                contents = f.read()

            search_results['results'].append({
                'title': hit['title'],
                'content_matches': hit.highlights('content', text=contents)
            })

    return jsonify(search_results)


def delete_from_index(article_path):
    writer = current_app.config['SEARCH_INDEX'].writer()
    writer.delete_by_term('title', article_title(article_path))

    logger.debug('Removed {}'.format(article_title(article_path)))

    writer.commit()


def update_search_index_with(thing):
    writer = current_app.config['SEARCH_INDEX'].writer()
    articles_folder = current_app.config['ARTICLES_FOLDER']

    if type(thing) is not list:
        thing = [thing]

    for _ in thing:
        with open(_) as f:
            try:
                writer.update_document(
                    title=article_title(_),
                    path=article_title_with_extension(_),
                    content=f.read()
                )

                logger.debug('Updated {}'.format(article_title(_)))

            except ValueError as e:
                logger.error('Skipping {} ({})'.format(_, str(e)))

    writer.commit()


def populate_search_index():
    list_of_files = glob('{}/**/*.md'.format(
        current_app.config['ARTICLES_FOLDER']
    ))

    logger.info('Found {} documents'.format(len(list_of_files)))
    update_search_index_with(list_of_files)
    logger.info('Done')


def create_search_index():
    '''Create a search index
    '''
    document_path = current_app.config['ARTICLES_FOLDER']
    schema = current_app.config['SEARCH_SCHEMA']

    index_path = '{}/.search_index'.format(document_path)
    if not os.path.exists(index_path):
        os.mkdir(index_path)

    logger.info('Creating index')
    search_index = index.create_in(index_path, schema)

    return search_index
