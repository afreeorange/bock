from typing import NoReturn

import click
from watchgod import RegExpWatcher, watch

from bock.helpers import absolute_paths_to_articles_in, click_option_article_root
from bock.logger import log
from bock.search import (
    create_search_index,
    get_search_index,
    update_index_incrementally,
)


def run(article_root: str) -> None:

    search_index = get_search_index(article_root)
    paths = absolute_paths_to_articles_in(article_root)

    log.info(f"Started watching {article_root} for changes")
    log.info(f"Found {len(paths)} articles in {article_root}")

    if not search_index:
        search_index = create_search_index(article_root)
        update_index_incrementally(
            article_root,
            search_index,
            paths,
        )

    for changes in watch(
        article_root,
        watcher_cls=RegExpWatcher,
        watcher_kwargs=dict(re_files=r"^.*(\.md)$"),
    ):
        update_index_incrementally(
            article_root,
            search_index,
            absolute_paths_to_articles_in(article_root),
        )


# This is for when this module is run by itself in production
@click.command()
@click_option_article_root
def main(article_root):
    run(article_root.rstrip("/"))
