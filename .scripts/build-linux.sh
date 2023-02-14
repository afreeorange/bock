#!/bin/bash

# Builds releases for Linux on macOS using Docker

set -euo pipefail

echo "Building Docker image for Linux build"
pushd .scripts
  docker build -t bock-builder:latest .
popd
echo "🌈 Done!"

# NOTE: The `--platform` tag is needed for M1 Macs...
docker run --platform linux/amd64 -v "$PWD":/project bock-builder:latest
