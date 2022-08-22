import click

from bock import __name__ as package_name
from bock import __version__
from bock.api.server import run_server
from bock.helpers import (
    click_option_article_root,
    click_option_debug,
    click_option_host,
    click_option_port,
    click_option_refresh_key,
    click_option_refresh_origin,
    click_option_workers,
)
from bock.logger import log


def run(
    article_root,
    host,
    port,
    debug,
    workers,
    refresh_key=None,
    refresh_origin=None,
    local_invocation=False,
):
    log.info(f"Starting {package_name} v{__version__} on http://localhost:{port}")
    log.info(f"Mode is {'Development' if debug else 'Production'}")
    log.debug(f"Setting article root to {article_root}")

    run_server(
        article_root,
        host,
        port,
        debug,
        workers=workers,
        local_invocation=local_invocation,
        refresh_key=refresh_key,
        refresh_origin=refresh_origin,
    )


# This is for when this module is run by itself in production
@click.command()
@click_option_article_root
@click_option_debug
@click_option_host
@click_option_port
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
    run(
        article_root.rstrip("/"),
        host,
        port,
        debug,
        workers,
        refresh_key=refresh_key,
        refresh_origin=refresh_origin,
    )
