import re

from flask import current_app

# Routing and Helper Functions
# ----------------------------
#
# Paths come in as
#
#     folder one/folder two/some article
#
# In `helpers`, that path is always referred to as `article_path`.
# Need functions to turn `article_path` into
#
#     # Article namespace only
#     folder one/folder two
#
#     # Article title only
#     some article
#
#     # Article title with extension
#     some article.md
#
#     # Full path to article file
#     /path/to/folder one/folder two/some article.md


def article_path_with_extension(article_path):
    return '{}.md'.format(article_path)


def full_article_path(article_path):
    '''Return the full path to the article on disk
    '''

    return '{}/{}/{}.md'.format(
        current_app.config['ARTICLES_FOLDER'],
        article_namespace(article_path),
        article_title(article_path),
    )


def article_namespace(article_path):
    '''Return only the article namespace without trailing slashes
    '''

    match = re.match(r'^(.*)/.*$', article_path)
    return match.group(1).lstrip('/') if match else ''


def article_title_with_extension(article_path):
    '''Return the article title from the URL path with the ".md" extension
    '''

    return '{}.md'.format(article_title(article_path))


def article_title(article_path):
    '''Return just the article title without a namespace.
    '''

    match = re.match(r'^(.*/)?(.*)$', article_path)
    return match.group(2)
