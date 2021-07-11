FROM python:3-alpine

COPY dist/* /tmp/

ENV VERSION=3.4.14

RUN \
    apk add git && \
    pip install /tmp/bock-${VERSION}-py3-none-any.whl && \
    rm /tmp/bock-${VERSION}-py3-none-any.whl

ENTRYPOINT [ "bock-local", "--article-root", "/articles", "--host", "0.0.0.0" ]
