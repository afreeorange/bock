import logging
import os

import coloredlogs

from bock import __name__ as package_name
from bock.constants import LOGGING_FORMAT

LEVEL = logging.DEBUG if os.getenv("DEBUG") else logging.INFO

log = logging.getLogger(package_name)
handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter(LOGGING_FORMAT))

log.addHandler(handler)
log.setLevel(LEVEL)

coloredlogs.install(logger=log, fmt=LOGGING_FORMAT)
