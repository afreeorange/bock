import glob
import hmac
import itertools
import os
import uuid
from hashlib import sha1
from typing import List

import click
import markdown
import pendulum

from bock.constants import (
    ASSET_PATH,
    DEFAULT_PORT,
    MARKDOWN_EXTENSION_CONFIG,
    MARKDOWN_EXTENSIONS,
    MARKDOWN_FILE_EXTENSION,
    MAX_DEPTH_OF_FOLDERS,
    MAX_NUMBER_OF_WORKERS,
    PATHS_TO_REMOVE,
    VALID_REFRESH_ORIGINS,
)

# --- Some reusable Click options ---


def click_option_article_root(f):
    f = click.option(
        "--article-root",
        "-a",
        help="Path to folder with wiki articles",
        required=True,
    )(f)

    return f


def click_option_debug(f):
    f = click.option(
        "--debug",
        "-d",
        is_flag=True,
        help="Run command in debugging mode",
    )(f)

    return f


def click_option_host(f):
    f = click.option(
        "--host",
        "-h",
        default="localhost",
        help="Run the API server with this hostname",
    )(f)

    return f


def click_option_port(f):
    f = click.option(
        "--port",
        "-p",
        default=DEFAULT_PORT,
        help="Run the API server at this port",
    )(f)

    return f


def click_option_workers(f):
    f = click.option(
        "--workers",
        "-w",
        default=MAX_NUMBER_OF_WORKERS,
        help="Number of Gunicorn workers serving up the API",
    )(f)

    return f


def click_option_refresh_key(f):
    f = click.option(
        "--refresh-key",
        "-k",
        "refresh_key",
        default=None,
        help="Use this key to refresh the folder of articles being watched/served",
    )(f)

    return f


def click_option_refresh_origin(f):
    f = click.option(
        "--refresh-origin",
        "-o",
        "refresh_origin",
        type=click.Choice(VALID_REFRESH_ORIGINS, case_sensitive=False),
        default=None,
        help="Valid refresh origins. If none is specified, the `Authorization` header is used to compare the key.",
    )(f)

    return f


# --- Some Random Stuff ---


def paths_in_search_index(search_index):
    with search_index.searcher() as searcher:
        for fields in searcher.all_stored_fields():
            indexed_path = fields["path"]
            print(indexed_path)


def escape_html(text) -> str:
    html_escape_table = {
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
        ">": "&gt;",
        "<": "&lt;",
    }

    return "".join(html_escape_table.get(c, c) for c in text)


# --- Important Path Stuff <3 ---


def relative_article_path_from(article_root, absolute_path_to_article) -> str:
    """Do three things: strip out the article root, remove the preceding slash,
    and remove the extension.
    """
    return (
        absolute_path_to_article.replace(article_root, "").lstrip("/").rsplit(".", 1)[0]
    )


def absolute_paths_to_articles_in(article_root) -> List[str]:
    """Go only three levels deep. Remove any shit like node_modules, the
    .git folder, common macOS or Windows cruft, etc.

    NOTE: This is ONLY for the purposes of indexing!
    """
    return sorted(
        [
            path
            for path in itertools.chain(
                glob.iglob(f"{article_root}/*.{MARKDOWN_FILE_EXTENSION}"),
                glob.iglob(f"{article_root}/**/*.{MARKDOWN_FILE_EXTENSION}"),
                glob.iglob(f"{article_root}/**/**/*.{MARKDOWN_FILE_EXTENSION}"),
                glob.iglob(f"{article_root}/**/**/**/*.{MARKDOWN_FILE_EXTENSION}"),
            )
            if os.path.isfile(path)
            and ASSET_PATH not in path
            and os.path.isfile(path)
            and not any(_ in path for _ in PATHS_TO_REMOVE)
        ],
    )


