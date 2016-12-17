import logging
from multiprocessing import Process
import signal
import sys
from time import sleep

from .factory import create_wiki
import click
from tornado import autoreload
from tornado.httpserver import HTTPServer
from tornado.ioloop import IOLoop
from tornado.wsgi import WSGIContainer
from watchdog.events import PatternMatchingEventHandler
from watchdog.observers import Observer

logger = logging.getLogger(__name__)


class BockRepositoryEventHandler(PatternMatchingEventHandler):

    def __init__(self, patterns=None,
                 ignore_patterns=None,
                 ignore_directories=False,
                 case_sensitive=False,
                 wiki=None):

        super().__init__(
            patterns,
            ignore_patterns,
            ignore_directories,
            case_sensitive,
        )

        self.wiki = wiki
        self.__article_title = self.wiki.config['bock_core'].article_title
        self.__article_namespace = self.wiki.config['bock_core'].article_namespace
        self.__update_index = self.wiki.config['bock_core'].update_index_with
        self.__delete_index = self.wiki.config['bock_core'].delete_from_index

    def __ns_and_title_from_full_path(self, path):
        path = path.replace(self.wiki.config['bock_core'].articles_path, '')
        ns = self.__article_namespace(path)
        t = self.__article_title(path)

        return '{}/{}'.format(ns, t) if ns else t

    def on_created(self, event):
        if not event.is_directory:
            self.__update_index(self.__article_title(event.src_path))

    def on_modified(self, event):
        if not event.is_directory:
            self.__update_index(self.__article_title(event.src_path))

    def on_deleted(self, event):
        if not event.is_directory:
            print(self.__ns_and_title_from_full_path(event.src_path))
            self.__delete_index(self.__article_title(event.src_path))

    def on_moved(self, event):
        self.__delete_index(self.__article_title(event.src_path))
        self.__update_index(self.__article_title(event.src_path))


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
        logger.info('\nStopping wiki')
        sys.exit(1)

    signal.signal(signal.SIGINT, kill_handler)

    logger.info('Starting wiki on port {}. Ctrl+C will kill it.'.format(port))
    HTTPServer(WSGIContainer(wiki)).listen(port)
    ioloop = IOLoop.instance()

    if debug:
        autoreload.start(ioloop)
    ioloop.start()


@click.command()
@click.option(
    '--port',
    '-p',
    default=8000,
    help='Port that will serve the wiki',
)
@click.option(
    '--articles-path',
    '-a',
    help='Path to folder with wiki articles',
)
@click.option(
    '--debug',
    '-d',
    is_flag=True,
    help='Start server in debug and live-reload mode',
)
def start(port, articles_path, debug):
    """Start a Tornado server with an instance of the wiki. Handle the
    keyboard interrupt to stop the wiki. Start a filesystem observer to listen
    to changes to wiki articles.
    """

    wiki = create_wiki(articles_path=articles_path, debug=debug)

    observer = Observer()
    observer.schedule(
        BockRepositoryEventHandler(patterns=['*.md'], wiki=wiki),
        wiki.config['articles_path'],
        recursive=True,
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
