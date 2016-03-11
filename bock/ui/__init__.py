from flask import Blueprint, send_file

ui_blueprint = Blueprint('ui_blueprint', __name__)


@ui_blueprint.route('/Bock.js')
def scripts():
    return send_file('ui/cached_dist/Bock.js')


@ui_blueprint.route('/Bock.css')
def styles():
    return send_file('ui/cached_dist/Bock.css')


@ui_blueprint.route('/fonts/<path:route>')
def fonts(route):
    return send_file('ui/cached_dist/fonts/{}'.format(route))


@ui_blueprint.route('/<path:route>')
def route(route):
    return send_file('ui/cached_dist/index.html')


@ui_blueprint.route('/')
def index():
    return send_file('ui/cached_dist/index.html')
