FROM python:3.6-alpine
MAINTAINER Nikhil Anand <mail@nikhil.io>

RUN apk update \
    && apk add --no-cache git \
    && pip install -U git+https://github.com/afreeorange/bock.git \
    && find /usr/local \
       \( -type d -a -name test -o -name tests \) \
       -o \( -type f -a -name '*.pyc' -o -name '*.pyo' \) \
       -exec rm -rf '{}' +

EXPOSE 8000
CMD ["bock", "-a", "/articles"]
