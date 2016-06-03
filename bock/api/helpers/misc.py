import functools
import logging
import os

from .paths import full_article_path
from flask import abort, redirect, url_for, send_file, current_app, jsonify

logger = logging.getLogger(__name__)


def abort_if_not_found(f):
    @functools.wraps(f)
    def wrapped_function(*args, **kwargs):
        if 'article_path' in kwargs:
            full_path = full_article_path(kwargs['article_path'])

            if not os.path.isfile(full_path):
                logger.debug('Could not find {}'.format(full_path))
                return abort(404)

        return f(*args, **kwargs)
    return wrapped_function


def de_underscore_article_path(f):
    '''Angular is configured to replace all spaces with underscores.
    This decorator performs the opposite and redirects to the
    properly encoded API endpoint. Angular doesn't flinch. The
    user sees a pretty URI and everyone's happy.
    '''

    @functools.wraps(f)
    def wrapped_function(*args, **kwargs):

        if 'article_path' in kwargs:
            path = kwargs['article_path']

            if '_' in path:
                new_path = path.replace('_', ' ')
                logger.debug('Redirecting {} to {}'.format(path, new_path))
                return redirect(url_for('.article', article_path=new_path))

        return f(*args, **kwargs)
    return wrapped_function


def send_a_file(filename, type='file'):
    file_path = '{}/_{}s/{}'.format(
        current_app.config['ARTICLES_FOLDER'],
        type,
        filename
    )

    if not os.path.isfile(file_path):
        return jsonify({'error': 'Couldn\'t find that'}), 404

    return send_file(file_path)
