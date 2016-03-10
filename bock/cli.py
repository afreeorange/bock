import signal
import sys
import webbrowser

import click
from tornado.httpserver import HTTPServer
from tornado.ioloop import IOLoop
from tornado.wsgi import WSGIContainer
import bock


@click.command()
@click.option('--port', default=8000, help='Port that will serve the wiki')
@click.option('--articles-folder', help='Folder with articles')
@click.option('--debug', is_flag=True)
def start(port, articles_folder, debug):
    '''Start a Tornado server with an instance of the wiki. Handle the
    keyboard interrupt to stop the wiki.
    '''

    def kill_handler(signal_number, stack_frame):
        print('\nStopping wiki')
        sys.exit(1)

    signal.signal(signal.SIGINT, kill_handler)

    HTTPServer(
        WSGIContainer(
                bock.create_wiki(
                    articles_folder=articles_folder,
                    debug=debug
                )
            )
        ).listen(port)

    print('Starting wiki server on port {}. Ctrl+C to stop.'.format(port))
    webbrowser.open_new('http://localhost:{}'.format(port))
    IOLoop.instance().start()


if __name__ == '__main__':
    start()
