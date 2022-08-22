import { readFile, writeFile } from "fs/promises";

import { sort } from "fast-sort";

import { HOME_PAGE_DOCUMENT, MAX_RECENT_ARTICLES } from "../constants";
import { generateIdFrom, mkdirp } from "../helpers";
import parser from "../parser";
import { getDates } from "../repository";
import { Bock } from "../types";
import { render } from "../renderer";

const home = async (bock: Bock) => {
  const {
    entities,
    articleRoot,
    outputFolder,
    prettify,
    listOfEntities,
    statistics,
    system,
  } = bock;

  let html;
  let source;

  if (Object.keys(entities).includes(HOME_PAGE_DOCUMENT)) {
    source = (
      await readFile(`${articleRoot}/${HOME_PAGE_DOCUMENT}`)
    ).toString();
  } else {
    source = `(Could not find a \`${HOME_PAGE_DOCUMENT}\`. You should make one!)`;

    await mkdirp(`${outputFolder}/Home`);
  }

  html = parser.render(source);

  const { created, modified } = await getDates(
    articleRoot,
    `${articleRoot}/Home.md`,
  );

  const entity = {
    created,
    hierarchy: [
      {
        name: "ROOT",
        type: "folder",
        uri: "",
      },
      {
        name: "Home",
        type: "article",
        uri: "Home",
      },
    ],
    id: generateIdFrom(articleRoot, HOME_PAGE_DOCUMENT),
    modified,
    name: "Home",
    path: HOME_PAGE_DOCUMENT,
    sizeInBytes: 0,
    type: "home",
    uri: "Home",
    source,
    html,
    uncommitted: false,
    revisions: [],
  };

  await writeFile(
    `${outputFolder}/index.html`,
    render({
      template: `entity.html`,
      variables: {
        type: "home",
        name: entity.name,
        uri: "/",

        entity,

        // Remove the root entity and folders from the list of recents.
        recent: sort(listOfEntities)
          .desc("modified")
          .filter((e) => e.uri !== "ROOT" || e.type !== "folder")
          .slice(0, MAX_RECENT_ARTICLES),

        statistics,
        system,
      },
      prettify,
    }),
  );
};

export default home;
