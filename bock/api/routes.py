from hashlib import sha1
import hmac
import os
import random

from . import api_blueprint
from flask import (
    abort,
    current_app as ca,
    redirect,
    jsonify,
    request,
    Response,
    url_for,
    send_file,
)


def __send_a_file(filename, type='file'):
    """Send a file from either the `_files` or `_images` folders
    in the article repository.
    """
    file_path = '{}/_{}s/{}'.format(
        ca.config['bock_core'],
        type,
        filename
    )

    if not os.path.isfile(file_path):
        abort(404)

    return send_file(file_path)


@api_blueprint.route('/images/<path:filename>')
def image(filename):
    """Serve a file from the `_images` folder
    """
    return __send_a_file(filename)


@api_blueprint.route('/files/<path:filename>')
def file(filename):
    """Serve a file from the `_files` folder
    """
    return __send_a_file(filename)


@api_blueprint.route('/refresh_articles', methods=['POST'])
def refresh_articles():
    """Respond to a webook and fetch the latest versions of the articles
    """

    # Computed signature for secret key 'XXX' (set if GITHUB_SECRET_KEY)
    # is not found is
    # sha1=18f3deaf58be2f57b8b80b3fec2db94f90f5ecac
    computed_signature = 'sha1={}'.format(
        hmac.new(
            bytes(ca.config['github_key'], 'utf-8'),
            msg=request.data,
            digestmod=sha1
        ).hexdigest()
    )
    github_signature = request.headers.get('X-Hub-Signature')

    if computed_signature != github_signature:
        return jsonify({'message': 'Bad signature'}), 401

    errors = ca.config['bock_core'].pull_commits()

    # At this point, the search index should be updated with the
    # filesystem watcher running as another process.
    status_code = 500 if errors else 200

    return jsonify({
        'message': 'Attempted refresh',
        'errors': errors
    }), status_code


@api_blueprint.route('/articles/random')
def get_random():
    """Get a random article
    """
    return redirect(
        url_for(
            '.article',
            article_path=random.choice(
                ca.config['bock_core'].simple_list_of_articles
            )
        )
    ), 302


@api_blueprint.route('/search/<term>')
def search(term):
    """Search the Whoosh index for a given term
    """
    try:
        return jsonify(ca.config['bock_core'].search_articles(term))
    except ValueError as e:
        return jsonify({
            'message': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'message': 'Unexpected server error: {}'.format(str(e))
        }), 500


@api_blueprint.route('/articles/<path:article_path>')
def article(article_path):
    """Get a single article
    """
    try:
        return jsonify(ca.config['bock_core'].get_article(article_path))
    except FileNotFoundError:
        return jsonify({
            'message': 'Couldn\'t find that article'
        }), 404
    except Exception as e:
        return jsonify({
            'message': 'Unexpected server error: {}'.format(str(e))
        }), 500


@api_blueprint.route('/articles/<path:article_path>/compare')
def compare(article_path):
    """Return a `diff` representation of the differences between
    two article revisions.
    """
    if 'a' not in request.args or 'b' not in request.args:
        jsonify({
            'message': 'Must give me two SHAs'
        }), 400

    if request.headers['Accept'] == 'text/plain':
        return Response(
            ca.config['bock_core'].get_diff(
                article_path,
                request.args.get('a'),
                request.args.get('b'),
            ),
            mimetype='text/plain'
        )

    return jsonify({
        'title': article_path,
        'diff': ca.config['bock_core'].get_diff(
            article_path,
            request.args.get('a'),
            request.args.get('b'),
        )
    })


@api_blueprint.route('/articles/<path:article_path>/revisions/<sha>')
def revision(article_path, sha):
    """Show a single revision
    """
    return jsonify(ca.config['bock_core'].get_revision(article_path, sha))


@api_blueprint.route('/articles/<path:article_path>/revisions')
def revisions(article_path):
    """Show a list of all available revisions for the given article.
    Revision IDs are commit SHAs.
    """
    return jsonify({
        'title': ca.config['bock_core'].article_title(article_path),
        'revisions': ca.config['bock_core'].get_revision_list(article_path),
    })


@api_blueprint.route('/articles')
def articles():
    """Show a list of articles. Augment the core's return list with
    information on whether or not the article has any uncommitted changes
    """
    if 'alphabetized' not in request.args:
        return jsonify({'articles': ca.config['bock_core'].list_of_articles})

    return jsonify(ca.config['bock_core'].alphabetized_list_of_articles)


@api_blueprint.route('/')
def index():
    """Say Hello
    """
    return jsonify({
        'message': 'Hello. I am the Bock API.'
    })
