import click
from bock.helpers import (
    click_option_article_root,
    absolute_paths_to_articles_in,
    relative_paths_and_keys_to_articles_from,
)
from bock.logger import log


def run(article_root, output_folder):
    articles = relative_paths_and_keys_to_articles_from(
        article_root,
        absolute_paths_to_articles_in(article_root),
    )


@click.command()
@click_option_article_root
@click.option(
    "--output",
    "-o",
    "output_folder",
    help="Output generated JSON to this folder",
    required=True,
)
def main(article_root, output_folder):
    run(article_root.rstrip("/"), output_folder)
