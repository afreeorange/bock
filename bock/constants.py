ASSET_PATH = "__assets"
SEARCH_INDEX_PATH = "__bock_search_index"

# Give the "/" of the article root a special name
ROOT_NAME = "ROOT"
MARKDOWN_FILE_EXTENSION = "md"
ABBREVIATED_SHA_SIZE = 8

MAX_LENGTH_OF_LATEST_ARTICLES = 10
MAX_DEPTH_OF_FOLDERS = 3

# Search
MAX_SEARCH_RESULTS = 100
MAX_CHARS_IN_SEARCH_RESULTS = 500
MAX_CHARS_SURROUNDING_SEARCH_HIGHLIGHT = 150
MIN_CHARS_IN_SEARCH_TERM = 3

# Server. If not set, (2n + 1) workers are used per the Gunicorn docs
MAX_NUMBER_OF_WORKERS = 2
DEFAULT_PORT = 8000

# https://github.com/github/gitignore/blob/master/Global/macOS.gitignore
PATHS_TO_REMOVE_MACOS = [
    ".apdisk",
    ".AppleDB",
    ".AppleDesktop",
    ".AppleDouble",
    ".com.apple.timemachine.donotpresent",
    ".DS_Store",
    ".fseventsd",
    ".LSOverride",
    ".Spotlight-V100",
    ".TemporaryItems",
    ".Trashes",
    ".VolumeIcon.icns",
    "Icon" ".DocumentRevisions-V100",
    "Network Trash Folder",
    "Temporary Items",
]


# https://github.com/github/gitignore/blob/master/Global/Windows.gitignore
PATHS_TO_REMOVE_WINDOWS = [
    "Thumbs.db",
    "Thumbs.db:encryptable",
    "ehthumbs.db",
    "ehthumbs_vista.db",
    "Desktop.ini",
    "desktop.ini",
]

PATHS_TO_REMOVE = (
    PATHS_TO_REMOVE_MACOS
    # I fucking love Python for this...
    + PATHS_TO_REMOVE_WINDOWS
    + [
        # This is our stuff
        ".git",
        ".gitignore",
        "node_modules",
        ASSET_PATH,
        SEARCH_INDEX_PATH,
    ]
)

# Extensions used to render our articles
# TODO: Revisit these...
MARKDOWN_EXTENSIONS = [
    "markdown.extensions.admonition",
    "markdown.extensions.extra",
    "markdown.extensions.meta",
    "markdown.extensions.sane_lists",
    "markdown.extensions.smarty",
    "markdown.extensions.toc",
    "markdown.extensions.wikilinks",
    "pymdownx.arithmatex",
    "pymdownx.caret",
    "pymdownx.critic",
    "pymdownx.emoji",
    "pymdownx.extra",
    "pymdownx.highlight",
    "pymdownx.inlinehilite",
    "pymdownx.keys",
    "pymdownx.magiclink",
    "pymdownx.mark",
    "pymdownx.smartsymbols",
    "pymdownx.tasklist",
]

MARKDOWN_EXTENSION_CONFIG = {
    "pymdownx.highlight": {
        "css_class": "code-highlight",
    },
}

LOGGING_FORMAT = "%(asctime)s - %(levelname)s - %(message)s"

# These need to be unique. Could use @unique Enum's but no need to be that
# fancy. Underscores are a sufficient 'namespace' delineator.
EXIT_CODE_ARTICLE_ROOT_NOT_FOUND = 3
EXIT_CODE_NOT_A_GIT_REPOSITORY = 2
EXIT_CODE_NOT_AN_ABSOLUTE_PATH = 4
EXIT_CODE_OTHER = 6

# `None` works too. In that case, the `Authorization` header is checked for the
# refresh key <3
VALID_REFRESH_ORIGINS = [
    "github",
]
