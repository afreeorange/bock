from multiprocessing import Process
import signal
import sys
from time import sleep

from .factory import create_wiki
from .api.helpers import update_search_index_with, delete_from_index
import click
from tornado import autoreload
from tornado.httpserver import HTTPServer
from tornado.ioloop import IOLoop
from tornado.wsgi import WSGIContainer
from watchdog.events import PatternMatchingEventHandler
from watchdog.observers import Observer


class BockRepositoryEventHandler(PatternMatchingEventHandler):

    def __init__(self, patterns=None,
                 ignore_patterns=None,
                 ignore_directories=False,
                 case_sensitive=False,
                 wiki=None):

        super().__init__(patterns,
                         ignore_patterns,
                         ignore_directories,
                         case_sensitive)
        self.wiki = wiki

    def on_created(self, event):
        with self.wiki.app_context():
            if not event.is_directory:
                update_search_index_with(event.src_path)

    def on_modified(self, event):
        with self.wiki.app_context():
            if not event.is_directory:
                update_search_index_with(event.src_path)

    def on_deleted(self, event):
        with self.wiki.app_context():
            if not event.is_directory:
                delete_from_index(event.src_path)

    def on_moved(self, event):
        with self.wiki.app_context():
            delete_from_index(event.src_path)
            update_search_index_with(event.dest_path)


def article_watcher(wiki, observer):
    observer.start()

    try:
        while True:
            sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()


def web_server(wiki, port, debug=False):

    def kill_handler(signal_number, stack_frame):
        print('\nStopping wiki')
        sys.exit(1)

    signal.signal(signal.SIGINT, kill_handler)

    print('Starting wiki on port {}. Ctrl+C will kill it.'.format(port))
    HTTPServer(WSGIContainer(wiki)).listen(port)
    ioloop = IOLoop.instance()

    if debug:
        autoreload.start(ioloop)
    ioloop.start()


@click.command()
@click.option('--port',
              '-p',
              default=8000,
              help='Port that will serve the wiki')
@click.option('--articles-folder',
              '-a',
              help='Folder with articles')
@click.option('--debug',
              '-d',
              is_flag=True,
              help='Start server in debug and live-reload mode')
def start(port, articles_folder, debug):
    '''Start a Tornado server with an instance of the wiki. Handle the
    keyboard interrupt to stop the wiki. Start a filesystem observer to listen
    to changes to wiki articles.
    '''

    wiki = create_wiki(articles_folder=articles_folder, debug=debug)

    observer = Observer()
    observer.schedule(
        BockRepositoryEventHandler(patterns=['*.md'], wiki=wiki),
        wiki.config['ARTICLES_FOLDER'],
        recursive=True
        )

    Process(
            target=article_watcher,
            args=(wiki, observer,)
        ).start()

    Process(
            target=web_server,
            args=(wiki, port, debug,)
        ).start()


if __name__ == '__main__':
    start()
