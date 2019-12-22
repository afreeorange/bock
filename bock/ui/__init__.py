from flask import Blueprint, send_file

ui_blueprint = Blueprint('ui_blueprint', __name__)


@ui_blueprint.route('/static/js/<path:route>')
def javascript(route):
    return send_file(f'ui/cached_dist/static/js/{route}')


@ui_blueprint.route('/static/css/<path:route>')
def styles(route):
    return send_file(f'ui/cached_dist/static/css/{route}')


@ui_blueprint.route('/static/media/<path:route>')
def media(route):
    return send_file(f'ui/cached_dist/static/media/{route}')


@ui_blueprint.route('/robots.txt')
def robots(route):
    return send_file('ui/cached_dist/index.html')


@ui_blueprint.route('/favicon.ico')
def favicon(route):
    return send_file('ui/cached_dist/favicon.ico')


@ui_blueprint.route('/manifest.json')
def manifest(route):
    return send_file('ui/cached_dist/manifest.json')


@ui_blueprint.route('/<path:route>')
def route(route):
    return send_file('ui/cached_dist/index.html')


@ui_blueprint.route('/')
def index():
    return send_file('ui/cached_dist/index.html')
