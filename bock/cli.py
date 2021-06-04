"""
Just here for consistency with the other modules which have a `cli` module in
them. Put the server and the watcher together.

You'd only run this locally. So start a watcher as a separate process and run a
Gunicorn or Debugging server.
"""

from multiprocessing import Process

import click

from bock.api import cli as serve
from bock.helpers import (
    click_option_article_root,
    click_option_debug,
    click_option_host,
    click_option_port,
    click_option_refresh_key,
    click_option_refresh_origin,
    click_option_workers,
)
from bock.watch import cli as watch


@click.command()
@click_option_article_root
@click_option_host
@click_option_port
@click_option_debug
@click_option_workers
@click_option_refresh_key
@click_option_refresh_origin
def main(
    article_root,
    host,
    port,
    debug,
    workers,
    refresh_key,
    refresh_origin,
):
    w = Process(
        name="Bock Article Watcher",
        target=watch.run,
        args=(article_root.rstrip("/"),),
    )
    w.daemon = True
    w.start()

    serve.run(
        article_root.rstrip("/"),
        host,
        port,
        debug,
        workers,
        local_invocation=True,
        refresh_key=refresh_key,
        refresh_origin=refresh_origin,
    )
