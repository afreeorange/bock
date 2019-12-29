SHELL := bash

.PHONY: install_deps
install_deps:
	poetry install
	cd bock-ui && npm i


.PHONY: clean
clean:
	rm -rf dist
	rm -rf bock/ui/cached_dist
	find . \
		-iname "*.pyc" -or \
		-iname "__pycache__" -or \
		-iname "*.egg*" \
		| xargs rm -rf {}

.PHONY: build
build: clean
	@# Build the UI
	cd bock-ui && npm run build

	@# Copy the built UI to the package
	mv bock-ui/cached_dist bock/ui/

	@# Build!
	poetry build
