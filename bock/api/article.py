import random

from . import api_blueprint
from .helpers.paths import article_title
from .helpers.articles import (
    get_human_last_modified,
    get_last_modified,
    is_article_modified,
    list_of_articles,
    markdown_to_html,
    processed_article,
    raw_article,
)
from .helpers.misc import (
    abort_if_not_found,
    de_underscore_article_path
)
from .helpers.repository import (
    get_json_ready_diff,
    get_revision,
    get_revision_list,
)
from flask import jsonify, redirect, url_for, request


@api_blueprint.route('/articles/<path:article_path>')
@de_underscore_article_path
@abort_if_not_found
def article(article_path):
    '''Return a single article with its raw source, processed HTML, title,
    and modification dates.
    '''

    return jsonify({
        'title': article_title(article_path),
        'html': processed_article(article_path),
        'raw': raw_article(article_path),
        'modified': get_last_modified(article_path),
        'modified_humanized': get_human_last_modified(article_path),
        'uncommitted': is_article_modified(article_path)
    })


@api_blueprint.route('/articles/<path:article_path>/revisions')
@de_underscore_article_path
@abort_if_not_found
def revision_list(article_path):
    '''Retrieve a list of revisions identified by their SHAs
    '''

    return jsonify({
        'title': article_title(article_path),
        'revisions': get_revision_list(article_path)
    })


@api_blueprint.route('/articles/<path:article_path>/revisions/<string:sha>')
@de_underscore_article_path
@abort_if_not_found
def revision(article_path, sha):
    '''Retrieve a particular revision specified by its git SHA
    '''

    revision = get_revision(article_path, sha)

    return jsonify({
        'title': article_title(article_path),
        'html': markdown_to_html(revision['raw']),
        'raw': revision['raw'],
        'committed': revision['committed'],
        'committed_humanized': revision['committed_humanized'],
        'revision_sha': sha
    })


@api_blueprint.route('/articles/<path:article_path>/compare')
@de_underscore_article_path
@abort_if_not_found
def compare(article_path):
    a = request.args.get('a')
    b = request.args.get('b')

    if not (a and b):
        return jsonify({
            'error': 'Need both SHAs for comparison'
        }), 400

    diff = get_json_ready_diff(article_path, a, b)

    if not diff:
        return jsonify({
            'error': 'One of the two revision SHAs could not be found'
        }), 400

    return jsonify({
        'title': article_title(article_path),
        'diff': diff
    })


@api_blueprint.route('/articles/random')
def random_article():
    '''Retrieve a random article
    '''

    return redirect(
        url_for(
            '.article',
            title=random.choice(list_of_articles())
        )
    ), 302
