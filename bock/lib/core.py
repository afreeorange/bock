import difflib
import json
import logging
import os
import re

import arrow
from git import Repo
from glob2 import glob
import markdown
from whoosh import index
from whoosh.fields import Schema, TEXT, ID
from whoosh.qparser import MultifieldParser, FuzzyTermPlugin

logger = logging.getLogger(__name__)


class BockCore():
    def __init__(self, articles_path):
        """Attempt to initialize a folder with Markdown articles. If a git
        repo, create a search index and populate.

        Markdown Extension References
        * http://facelessuser.github.io/pymdown-extensions
        * https://pythonhosted.org/Markdown/extensions
        """
        self.article_repo = Repo(articles_path)
        self.articles_path = articles_path
        self.markdown_extensions = [
            'markdown.extensions.abbr',
            'markdown.extensions.attr_list',
            'markdown.extensions.def_list',
            'markdown.extensions.fenced_code',
            'markdown.extensions.footnotes',
            'markdown.extensions.tables',
            'markdown.extensions.smart_strong',
            'markdown.extensions.admonition',
            'markdown.extensions.codehilite',
            'markdown.extensions.headerid',
            'markdown.extensions.sane_lists',
            'markdown.extensions.smarty',
            'markdown.extensions.toc',
            'markdown.extensions.wikilinks',
            'pymdownx.betterem',
            'pymdownx.caret',
            'pymdownx.githubemoji',
            'pymdownx.headeranchor',
            'pymdownx.magiclink',
            'pymdownx.mark',
            'pymdownx.smartsymbols',
            'pymdownx.tasklist',
            'pymdownx.tilde',
            'pymdownx.critic',
        ]
        self.markdown_extensions_config = {
            'markdown.extensions.codehilite': {
                'css_class': 'code-highlight'
            }
        }
        self.__search_schema = Schema(
            title=ID(stored=True, unique=True),
            path=ID(stored=True),
            content=TEXT,
        )
        self.__search_parser = MultifieldParser(
            ['title', 'content'],
            schema=self.__search_schema,
        )
        self.__search_parser.add_plugin(FuzzyTermPlugin())
        self.__search_index = self.create_search_index()
        self.populate_search_index()

    # ------------------------ Article Functions ------------------------

    def markdown_to_html(self, text):
        """Converts a given Markdown string to HTML
        """
        return markdown.markdown(
            text=text,
            output_format='html5',
            extensions=self.markdown_extensions,
            extension_configs=self.markdown_extensions_config,
        )

    def raw_article(self, article_path):
        """Return the text contents of an article
        """
        with open(self.full_article_path(article_path)) as f:
            article_content = f.read()

        return article_content

    def processed_article(self, article_path):
        """Return the 'marked-down' HTML version of an article
        """
        return self.markdown_to_html(self.raw_article(article_path))

    def article_last_modified(self, article_path):
        """Return the last modified date of a given article in ISO8601 format
        """
        return str(
            arrow.get(
                os.stat(
                    self.full_article_path(article_path)
                ).st_mtime
            )
        )

    def article_last_modified_human(self, article_path):
        """Return the last modified date of a given article in a
        human-readable format
        """
        return arrow.get(
            self.article_last_modified(article_path)
        ).humanize()

    def is_article_modified(self, article_path):
        """Determine if the article is modified
        """
        if not os.path.isfile(self.full_article_path(article_path)):
            raise FileNotFoundError

        if article_path in self.list_of_modified_articles:
            return True

        return False

    def get_article(self, article_path):
        """A convenience method that returns an object with a single
        article and associated metadata
        """
        return {
            'title': self.article_title(article_path),
            'html': self.processed_article(article_path),
            'raw': self.raw_article(article_path),
            'modified': self.article_last_modified(article_path),
            'modified_humanized': self.article_last_modified_human(
                article_path
            ),
            'uncommitted': self.is_article_modified(article_path),
        }

    @property
    def list_of_articles(self):
        """Return a list of article titles
        """
        return sorted([
            re.sub(
                r'^/?',
                '',
                _.replace(self.articles_path, '').replace('.md', '')
            )
            for _ in
            glob('{}/**/*.md'.format(self.articles_path))
        ])

    @property
    def list_of_modified_articles(self):
        """Return a list of article titles that have been modified
        """
        return [
            _.a_path.replace('.md', '')
            for _
            in self.article_repo.index.diff(None)
        ]

    def escape_html(self, text):
        html_escape_table = {
            '&': '&amp;',
            '"': '&quot;',
            "'": '&apos;',
            '>': '&gt;',
            '<': '&lt;',
        }

        return ''.join(html_escape_table.get(c, c) for c in text)

    # ------------------------ Path Functions ------------------------

    """
    Paths come in as

        folder one/folder two/some article

    In `helpers`, that path is always referred to as `article_path`.
    Need functions to turn `article_path` into

        # Article namespace only
        folder one/folder two

        # Article title only
        some article

        # Article title with extension
        some article.md

        # Full path to article file
        /path/to/repo/folder one/folder two/some article.md
    """

    def article_namespace(self, article_path):
        """Return only the article namespace without trailing slashes
        """
        match = re.match(r'^(.*)/.*$', article_path)
        return match.group(1).lstrip('/') if match else ''

    def article_title(self, article_path):
        """Return just the article title without a namespace.
        """
        match = re.match(r'^(.*/)?(.*)$', article_path)

        # TODO: Improve the regex and avoid this!
        if match.group(2)[-3:].upper() == '.MD':
            title = match.group(2)[:-3]
        else:
            title = match.group(2)

        return title

    def article_path_with_extension(self, article_path):
        """Silly, really: Just add a '.md' to the article's title
        """
        return '{}.md'.format(article_path)

    def full_article_path(self, article_path):
        """Return the full path to the article on disk
        """
        return '{}/{}/{}.md'.format(
            self.articles_path,
            self.article_namespace(article_path),
            self.article_title(article_path),
        )

    def article_title_with_extension(self, article_path):
        """Return the article title from the URL path with the ".md" extension
        """
        return '{}.md'.format(self.article_title(article_path))

    # ------------------------ Repository Functions ------------------------

    def get_commits(self, article_path):
        """Returns a list of commits as `Commit` objects for a
        given article title
        """
        return [
            _
            for _
            in self.article_repo.iter_commits(
                paths=self.article_path_with_extension(article_path)
            )
        ]

    def get_commit(self, article_path, sha):
        """Fetches a single `Commit` object for a given article title
        and commit SHA
        """
        commit = [
            _
            for _
            in self.get_commits(article_path)
            if _.hexsha == sha
        ]

        return commit[0] if commit else None

    def get_blob(self, commit, article_path):
        """Get the git blob for a given commit and article title
        """
        namespaces = article_path.split('/')

        if len(namespaces) == 1:
            blob = [
                _
                for _
                in commit.tree.blobs
                if _.name == self.article_title_with_extension(article_path)
            ]

        else:
            subtree_with_blob = commit.tree[namespaces[0]]

            for namespace in namespaces[1:-1:]:
                subtree_with_blob = subtree_with_blob[namespace]

            blob = [
                _
                for _
                in subtree_with_blob.blobs
                if _.name == self.article_title_with_extension(article_path)
            ]

        return blob[0] if blob else []

    def get_revision_list(self, article_path):
        """Get a list of revision objects for a given article title
        """
        revisions = []

        for commit in self.get_commits(article_path):
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

    def get_revision(self, article_path, sha):
        """Get a single revision from a blob object for a given article
        title and commit ID
        """
        commit = self.get_commit(article_path, sha)

        if not commit:
            return None

        commit_date = arrow.get(commit.committed_date)
        blob = self.get_blob(commit, article_path)
        raw_article_content = (
            blob.data_stream.read().decode('UTF-8').replace('\u00a0', '')
            if blob
            else self.raw_article(article_path)
        )

        return {
            'title': self.article_title(article_path),
            'html': self.markdown_to_html(raw_article_content),
            'raw': raw_article_content,
            'committed': str(commit_date),
            'committed_humanized': commit_date.humanize(),
        }

    def get_diff(self, article_path, a, b, json_ready=False):
        """Return a diff string between two revisions of a given
        article title.
        """
        title_path = self.article_path_with_extension(article_path)
        revision_a = self.get_revision(article_path, a)
        revision_b = self.get_revision(article_path, b)

        unified_diff = '\n'.join(
            list(
                difflib.unified_diff(
                    revision_a['raw'].splitlines(),
                    revision_b['raw'].splitlines(),
                    fromfile='{}/{}'.format('a', article_path),
                    tofile='{}/{}'.format('b', article_path),
                    lineterm='',
                )
            )
        )

        if json_ready:
            unified_diff = json.dumps(unified_diff)

        unified_diff = 'diff --git {}/{} {}/{}\n'.format(
            'a',
            title_path,
            'b',
            title_path,
        ) + unified_diff

        # Escape HTML and "non-breaking space"
        return self.escape_html(unified_diff)

    def pull_commits(self):
        """Pull all changes to the article repository from the default remote.
        An empty list denotes a successful pull.
        """
        errors = []

        try:
            self.article_repo.remote().pull()
        except Exception as e:
            errors.append(str(e))

        return errors

    # ------------------------ Search Functions ------------------------

    def create_search_index(self):
        """Create a search index in the articles path. The folder is named
        .search_index
        """
        document_path = self.articles_path
        schema = self.__search_schema

        index_path = '{}/.search_index'.format(document_path)
        if not os.path.exists(index_path):
            os.mkdir(index_path)

        logger.info('Creating index')
        search_index = index.create_in(index_path, schema)

        return search_index

    def update_index_with(self, entity):
        """Update the search index with either a single article title
        or a list of titles
        """
        writer = self.__search_index.writer()

        if type(entity) is not list:
            entity = [entity]

        for _ in entity:
            with open(self.full_article_path(_)) as f:
                try:
                    writer.update_document(
                        title=_,
                        path=self.full_article_path(_),
                        content=f.read()
                    )
                    logger.debug('Updated {}'.format(self.article_title(_)))

                except ValueError as e:
                    logger.error('Skipping {} ({})'.format(_, str(e)))

        writer.commit()

    def delete_from_index(self, article_path):
        logger.debug('Trying {}'.format(article_path))
        writer = self.__search_index.writer()
        writer.delete_by_term('title', article_path)

        logger.debug('Removed {}'.format(article_path))

        writer.commit()

    def populate_search_index(self):
        """Wraps the `update_index_with` function for the entire
        list of articles
        """
        self.update_index_with(self.list_of_articles)

    def search_articles(self, query_string):
        """Searches the index with the given query string and returns
        an object with search results and metadata
        """
        if len(query_string) < 3:
            raise ValueError('Search query must be longer than three chars')

        search_results = {
            'query': query_string,
            'count': 0,
            'results': None
        }

        query = self.__search_parser.parse(query_string)

        with self.__search_index.searcher() as searcher:
            results = searcher.search(query, terms=True, limit=None)
            results.fragmenter.maxchars = 400
            results.fragmenter.surround = 100

            search_results['count'] = len(results)
            if search_results['count'] > 0:
                search_results['results'] = []

            for hit in results:
                search_results['results'].append({
                    'title': hit['title'],
                    'content_matches': hit.highlights(
                        'content',
                        text=open(hit["path"]).read()
                    )
                })

        return search_results
