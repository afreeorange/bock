# Bock 🍺

A personal wiki with Python/Flask and TypeScript/React.

## Running

```bash
# With Docker
docker run -v /path/to/articles:/articles -p 8000:8000 bock

# With Docker: change port and run in developer/debug mode
docker run -v /path/to/articles:/articles -p 9000:9000 bock --port 9000 --debug
```

## Development

```bash
# Run tests
poetry run pytest

# Bump the version (uses bumpversion)
bumpversion patch
bumpversion minor

# Build the project: Wheel + Docker Image
./build
```

### TODO

* [ ] Tests
* [ ] Debugger bails for Flask :/
* [ ] Recursion depth?
* [ ] Article limit?
* [x] Packaging
* [ ] PEX?

### References

* [AsyncIO with Flask and and a SPA](https://github.com/SyntaxRules/svelte-flask/blob/main/run.py)

## License

WTFPL
