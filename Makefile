SHELL := bash

.PHONY: clean
clean:
	rm -rf dist \
		ui/build \
		bock/ui/cached_dist
	find . \
		-iname "*.so" -or \
		-iname "*.pyc" -or \
		-iname "__pycache__" -or \
		-iname "*.egg*" -or \
		-iname ".search_index" \
		| xargs rm -rf {}

.PHONY: build
build: clean
	@# Build the UI
	cd ui && yarn && yarn build

	@# Copy built assets over
	mkdir bock/ui/cached_dist
	cp -rv ui/build/ bock/ui/cached_dist
