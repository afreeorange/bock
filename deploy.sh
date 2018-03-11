#!/bin/bash

DOCKER_REPOSITORY="259614114414.dkr.ecr.us-east-1.amazonaws.com/bock"

# Pre-flight check
[[ -z $VIRTUAL_ENV ]] && echo "You're not in a virtual env" && exit 1
[[ -z $BOCK_GITHUB_KEY ]] && echo "Github key not set" && exit 1
[[ -z $BOCK_GA_TOKEN ]] && echo "Google Analytics token not set" && exit 1

# Bump the version
bumpversion patch

BOCK_VERSION=$(grep current_version setup.cfg | head -n 1 | awk '{print $3}')
echo "Deploying v${BOCK_VERSION}"

# Remove all old images and build new latest
# Should use versioning here but meh.
docker rmi bock:latest
docker rmi $DOCKER_REPOSITORY:latest
docker build -t bock:$BOCK_VERSION .

# Tag the latest release
docker tag bock:$BOCK_VERSION $DOCKER_REPOSITORY:latest

# Log in to AWS and push image
eval $(aws ecr get-login --no-include-email --region us-east-1)
docker push $DOCKER_REPOSITORY:latest
