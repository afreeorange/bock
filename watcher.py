from time import sleep

from watchdog.observers import Observer
from watchdog.events import PatternMatchingEventHandler


class ArticlesChangeHandler(PatternMatchingEventHandler):
    """This needs a major rewrite... :/ Doesn't work with namespaces
    """

    def __article_path_from_full_path(self, path):
        return '{}/{}'.format(
            self.bock_object.article_namespace(
                path.replace(self.bock_object.articles_path, '')
            ),
            self.bock_object.article_title(
                path.replace(self.bock_object.articles_path, '')
            )
        )

    def on_created(self, event):
        if not event.is_directory:
            self.bock_object.update_search_index_with(
                self.__article_path_from_full_path(event.src_path)
            )

    def on_modified(self, event):
        if not event.is_directory:
            self.bock_object.update_search_index_with(
                self.__article_path_from_full_path(event.src_path)
            )

    def on_deleted(self, event):
        if not event.is_directory:
            self.bock_object.delete_from_index(event.src_path)

    def on_moved(self, event):
        self.bock_object.delete_from_index(event.src_path)
        self.bock_object.update_search_index_with(event.dest_path)


def start_watching(bock_object):
    handler = ArticlesChangeHandler(patterns=['*.md'])
    handler.bock_object = bock_object

    o = Observer()
    o.schedule(handler, path=bock_object.articles_path, recursive=True)
    o.start()
    try:
        while True:
            sleep(1)
    except KeyboardInterrupt:
        o.stop()
    o.join()
