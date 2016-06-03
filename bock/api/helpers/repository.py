import difflib
import json

from .articles import raw_article, escape_html
from .paths import article_path_with_extension, article_title_with_extension
import arrow
from flask import current_app


def get_commits(article_path):
    return [
        _
        for _
        in current_app.config['ARTICLE_REPO'].iter_commits(
            paths=article_path_with_extension(article_path)
        )
    ]


def get_commit(article_path, sha):
    commit = [
        _
        for _
        in get_commits(article_path)
        if _.hexsha == sha
    ]

    return commit[0] if commit else None


def get_blob(commit, article_path):
    namespaces = article_path.split('/')

    if len(namespaces) == 1:
        blob = [
            _
            for _
            in commit.tree.blobs
            if _.name == article_title_with_extension(article_path)
        ]

    else:
        subtree_with_blob = commit.tree[namespaces[0]]

        for namespace in namespaces[1:-1:]:
            subtree_with_blob = subtree_with_blob[namespace]

        blob = [
            _
            for _
            in subtree_with_blob.blobs
            if _.name == article_title_with_extension(article_path)
        ]

    return blob[0] if blob else []


def get_revision_list(article_path):
    revisions = []

    for commit in get_commits(article_path):
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


def get_revision(article_path, sha):
    commit = get_commit(article_path, sha)

    if not commit:
        return None

    commit_date = arrow.get(commit.committed_date)
    blob = get_blob(commit, article_path)

    return {
        'committed': str(commit_date),
        'committed_humanized': commit_date.humanize(),
        'raw': (
            blob.data_stream.read().decode('UTF-8').replace('\u00a0', '')
            if blob
            else raw_article(article_path)
        )
    }


def get_json_ready_diff(article_path, a, b):
    title_path = article_path_with_extension(article_path)

    revision_a = get_revision(article_path, a)
    revision_b = get_revision(article_path, b)

    if not revision_a or not revision_b:
        return None

    unified_diff = json.dumps(
        '\n'.join(
            list(
                difflib.unified_diff(
                    revision_a['raw'].splitlines(),
                    revision_b['raw'].splitlines(),
                    fromfile='a/{}'.format(article_path),
                    tofile='b/{}'.format(article_path),
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
