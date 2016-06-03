from . import api_blueprint
from .helpers.misc import send_a_file


@api_blueprint.route('/files/<path:filename>')
def file(filename):
    '''Serve a file from the "_files" folder
    '''

    return send_a_file(filename)
