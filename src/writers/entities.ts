import { readFile, writeFile } from "fs/promises";

import { sort } from "fast-sort";

import { mkdirp } from "../helpers";
import { Bock, Entity } from "../types";
import parser from "../parser";
import { getRevisionList } from "../repository";
import { entities as readEntities, readme as readREADME } from "../readers";
import { render } from "../renderer";
import { JSON_PADDING } from "../constants";
import articleWriters from "./articles";

export const writeOne = async (bock: Bock, entity: Entity): Promise<void> => {
  const { outputFolder, articleRoot, prettify } = bock;

  const {
    created,
    hierarchy,
    id,
    modified,
    name,
    path,
    sizeInBytes,
    type,
    uri,
  } = entity;

  const entityToMake = `${outputFolder}/${uri}`;

  await mkdirp(entityToMake, { recursive: true });

  let data: any = {
    created,
    hierarchy,
    id,
    modified,
    name,
    path,
    sizeInBytes,
    type,
    uri,
  };

  if (type === "article") {
    const articleText = (await readFile(`${articleRoot}/${path}`)).toString();
    const html = parser.render(articleText);

    data = {
      ...data,
      source: articleText,
      html,
      uncommitted: false,
      revisions: await getRevisionList(bock.articleRoot, path),
    };
  } else {
    const children = Object.values(await readEntities(articleRoot, path, 1));

    data = {
      ...data,
      children: {
        articles: sort(
          children
            .filter((c) => c.type === "article")
            .map((c) => ({
              name: c.name,
              type: c.type,
              path: c.path,
              uri: c.uri,
            })),
        ).asc("path"),
        folders: sort(
          children
            .filter((c) => c.type === "folder")
            .map((c) => ({
              name: c.name,
              type: c.type,
              path: c.path,
              uri: c.uri,
            })),
        ).asc("path"),
      },
      readme: await readREADME(bock, entity),
    };
  }

  await writeFile(
    `${outputFolder}/${entity.uri}/index.html`,
    render({
      template: `entity.html`,
      variables: {
        type: entity.type,
        name: entity.name,
        uri: entity.uri,

        entity: data,
      },
      prettify,
    }),
  );

  await writeFile(
    `${entityToMake}/index.json`,
    JSON.stringify(data, null, JSON_PADDING),
  );

  if (entity.type === "article") {
    await articleWriters.raw(bock, data);
    await articleWriters.revisionList(bock, data);
    await articleWriters.revisions(bock, data);
  }
};

const writeAll = async (bock: Bock): Promise<void> => {
  const { listOfEntities, showProgress } = bock;

  /**
   * This is slow. Why? ~18 seconds for ~220 articles.
   */
  if (showProgress) {
    for await (const e of listOfEntities) {
      console.log(`Writing ${e.name}`);
      await writeOne(bock, e);
    }
  } else {
    /**
     * This is fast. Why? ~10 seconds for ~220 articles.
     */
    await Promise.all(
      listOfEntities.map(async (e) => {
        await writeOne(bock, e);
      }),
    );
  }
};

export default writeAll;
