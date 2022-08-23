#!/bin/bash

ARCH="$(uname -m)"
OS="$(uname -s)"
VERSION="$(cat VERSION)"
ARTIFACT="dist/bock-$OS-$ARCH"

echo "Building bock v$VERSION"
rm -rf dist/
CGO_ENABLED=1 go build --tags "fts5" -o "$ARTIFACT" .

echo "Done!"
echo "See $ARTIFACT"
