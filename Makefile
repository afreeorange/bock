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
	pushd bock-ui && npm run build && popd

	@# Copy the built UI to the package
	mv bock-ui/cached_dist bock/ui/

	@# Build!
	poetry build


.PHONY: version
version:
	@poetry version | cut -d" " -f2
