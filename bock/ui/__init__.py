from flask import Blueprint, send_file

ui_blueprint = Blueprint('ui_blueprint', __name__)


@ui_blueprint.route('/static/js/<path:route>')
def javascript(route):
    return send_file(f'ui/cached_dist/static/js/{route}')


@ui_blueprint.route('/static/css/<path:route>')
def styles(route):
    return send_file(f'ui/cached_dist/static/css/{route}')


@ui_blueprint.route('/<path:route>')
def route(route):
    return send_file('ui/cached_dist/index.html')


@ui_blueprint.route('/')
def index():
    return send_file('ui/cached_dist/index.html')
