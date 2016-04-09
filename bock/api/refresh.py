from hashlib import sha1
import hmac

from . import api_blueprint
from flask import request, jsonify, current_app


@api_blueprint.route('/refresh_articles', methods=['POST'])
def refresh_articles():
    '''Respond to a webook and fetch the latest versions of the articles
    '''

    # Computed signature for secret key 'XXX' (set if GITHUB_SECRET_KEY)
    # is not found is
    # sha1=18f3deaf58be2f57b8b80b3fec2db94f90f5ecac
    computed_signature = 'sha1={}'.format(
            hmac.new(
                bytes(current_app.config['GITHUB_SECRET_KEY'], 'utf-8'),
                msg=request.data,
                digestmod=sha1
            ).hexdigest()
        )
    github_signature = request.headers.get('X-Hub-Signature')

    if computed_signature != github_signature:
        return jsonify({'message': 'Bad signature'}), 401

    errors = []

    # Pull changes into repo
    try:
        current_app.config['ARTICLE_REPO'].remote().pull()
    except Exception as e:
        errors.append(str(e))

    # At this point, the search index should be updated with the
    # filesystem watcher running as another process.

    status_code = 500 if errors else 200

    return jsonify({
            'message': 'Attempted refresh',
            'errors': errors
            }), status_code
