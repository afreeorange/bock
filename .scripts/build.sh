#!/bin/bash

# Just a general build command for macOS and Linux

set -euo pipefail

ARCH="$(uname -m)"
OS="$(uname -s)"
VERSION="$(cat VERSION)"
ARTIFACT="dist/bock-$OS-$ARCH"

echo "Building bock v$VERSION for $OS ($ARCH)"
CGO_ENABLED=1 go build --tags "fts5" -o "$ARTIFACT" .

echo "🌈 Done!"
echo "See $ARTIFACT"
