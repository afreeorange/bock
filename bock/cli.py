import signal
import sys

import click
from tornado import autoreload
from tornado.httpserver import HTTPServer
from tornado.ioloop import IOLoop
from tornado.wsgi import WSGIContainer
from .factory import create_wiki


@click.command()
@click.option('--port', '-p', default=8000, help='Port that will serve the wiki')
@click.option('--articles-folder', '-a', help='Folder with articles')
@click.option('--debug', '-d', is_flag=True, help='Start server in debug and live-reload mode')
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
                create_wiki(
                    articles_folder=articles_folder,
                    debug=debug
                )
            )
        ).listen(port)

    print('Starting wiki on port {}. Ctrl+C will kill it.'.format(port))

    ioloop = IOLoop.instance()

    if debug:
        autoreload.start(ioloop)
    ioloop.start()


if __name__ == '__main__':
    start()
