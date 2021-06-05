import difflib
import os
import uuid

import pendulum

from bock.constants import ABBREVIATED_SHA_SIZE, MAX_LENGTH_OF_LATEST_ARTICLES
from bock.helpers import (
    absolute_paths_to_articles_in,
    escape_html,
    get_article_excerpt,
    get_entity_hierarchy,
    get_entity_metadata,
    raw_markdown_from,
    render_html_from,
)


def get_blob(absolute_path_to_article, article_repo, commit):
    namespaces = (
        absolute_path_to_article.replace(article_repo.working_tree_dir, "")
        .lstrip("/")
        .split("/")
    )

    blob = []

    if len(namespaces) == 1:
        blob = [
            _
            for _ in commit.tree.blobs
            if _.name == os.path.basename(absolute_path_to_article)
        ]

    else:
        subtree_with_blob = commit.tree[namespaces[0]]

        for namespace in namespaces[1:-1:]:
            subtree_with_blob = subtree_with_blob[namespace]

        blob = [
            _
            for _ in subtree_with_blob.blobs
            if _.name == os.path.basename(absolute_path_to_article)
        ]

    return blob[0] if blob else []


def get_commits(
    absolute_path_to_article,
    article_repo,
):
    return [
        _
        for _ in article_repo.iter_commits(
            paths=[
                absolute_path_to_article.replace(article_repo.working_tree_dir, "")[1:],
                # TODO: Fix this for when articles are moved around... You need
                #       to fix the `get_blob` function.
                # os.path.basename(absolute_path_to_article),
            ]
        )
    ]


def get_commit(absolute_path_to_article, article_repo, sha):
    commit = [
        _
        for _ in get_commits(absolute_path_to_article, article_repo)
        if _.hexsha == sha
    ]
    return commit[0] if commit else None


def get_revisions(absolute_path_to_article, article_repo):
    return [
        {
            "id": _.hexsha,
            "message": _.message,
            "author": _.author.name,
            "email": _.author.email,
            "committed": pendulum.from_timestamp(_.committed_date).to_iso8601_string(),
        }
        for _ in get_commits(absolute_path_to_article, article_repo)
    ]


def get_revision(absolute_path_to_article, article_root, article_repo, sha):
    commit = get_commit(absolute_path_to_article, article_repo, sha)

    if not commit:
        return None

    blob = get_blob(absolute_path_to_article, article_repo, commit)
    raw_article_content = (
        blob.data_stream.read().decode("UTF-8").replace("\u00a0", "")
        if blob
        else raw_markdown_from(absolute_path_to_article)
    )

    return {
        "committed": pendulum.from_timestamp(commit.committed_date).to_iso8601_string(),
        "html": render_html_from(raw_article_content),
        "name": os.path.basename(absolute_path_to_article).rsplit(".", 1)[0],
        "text": raw_article_content,
        "hierarchy": get_entity_hierarchy(
            absolute_path_to_article,
            article_root,
        ),
    }


def get_diff(article_path, article_root, article_repo, a, b):
    display_path = article_path.replace(article_repo.working_tree_dir, "")[1:]

    revision_a = get_revision(article_path, article_root, article_repo, a)
    revision_b = get_revision(article_path, article_root, article_repo, b)

    unified_diff = "\n".join(
        list(
            difflib.unified_diff(
                revision_a["text"].splitlines(),
                revision_b["text"].splitlines(),
                fromfile=f"a/{display_path}",
                tofile=f"b/{display_path}",
                lineterm="",
            )
        )
    )

    diff_template = """diff --git a/{title} b/{title}
index {sha_a}..{sha_b} {file_mode}
{diff}
"""

    unified_diff = diff_template.format(
        title=display_path,
        diff=unified_diff,
        sha_a=a[0:ABBREVIATED_SHA_SIZE],
        sha_b=b[0:ABBREVIATED_SHA_SIZE],
        file_mode=oct(os.stat(article_path).st_mode)[2:],
    )

    # Escape HTML and "non-breaking space"
    return escape_html(unified_diff)


# TODO: Bug! This does not return new articles!
def uncommitted_articles(article_repo):
    return [_.a_path.rsplit(".", 1)[0] for _ in article_repo.index.diff(None)]


def all_articles(
    article_root,
    preserve_root=False,
    preserve_extension=False,
):
    articles = []

    for _ in absolute_paths_to_articles_in(article_root):
        key = str(
            uuid.uuid5(
                uuid.NAMESPACE_DNS,
                _,
            )
        )

        if not preserve_root:
            _ = _.replace(article_root, "").lstrip("/")

        if not preserve_extension:
            _ = _.rsplit(".", 1)[0]

        articles.append(
            {
                "name": _,
                "key": key,
            }
        )

    return articles


def abbreviated_article_info(article_root, absolute_path_to_article):
    _ = absolute_path_to_article

    name = os.path.basename(_).rsplit(".", 1)[0]
    size, created, modified = get_entity_metadata(_)
    hierarchy = get_entity_hierarchy(
        _,
        article_root,
    )

    return {
        "created": created,
        "hierarchy": hierarchy,
        "key": str(
            uuid.uuid5(
                uuid.NAMESPACE_DNS,
                absolute_path_to_article,
            )
        ),
        "modified": modified,
        "name": name,
        "size_in_bytes": size,
        "type": "file",
        "excerpt": get_article_excerpt(raw_markdown_from(absolute_path_to_article)),
    }


def get_statistics(
    article_root,
    list_of_absolute_paths_to_articles,
    prune_to=MAX_LENGTH_OF_LATEST_ARTICLES,
):

    # TODO: These lists can be long, yo.
    # TODO: ctime, mtime, atime...?
    by_mtime = sorted(
        list_of_absolute_paths_to_articles,
        key=os.path.getmtime,
        reverse=True,
    )[0:prune_to]

    article_info = [abbreviated_article_info(article_root, _) for _ in by_mtime]

    return {
        "count": len(list_of_absolute_paths_to_articles),
        "latest": article_info,
    }
