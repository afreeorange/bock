#!/bin/bash

ARCH="$(uname -m)"
VERSION="$(cat VERSION)"
ARTIFACT="dist/bock-linux-$ARCH"

echo "Building v$VERSION for $ARCH"
rm -rf dist/
CGO_ENABLED=1 go build --tags "fts5" -o "$ARTIFACT" .

echo "Done."
echo "See $ARTIFACT"
