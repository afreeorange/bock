#!/usr/bin/env node

import process from "process";
import { writeFile } from "fs/promises";
import { system } from "systeminformation";

import chokidar from "chokidar";
import { sort } from "fast-sort";
import { cpu, osInfo, mem } from "systeminformation";

import { Bock } from "./types";
import { getArguments } from "./cli";

import readEntities from "./readers";

import writeAssets from "./writers/assets";
import writeDatabase from "./writers/database";
import writeHome from "./writers/home";
import writeSearch from "./writers/search";
import writeRandom from "./writers/random";
import writeEntities, { writeOne as writeEntity } from "./writers/entities";

import { Statistics } from "./helpers";

(async () => {
  let p = process.hrtime();

  const {
    articleRoot,
    outputFolder,
    watch,
    prettify,
    progress: showProgress,
  } = getArguments();

  const entities = await readEntities(articleRoot);
  const entityList = Object.values(entities);
  const statistics = new Statistics();
  statistics.setArticleCount(entityList.length);

  /**
   * Prepare the Bock object.
   */
  const bock: Bock = {
    articleRoot,
    outputFolder,
    entities,

    /**
     * NOTE: Sorting here by path. This is what most pages require. The home
     * page requires sorting by last modified.
     */
    listOfEntities: sort(Object.values(entities)).asc("path"),

    /**
     * NOTE: This is unused as of now. Might use it to make trees on the
     * articles page later.
     */
    listOfPaths: Object.keys(entities),
    prettify,
    showProgress,
    statistics,
    system: {
      cpu: await cpu(),
      os: await osInfo(),
      memory: await mem(),
    },
  };

  await writeFile(
    `${bock.outputFolder}/entities.json`,
    JSON.stringify(entities, null, 2),
  );

  console.log(`Found ${bock.listOfEntities.length} entities in ${articleRoot}`);
  console.log(`Output folder is ${outputFolder}`);

  console.log(`Going to write ${bock.listOfEntities.length} articles...`);
  await writeEntities(bock);
  console.log(`Finished writing articles`);

  console.log(`Going to render Search page`);
  await writeSearch(bock);
  console.log(`Rendered Search`);

  console.log(`Going to render Randomize page`);
  await writeRandom(bock);
  console.log(`Rendered Random`);

  console.log(`Going to copy assets`);
  writeAssets(bock);
  console.log(`Copied static assets`);

  console.log(`Going to generate SQLite database`);
  writeDatabase(bock);
  console.log(`Generated SQLite Database`);

  /**
   * Home page should be rendered last because it's the only page that consumes
   * all dem ✨ Statistics ✨
   */
  p = process.hrtime(p);
  statistics.updateGenerationTime(p[0]);

  console.log(`Going to render Homepage`);
  await writeHome(bock);
  console.log(`Rendered Homepage`);

  if (watch) {
    console.log(`Watching ${articleRoot} for changes`);
    const watcher = chokidar.watch([`${articleRoot}/**/*.md`], {
      persistent: true,
    });

    watcher.on("change", async (path) => {
      let _path = path.replace(`${articleRoot}/`, "");
      console.log(`${_path} changed... re-rendering`);

      await writeEntity(bock, entities[_path]);
    });
  }
})();
