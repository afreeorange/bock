import logging
import os

logger = logging.getLogger('bock')
handler = logging.StreamHandler()
handler.setFormatter(
    logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
)

logger.addHandler(handler)
logger.setLevel(logging.DEBUG if os.getenv('DEBUG') else logging.INFO)
