from flask import Blueprint

api_blueprint = Blueprint('api_blueprint', __name__)

from . import (
    article,
    articles,
    files,
    images,
    refresh,
    search,
)
