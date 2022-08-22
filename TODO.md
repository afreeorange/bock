## TODO

* [ ] Check if git repo
* [ ] Check output folder
* [ ] Speed up Raw: don't generate it, use CSS Tabs instead!
* [ ] Index page for 'similar' articles?
* [ ] What if an article is moved?
* [x] Home page
* [ ] remove trailing slashes
* [ ] LR local server
* [ ] PATHS! Like in a package or in an `npx` invocation 🤦‍♀️
* [x] HTML generation
* [ ] Change URI param with search
* [ ] Use `<input type=search>`
* [x] SQL generation job
* [x] SQL search JavaScript
* [ ] Tags?
* [ ] Docstrings
* [ ] Stats
* [ ] No revisions, current version message....
* [ ] Folder view sort articles by name
* [ ] Collapsible view in /search - hierarchy
* [ ] Server
* [x] Latest entries
* [x] List of articles
* [ ] Dark Mode
* [x] RAW page
* [x] Revisions page
* [ ] Compare page
* [x] Plain text in search
* [ ] Excerpt
* [x] Search Page
* [ ] "This_is_a_Test!/Antoher/Damani&#39s_List_of_Jazz_101_Albums" <- quotes!
* [x] `markdown-it-prism` when making executable...
* [ ] `nodegit` _can_ be a piece of shit...

## Design Notes

To Templates: you will have a `type` 

Exceptions

* Root is `Home.md`
* Assets are in `__assets`
* `/articles` is special
* `/search` is special
* `/random` is special
* `/raw` is special
* `/revisions` is special
* `/ROOT` is special
* Can add a `README.md` to each folder except root for description

---

## Scratchpad

### Building

Doing this on a CircleCI/Ubuntu 20.04 image `cimg/node:14.15.2`:

### Manual Sync

```bash
rm -rf ~/personal/wiki.nikhil.io.articles.out/* && npx ts-node -T src/index.ts -a ~/personal/wiki.nikhil.io.articles -o ~/personal/wiki.nikhil.io.articles.out -p && pushd ~/personal/wiki.nikhil.io.articles.out && find . -type f -exec gzip -9 '{}' \; -exec mv '{}.gz' '{}' \;  && aws s3 sync . s3://wiki.nikhil.io/ --delete --exclude "*.DS_Store*" --content-encoding gzip && popd
```

#### Build the Executable

This was copypastaed a lot

```bash
yarn all && \
rm -rf ~/Downloads/haha/* && \
./dist/bock -a ~/Downloads/wiki.nikhil.io.articles -o ~/Downloads/haha/
```

```bash
# Docker
docker run -v ~/Downloads/out:/out -ti cimg/node:16.13 /bin/bash

# Inside Container
sudo apt-get update
sudo apt-get install python libkrb5-dev libssl-dev -y
sudo npm i -g pkg
git clone https://github.com/afreeorange/node-bock.git ~/project
cd ~/project
yarn && yarn build
# pkg -t node16-linux-x64 dist/src/index.js
tar --exclude='./.git' -czvf /out/bock-linux.tgz .

# Outside Container
aws s3 sync ~/Downloads/out/ s3://public.nikhil.io/ 
```

```bash
find . -type f -exec gzip -9 '{}' \; -exec mv '{}.gz' '{}' \;
aws s3 sync . s3://wiki.nikhil.io/ --content-encoding gzip --delete --profile nikhil.io
```

```
"make-executable": "pkg --public-packages \"*\" --public .",
```

directory-tree

```javascript
  // const bar = new cliProgress.Bar({
  //   format: "[{bar}] {value} of {total} ({entity})",
  //   synchronousUpdate: false,
  // });

  // bar.start(listOfEntities.length, 0, { entity: "N/A" });

  // for await (const e of listOfEntities) {
  //   await writeEntity(bock, e);

  //   bar.increment({
  //     entity: e.name,
  //   });
  // }

  // bar.stop();
```