def relative_paths_and_keys_to_articles_from(
    article_root,
    list_of_absolute_paths_to_articles,
):
    articles = []

    for _ in list_of_absolute_paths_to_articles:
        key = str(
            uuid.uuid5(
                uuid.NAMESPACE_DNS,
                _,
            )
        )

        articles.append(
            {
                "name": relative_article_path_from(article_root, _),
                "key": key,
            }
        )

    # return sorted(articles, key=lambda _: _["name"], reverse=True)
    return articles


def path_characteristics(article_root, maybe_article_path):

    # Almost all other characters are allowed. This is a Special One.
    _maybe_article_path = maybe_article_path.replace("_", " ")

    maybe_folder_absolute_path = f"{article_root}/{_maybe_article_path}"
    is_folder = os.path.exists(maybe_folder_absolute_path)

    maybe_file_absolute_path = f"{article_root}/{_maybe_article_path}.md"
    is_file = os.path.exists(maybe_file_absolute_path)

    return (
        is_folder,
        maybe_folder_absolute_path,
        is_file,
        maybe_file_absolute_path,
    )


# --- Metadata about the article or folder ---


def get_entity_hierarchy(absolute_path_to_file_or_folder, article_root):
    _ = absolute_path_to_file_or_folder

    ret = []
    glom = ""
    for entity in _.replace(article_root, "").split("/"):
        glom += "/" + entity

        if glom == "/":
            ret.append({"name": "ROOT", "type": "folder"})
        else:
            if os.path.isdir(f"{article_root}/{glom}"):
                ret.append({"name": entity, "type": "folder"})
            elif os.path.isfile(f"{article_root}/{glom}"):
                ret.append({"name": entity.rsplit(".", 1)[0], "type": "file"})

    return ret


def get_entity_metadata(absolute_path_to_file_or_folder):
    stats = os.stat(absolute_path_to_file_or_folder)

    created = pendulum.from_timestamp(stats.st_ctime).to_iso8601_string()
    modified = pendulum.from_timestamp(stats.st_mtime).to_iso8601_string()
    size = stats.st_size

    return size, created, modified


# --- Renderers ---


def raw_markdown_from(article_path):
    with open(article_path) as f:
        article_content = f.read()

    return article_content


def render_html_from(markdown_text):
    return markdown.markdown(
        text=markdown_text,
        output_format="html5",
        extensions=MARKDOWN_EXTENSIONS,
        extension_configs=MARKDOWN_EXTENSION_CONFIG,
    )


# --- The Actual Article and Folder Data! 😍 ---


