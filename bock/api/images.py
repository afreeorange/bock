from . import api_blueprint
from .helpers.misc import send_a_file


@api_blueprint.route('/images/<path:imagename>')
def image(imagename):
    '''Serve an image from the _images folder
    '''

    return send_a_file(imagename, type='image')
