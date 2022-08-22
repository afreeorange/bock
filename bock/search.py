"""
Set up a simple Whoosh index and provide a few simple methods to update and
search it. To try at a REPL or from another module.

Here's some copypasta for, say, an iPython session:

    article_root = "/Users/nikhilanand/Dropbox/wiki.nikhil.io.articles"
    search_index = create_search_index(article_root)
    update_index_incrementally(
        article_root,
        search_index,
        absolute_paths_to_articles_in(article_root),
    )
    print(search_articles(article_root, search_index, "*BALAKRISH*"))

In the case of this particular project, the `watch` module uses the helper
functions here to 'intelligently' (heh) update the index when articles are
added, updated, or deleted. Simple stuff, yo.

TODO:

- NGRAMWORDS type for search fields
- Tune the index by reading the Whoosh documentation beyond the "QuickStart"
"""

import os

import whoosh
from whoosh.fields import ID, STORED, TEXT, Schema
from whoosh.qparser import FuzzyTermPlugin, MultifieldParser, WildcardPlugin

from bock.constants import (
    MAX_CHARS_IN_SEARCH_RESULTS,
    MAX_CHARS_SURROUNDING_SEARCH_HIGHLIGHT,
    MAX_SEARCH_RESULTS,
    MIN_CHARS_IN_SEARCH_TERM,
    SEARCH_INDEX_PATH,
)
from bock.helpers import relative_article_path_from
from bock.logger import log

search_schema = Schema(
    path=ID(stored=True, unique=True),
    name=ID(stored=True),
    modified_time=STORED,
    content=TEXT,
    # fragments=NGRAMWORDS(minsize=3, maxsize=5, stored=True),
)

search_parser = MultifieldParser(
    [
        "name",
        "content",
        "path",
    ],
    schema=search_schema,
)

search_parser.add_plugin(FuzzyTermPlugin())
search_parser.add_plugin(WildcardPlugin())


def create_search_index(article_root):
    index_path = f"{article_root}/{SEARCH_INDEX_PATH}"

    log.info(f"Creating search index in {index_path}")

    # if not os.path.exists(index_path):
    os.mkdir(index_path)
    search_index = whoosh.index.create_in(index_path, search_schema)

    return search_index


def add_article_to_index(
    article_root,
    absolute_path_to_article,
    index_writer,
):
    _ = absolute_path_to_article

    with open(_) as f:
        name = os.path.basename(_).rsplit(".", 1)[0]
        path = relative_article_path_from(article_root, _)
        content = f.read()

        try:
            index_writer.add_document(
                name=name,
                path=path,
                content=content,
                modified_time=os.path.getmtime(_),
            )

            log.debug(f"Adding {path}")

        except Exception as e:
            log.error(f'Skipping "{path}" ({str(e)})')


def remove_article_from_index(
    article_root,
    absolute_path_to_article,
    index_writer,
):
    path = relative_article_path_from(article_root, absolute_path_to_article)
    index_writer.delete_by_term("path", path)


# NOTE: there's an `update_document` method in Whoosh. Does the exact thing.
# https://whoosh.readthedocs.io/en/latest/indexing.html#updating-documents
def update_article_in_index(
    article_root,
    absolute_path_to_article,
    index_writer,
):
    remove_article_from_index(
        article_root,
        absolute_path_to_article,
        index_writer,
    )

    add_article_to_index(
        article_root,
        absolute_path_to_article,
        index_writer,
    )


def update_index_incrementally(
    article_root,
    search_index,
    absolute_path_to_articles,
):
    already_indexed_paths = set()
    paths_to_index = set()

    new = 0
    updated = 0
    deleted = 0

    with search_index.searcher() as searcher:
        index_writer = search_index.writer()

        # NOTE: This will show you all the fields in the schema for all the
        #       documents you just indexed :)
        for fields in searcher.all_stored_fields():
            indexed_path = fields["path"]
            already_indexed_paths.add(indexed_path)

            # This is absolute_path_to_article
            _ = f"{article_root}/{indexed_path}.md"

            # NOTE: Something's wrong if the indexed path starts with a "/"
            if not os.path.exists(_) or indexed_path.startswith("/"):
                log.info(f"Purging '{indexed_path}' from index")
                deleted += 1
                index_writer.delete_by_term("path", indexed_path)

            else:
                indexed_time = fields["modified_time"]
                mtime = os.path.getmtime(_)

                if mtime > indexed_time:
                    updated += 1
                    log.info(f"Marking '{indexed_path}' to be updated!")
                    index_writer.delete_by_term("path", indexed_path)
                    paths_to_index.add(indexed_path)

        for _ in absolute_path_to_articles:
            path = relative_article_path_from(article_root, _)

            if path not in already_indexed_paths or path in paths_to_index:
                log.info(f'Adding "{path}" to index')
                add_article_to_index(
                    article_root,
                    _,
                    index_writer,
                )

            if path not in already_indexed_paths:
                new += 1

        log.info(
            f"There were {new} new, {updated} updated,"
            f"and {deleted} deleted articles"
        )

        index_writer.commit()
        log.info(f"Committed index. It has {search_index.doc_count()} articles")


def search_articles(article_root, search_index, term):
    if len(term) < MIN_CHARS_IN_SEARCH_TERM:
        raise ValueError("Search query must be longer than three chars")

    search_results = {
        "term": term,
        "count": 0,
        "results": [],
        "runtime_in_ms": 0,
    }
    query = search_parser.parse(term)

    with search_index.searcher() as searcher:
        whoosh_results = searcher.search(
            query,
            terms=True,
            limit=MAX_SEARCH_RESULTS,
        )
        whoosh_results.fragmenter.maxchars = MAX_CHARS_IN_SEARCH_RESULTS
        whoosh_results.fragmenter.surround = MAX_CHARS_SURROUNDING_SEARCH_HIGHLIGHT

        search_results["count"] = len(whoosh_results)
        search_results["runtime_in_ms"] = whoosh_results.runtime * 1000

        for hit in whoosh_results:
            search_results["results"].append(
                {
                    "name": hit["name"],
                    "path": hit["path"],
                    "content_matches": hit.highlights(
                        "content",
                        text=open(f"{article_root}/{hit['path']}.md").read(),
                    ),
                }
            )

    return search_results


def get_search_index(article_root):
    search_index_path = f"{article_root}/{SEARCH_INDEX_PATH}"
    search_index = None

    if os.path.exists(search_index_path):
        log.info(f"Found an existing search index in {search_index_path}")

        try:
            search_index = whoosh.index.open_dir(search_index_path)
        except Exception as e:
            log.error(f"Could not open an existing index at {search_index_path}")
            log.error(f"Error was {str(e)}")
            log.error("Refusing to delete. Please resolve manually")

    else:
        _ = search_index_path
        log.error("Search index not found")

    return search_index
