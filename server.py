import json
import os
import random
from multiprocessing import Process

from bottle import (
    abort,
    Bottle,
    redirect,
    request,
    response,
    static_file,
)
import click
from core import Bock
from watcher import start_watching


@click.command()
@click.option(
    '--port',
    '-p',
    default=8000,
    help='Port that will serve the wiki'
)
@click.option(
    '--articles-folder',
    '-a',
    default=os.path.abspath(os.path.curdir),
    help='Folder with articles'
)
@click.option(
    '--debug',
    '-d',
    is_flag=True,
    help='Start server in debug and live-reload mode'
)
def start_server(port, articles_folder, debug):
    app = Bottle()
    bock = Bock(articles_path=articles_folder)

    @app.route('/api/images/<filename>')
    def send_image(filename):
        """Send an image from the _images folder in the articles root
        """
        return static_file(filename, '{}/_images'.format(articles_folder))

    @app.route('/api/files/<filename>')
    def send_file(filename):
        """Send an file from the _files folder in the articles root
        """
        return static_file(filename, '{}/_files'.format(articles_folder))

    @app.route('/api/articles/<article_path:path>/compare')
    def compare(article_path):
        if 'a' not in request.query or 'b' not in request.query:
            abort(400, 'Must give me two SHAs')

        diff = bock.get_diff(article_path, request.query.a, request.query.b)

        response.content_type = 'text/plain; charset=utf-8'
        return json.dumps(diff) if 'json' in request.query else diff

    @app.route('/api/articles/<article_path:path>/revisions/<sha>')
    def article_revision(article_path, sha):
        return bock.get_revision(article_path, sha)

    @app.route('/api/articles/<article_path:path>/revisions')
    def article_revisions(article_path):
        return {
            'title': bock.article_title(article_path),
            'revisions': bock.get_revision_list(article_path),
        }

    @app.route('/api/articles/<article_path:path>')
    def article(article_path):
        """Serve up an article object if the path exists. Return a 404 if
        it doesn't exist
        """
        try:
            return bock.get_article(article_path)
        except FileNotFoundError:
            abort(404, 'Could not find that article')
        except Exception as e:
            abort(500, 'Unexpected error: {}'.format(str(e)))

    @app.route('/api/articles/random')
    def random_article():
        """Redirect to a random article chosen from a list of articles
        """
        return redirect(
            '/api/articles/{}'.format(random.choice(bock.list_of_articles))
        )

    @app.route('/api/articles')
    def articles():
        """Show a list of articles. Augment the core's return list with
        information on whether or not the article has any uncommitted changes
        """
        modified_articles = bock.list_of_modified_articles
        return {
            'articles': [
                {
                    'title': _,
                    'uncommitted': True if _ in modified_articles else False
                }
                for _
                in bock.list_of_articles
            ]
        }

    @app.route('/api/search/<term>')
    def search(term):
        return bock.search_articles(term)

    @app.route('/<uri:path>')
    def some_uri(uri):
        """Make the SPA handle all non /api paths
        """
        return static_file('index.tpl', root='./views')

    @app.route('/')
    def index():
        """Make the SPA handle the root path
        """
        return static_file('index.tpl', root='./views')

    Process(
        target=app.run,
        kwargs={'port': port, 'debug': debug, 'reloader': debug},
    ).start()

    Process(
        target=start_watching,
        kwargs={'bock_object': bock},
    ).start()

    return True


if __name__ == '__main__':
    start_server()
