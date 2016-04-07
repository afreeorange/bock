import difflib
import functools
import json
import os
import re

import arrow
from flask import current_app, jsonify, send_file, redirect, url_for, abort
from glob2 import glob
import markdown
from whoosh import index


def abort_if_not_found(f):
    @functools.wraps(f)
    def wrapped_function(*args, **kwargs):
        if 'title' in kwargs:
            title = kwargs['title']
            if not os.path.isfile(article_path(title, full_path=True)):
                return abort(404)
        return f(*args, **kwargs)
    return wrapped_function


def underscore_title_in_route(f):
    @functools.wraps(f)
    def wrapped_function(*args, **kwargs):
        if 'title' in kwargs:
            title = kwargs['title']
            if ' ' in title:
                return redirect(
                            url_for('.article', title=title.replace(' ', '_'))
                        )
        return f(*args, **kwargs)
    return wrapped_function


def markdown_to_html(text):
    return markdown.markdown(
            text=text,
            output_format='html5',
            extensions=current_app.config['MARKDOWN_EXTENSIONS'],
            extension_configs=current_app.config['MARKDOWN_EXTENSION_CONFIG'],
        )


def article_path(title,
                 basename=False,
                 extension=True,
                 namespace=True,
                 full_path=False):
    extension = '.md' if extension else ''
    article = ''

    if not basename:
        article = '{}/{}{}'.format(
                current_app.config['ARTICLES_FOLDER'],
                title.replace('_', ' '),
                extension
            )

    article = '{}{}'.format(title.replace('_', ' '), extension)

    if not namespace:
        article = re.search(r'(.*\/)?(.*)$', article).group(2)

    if full_path:
        article = '{}/{}'.format(
                        current_app.config['ARTICLES_FOLDER'],
                        article
                        )

    return article


def article_contents(title):
    return open(article_path(title, full_path=True)).read()


def processed_article(title):
    return markdown_to_html(article_contents(title))


def raw_article(title):
    return article_contents(title)


def get_last_modified(title):
    return str(
            arrow.get(
                os.stat(
                    article_path(title, full_path=True)
                    ).st_mtime
                )
            )


def get_human_last_modified(title):
    return str(
            arrow.get(
                os.stat(
                    article_path(title, full_path=True)
                    ).st_mtime
                ).humanize()
            )


def send_a_file(filename, type='file'):
    file_path = '{}/_{}s/{}'.format(
                    current_app.config['ARTICLES_FOLDER'],
                    type,
                    filename
                )

    if not os.path.isfile(file_path):
        return jsonify({'error': 'Couldn\'t find that'}), 404

    return send_file(file_path)


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


def get_commits(title):
    return [
            _
            for _
            in current_app.config['ARTICLE_REPO'].iter_commits(
                    paths=article_path(title, basename=True)
                )
        ]


def get_commit(title, sha):
    commit = [
            _
            for _
            in get_commits(title)
            if _.hexsha == sha
        ]

    return commit[0] if commit else None


def get_blob(commit, title):
    namespaces = title.split('/')

    if len(namespaces) == 1:
        blob = [
            _
            for _
            in commit.tree.blobs
            if _.name == article_path(namespaces[0])
        ]

    else:
        subtree_with_blob = commit.tree[namespaces[0]]

        for namespace in namespaces[1:-1:]:
            subtree_with_blob = subtree_with_blob[namespace]

        blob = [
                _
                for _
                in subtree_with_blob.blobs
                if _.name == article_path(title, namespace=False)
            ]

    return blob[0] if blob else []


def get_revision_list(title):
    revisions = []

    for commit in get_commits(title):
        committed_date = arrow.get(commit.committed_date)

        revisions.append({
                'id': commit.hexsha,
                'message': commit.message,
                'author': commit.author.name,
                'email': commit.author.email,
                'committed': str(committed_date),
                'committed_humanized': committed_date.humanize()
            })

    return revisions


def get_revision(title, sha):
    commit = get_commit(title, sha)

    if not commit:
        return None

    commit_date = arrow.get(commit.committed_date)
    blob = get_blob(commit, title)

    return {
        'committed': str(commit_date),
        'committed_humanized': commit_date.humanize(),
        'raw':  blob.data_stream.read().decode('UTF-8').replace('\u00a0', '') if blob else raw_article(title)
    }


def get_json_ready_diff(title, a, b):
    title_path = article_path(title, basename=True)

    revision_a = get_revision(title, a)
    revision_b = get_revision(title, b)

    if not revision_a or not revision_b:
        return None

    unified_diff = json.dumps(
                            '\n'.join(
                                list(
                                    difflib.unified_diff(
                                        revision_a['raw'].splitlines(),
                                        revision_b['raw'].splitlines(),
                                        fromfile='a/{}'.format(title_path),
                                        tofile='b/{}'.format(title_path),
                                        lineterm=''
                                    )
                                )
                            )
                        )

    unified_diff = 'diff --git a/{} b/{}\\n'.format(
                        title_path,
                        title_path
                    ) + unified_diff

    # Escape HTML and "non-breaking space"
    return escape_html(unified_diff)


def escape_html(text):
    html_escape_table = {
        '&': '&amp;',
        '"': '&quot;',
        "'": '&apos;',
        '>': '&gt;',
        '<': '&lt;',
        }

    return ''.join(html_escape_table.get(c, c) for c in text)


def list_of_modified_articles():
    return [_.a_path.replace('.md', '')
            for _
            in current_app.config['ARTICLE_REPO'].index.diff(None)
            ]


def is_article_modified(title):
    article_filename = article_path(title, basename=True, extension=False)

    if article_filename in list_of_modified_articles():
        return True

    return False


def search_articles(query_string):
    search_results = {
            'query': query_string,
            'count': 0,
            'results': None
            }

    query = current_app.config['SEARCH_PARSER'].parse(query_string)

    with current_app.config['SEARCH_INDEX'].searcher() as searcher:
        results = searcher.search(query, terms=True, limit=None)
        print(results)
        results.fragmenter.maxchars = 400
        results.fragmenter.surround = 100

        search_results['count'] = len(results)
        if search_results['count'] > 0:
            search_results['results'] = []

        for hit in results:
            print(hit)
            full_article_path = '{}/{}'.format(
                                    current_app.config['ARTICLES_FOLDER'],
                                    hit["path"]
                                    )

            with open(full_article_path) as f:
                contents = f.read()

            search_results['results'].append({
                    'title': hit['title'],
                    'content_matches': hit.highlights('content', text=contents)
                    })

    return jsonify(search_results)


def generate_whoosh_index(app):
    '''Generate a Whoosh search index.

    TODO: Be smart about this and refresh only changed articles, esp. when
          using the webhook endpoint.
    '''
    document_path = app.config['ARTICLES_FOLDER']
    schema = app.config['SEARCH_SCHEMA']
    index_path = '{}/.search_index'.format(document_path)

    if not os.path.exists(index_path):
        os.mkdir(index_path)

    print('Generating index')
    files = glob('{}/**/*.md'.format(document_path))
    print('Found {} documents'.format(len(files)))

    search_index = index.create_in(index_path, schema)
    writer = search_index.writer()

    for _ in files:
        with open(_) as f:
            try:
                article_path = _.replace(document_path, '').lstrip('/')
                article_title = re.sub(r'\.md$', r'', article_path)

                # 'update_document' behaves like 'add_document' if fresh index
                writer.update_document(
                    title=article_title,
                    path=article_path,
                    content=f.read()
                    )
            except ValueError as e:
                print('Skipping {} ({})'.format(_, str(e)))

    writer.commit()
    print('Done')

    return search_index
