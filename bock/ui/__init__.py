from flask import Blueprint, send_file

ui_blueprint = Blueprint('ui_blueprint', __name__)


@ui_blueprint.route('/Wiki.js')
def scripts():
    return send_file('ui/cached_dist/Wiki.js')


@ui_blueprint.route('/Wiki.css')
def styles():
    return send_file('ui/cached_dist/Wiki.css')


@ui_blueprint.route('/fonts/<path:route>')
def fonts(route):
    return send_file('ui/cached_dist/fonts/{}'.format(route))


@ui_blueprint.route('/<path:route>')
def route(route):
    return send_file('ui/cached_dist/index.html')


@ui_blueprint.route('/')
def index():
    return send_file('ui/cached_dist/index.html')
