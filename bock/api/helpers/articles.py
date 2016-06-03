import os
import re

from .paths import full_article_path
import arrow
from flask import current_app
from glob2 import glob
import markdown


def markdown_to_html(text):
    return markdown.markdown(
        text=text,
        output_format='html5',
        extensions=current_app.config['MARKDOWN_EXTENSIONS'],
        extension_configs=current_app.config['MARKDOWN_EXTENSION_CONFIG'],
    )


def article_contents(article_path):
    return open(full_article_path(article_path)).read()


def processed_article(article_path):
    return markdown_to_html(article_contents(article_path))


def raw_article(article_path):
    return article_contents(article_path)


def get_last_modified(article_path):
    return str(
        arrow.get(
            os.stat(
                full_article_path(article_path)
            ).st_mtime
        )
    )


def is_article_modified(article_path):
    return True if article_path in list_of_modified_articles() else False


def get_human_last_modified(article_path):
    return str(
        arrow.get(
            os.stat(
                full_article_path(article_path)
            ).st_mtime
        ).humanize()
    )


def list_of_articles():
    articles_folder = current_app.config['ARTICLES_FOLDER']

    return sorted([
        re.sub(
            r'^/?',
            '',
            _.replace(articles_folder, '').replace('.md', '')
        )
        for _ in
        glob('{}/**/*.md'.format(articles_folder))
    ])


def list_of_modified_articles():
    return [
        _.a_path.replace('.md', '')
        for _
        in current_app.config['ARTICLE_REPO'].index.diff(None)
    ]


def escape_html(text):
    html_escape_table = {
        '&': '&amp;',
        '"': '&quot;',
        "'": '&apos;',
        '>': '&gt;',
        '<': '&lt;',
    }

    return ''.join(html_escape_table.get(c, c) for c in text)