def folder_data(absolute_path_to_folder: str, article_root: str):
    # Just want stuff from this folder (i.e. one level deep) and that's it.
    # Luckily for us, `os.walk` returns a nice and lazy iterator (I don't see
    # how else you would implement something like this...)
    root, directories, files = next(os.walk(absolute_path_to_folder))

    # We only allow `constants.MAX_DEPTH_OF_FOLDERS` deep. Use this list to
    # ignore any folders that fall below this limit
    folders_above_this_one = absolute_path_to_folder.replace(article_root, "").split(
        "/"
    )[1:]

    # Remove any unnecessary paths (including dot folders)
    directories = [
        _ for _ in directories if _ not in PATHS_TO_REMOVE and not _.startswith(".")
    ]
    files = [
        _
        for _ in files
        if _ not in PATHS_TO_REMOVE and _.endswith(MARKDOWN_FILE_EXTENSION)
    ]

    hierarchy = get_entity_hierarchy(root, article_root)
    size, created, modified = get_entity_metadata(absolute_path_to_folder)
    name = hierarchy[-1]["name"]
    path = "/".join([_["name"] for _ in hierarchy[1:]])

    ret = {
        "type": "folder",
        "key": str(
            uuid.uuid5(
                uuid.NAMESPACE_DNS,
                absolute_path_to_folder,
            )
        ),
        "name": name,
        "size_in_bytes": size,
        "created": created,
        "modified": modified,
        "path": path,
        #
        # This adds a "" at the end if the hierarchy list if there's a trailing
        # slash in the URI.
        #
        "hierarchy": hierarchy,
        "children": {
            "count": len(directories) + len(files),
            #
            # Full paths help the UI. Remove any empty directories.
            #
            "folders": sorted(
                [
                    {
                        "name": d,
                        "path": f"{path}/{d}".lstrip("/").replace(" ", "_"),
                        "key": str(
                            uuid.uuid5(
                                uuid.NAMESPACE_DNS,
                                f"{root}/{d}",
                            )
                        ),
                    }
                    for d in directories
                    if os.listdir(f"{root}/{d}")
                    and len(folders_above_this_one) + 1 <= MAX_DEPTH_OF_FOLDERS
                ],
                key=lambda _: _["name"],
            ),
            #
            # Full paths help the UI. Remove the file extension but be careful
            # to only show Markdown files!
            "articles": [],
        },
        "folder_readme": {
            "present": False,
            "text": None,
            "html": None,
        },
    }

    temp = []

    for f in files:
        if f == "README.md":
            md = raw_markdown_from(f"{absolute_path_to_folder}/{f}")

            ret["folder_readme"]["present"] = True
            ret["folder_readme"]["text"] = md
            ret["folder_readme"]["html"] = render_html_from(md)

        if f.endswith(MARKDOWN_FILE_EXTENSION):
            name = f.rsplit(".", 1)[0]

            temp.append(
                {
                    "name": name,
                    #
                    # NOTE: Need the `lstrip` for the ROOT path!
                    #
                    "path": f"{path}/{name}".lstrip("/"),
                    "key": str(
                        uuid.uuid5(
                            uuid.NAMESPACE_DNS,
                            f"{absolute_path_to_folder}/{f}",
                        )
                    ),
                }
            )

    ret["children"]["articles"] = sorted(temp, key=lambda _: _["name"])

    return ret


def article_data(absolute_path_to_file, article_root, article_repo):
    size, created, modified = get_entity_metadata(absolute_path_to_file)
    hierarchy = get_entity_hierarchy(absolute_path_to_file, article_root)

    text = raw_markdown_from(absolute_path_to_file)

    # TODO: Done to prevent Python from (correctly) complaining about circular
    #       imports. This could be better...
    from .repository import uncommitted_articles

    name = hierarchy[-1]["name"]
    path = "/".join([_["name"] for _ in hierarchy[1:]])
    uncommitted = path in uncommitted_articles(article_repo)

    return {
        "created": created,
        "hierarchy": hierarchy,
        "html": render_html_from(text),
        "modified": modified,
        "name": name,
        "path": path,
        "size_in_bytes": size,
        "text": text,
        "type": "file",
        "key": str(
            uuid.uuid5(
                uuid.NAMESPACE_DNS,
                absolute_path_to_file,
            )
        ),
        "uncommitted": uncommitted,
        "approximate_number_of_words": len(text.split()),
    }


# --- Pull from remote into the article repo ---


def pull_changes(article_repo):
    """Pull all changes to the article repository from the default remote. An
    empty list denotes a successful pull.
    """
    errors = []

    try:
        article_repo.remote().pull()
    except Exception as e:
        errors.append(str(e))

    return errors


def valid_key__github(refresh_key, refresh_request):
    """Validate Github as a refresh origin. It's the only one right now.
    Written this way to be (a) easy to test and (b) support other such origins
    in the future.
    """
    # Computed signature for secret key 'XXX' (set if GITHUB_SECRET_KEY) is
    # not found is `sha1=18f3deaf58be2f57b8b80b3fec2db94f90f5ecac`
    computed_signature = "sha1={}".format(
        hmac.new(
            bytes(refresh_key, "utf-8"),
            msg=refresh_request.data,
            digestmod=sha1,
        ).hexdigest()
    )

    github_signature = refresh_request.headers.get("X-Hub-Signature")

    return True if computed_signature == github_signature else False
