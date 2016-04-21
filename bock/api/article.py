import random

from . import api_blueprint
from .helpers import (
    abort_if_not_found,
    article_path,
    get_human_last_modified,
    get_json_ready_diff,
    get_last_modified,
    get_revision,
    get_revision_list,
    is_article_modified,
    list_of_articles,
    markdown_to_html,
    processed_article,
    raw_article,
    underscore_title_in_route,
)
from flask import jsonify, redirect, url_for, request


@api_blueprint.route('/articles/<path:title>')
@abort_if_not_found
@underscore_title_in_route
def article(title):
    '''Return a single article with its raw source, processed HTML, title,
    and modification dates.
    '''

    return jsonify({
            'title': article_path(title, namespace=False, extension=False),
            'html': processed_article(title),
            'raw': raw_article(title),
            'modified': get_last_modified(title),
            'modified_humanized': get_human_last_modified(title),
            'uncommitted': is_article_modified(title)
        })


@api_blueprint.route('/articles/<path:title>/revisions')
@abort_if_not_found
@underscore_title_in_route
def revision_list(title):
    '''Retrieve a list of revisions identified by their SHAs
    '''

    return jsonify({
        'title': article_path(title, namespace=False, extension=False),
        'revisions': get_revision_list(title)
    })


@api_blueprint.route('/articles/<path:title>/revisions/<string:sha>')
@abort_if_not_found
@underscore_title_in_route
def revision(title, sha):
    '''Retrieve a particular revision specified by its git SHA
    '''

    revision = get_revision(title, sha)

    return jsonify({
        'title': article_path(title, namespace=False, extension=False),
        'html': markdown_to_html(revision['raw']),
        'raw': revision['raw'],
        'committed': revision['committed'],
        'committed_humanized': revision['committed_humanized'],
        'revision_sha': sha
    })


@api_blueprint.route('/articles/<path:title>/compare')
@abort_if_not_found
@underscore_title_in_route
def compare(title):
    a = request.args.get('a')
    b = request.args.get('b')

    if not (a and b):
        return jsonify({
            'error': 'Need both SHAs for comparison'
        }), 400

    diff = get_json_ready_diff(title, a, b)

    if not diff:
        return jsonify({
            'error': 'One of the two revision SHAs could not be found'
        }), 400

    return jsonify({
        'title': article_path(title, namespace=False, extension=False),
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
