# Bock

A static wiki generator. Article history and all that. Massive WIP. [See it in action here](https://wiki.nikhil.io).

## Usage

To see a list of options:

```bash
npx ts-node -T src/index.ts --help
```

I this to publish [my wiki](https://github.com/afreeorange/wiki.nikhil.io.articles):

```bash
rm -rf ~/personal/wiki.nikhil.io.articles.out/* && \
npx ts-node -T src/index.ts \
    --article-root ~/personal/wiki.nikhil.io.articles \
    --output-folder ~/personal/wiki.nikhil.io.articles.out \
    --prettify \
    && \
    pushd ~/personal/wiki.nikhil.io.articles.out && \
        find . -type f -exec gzip -9 '{}' \; -exec mv '{}.gz' '{}' \;  && \
        aws s3 sync . s3://wiki.nikhil.io/ --delete --exclude "*.DS_Store*" --content-encoding gzip && \
    popd
```

## References

* [`systeminformation` package documentation](https://systeminformation.io/cpu.html)
* [Advanced Git: Graphs, Hashes, and Compression, Oh My!](https://www.youtube.com/watch?v=ig5E8CcdM9g)

## License

[WTFPL](http://www.wtfpl.net/)
