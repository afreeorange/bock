import { readFile } from "fs/promises";

import fg from "fast-glob";

import { ASSETS_FOLDER, ENTITIES_TO_IGNORE, MAX_DEPTH } from "./constants";
import {
  generateHierarchyFrom,
  generateIdFrom,
  generatePrettyPath,
  removeExtension,
} from "./helpers";
import parser from "./parser";
import { Bock, Entity } from "./types";
import { getDates } from "./repository";

export const readme = async ({ articleRoot }: Bock, entity: Entity) => {
  let ret: {
    source: string;
    html: string;
  } | null;

  try {
    let source = (
      await readFile(`${articleRoot}/${entity.path}/README.md`)
    ).toString();

    let html = parser.render(source);

    ret = {
      source,
      html,
    };
  } catch (e) {
    ret = null;
  }

  return ret;
};

export const entities = async (
  articleRoot: string,
  prefix: string = "",
  maxDepth: number = MAX_DEPTH,
): Promise<Record<string, Entity>> => {
  let ret: Record<string, Entity> = {};

  let sortedAndFilteredList = (
    await fg(`${articleRoot}${prefix !== "" ? "/" + prefix : ""}/**`, {
      deep: maxDepth,
      followSymbolicLinks: false,
      ignore: ENTITIES_TO_IGNORE,
      objectMode: true,
      onlyFiles: false,
      stats: true,
    })
  ).filter(
    (e) =>
      (e.dirent.isFile() || e.dirent.isDirectory()) &&
      !e.path.includes(ASSETS_FOLDER),
  );

  // Note: cannot do any sorting here for obvious reasons...
  await Promise.all(
    sortedAndFilteredList.map(async (e) => {
      let path = e.path.replace(`${articleRoot}/`, "");
      let { created, modified } = await getDates(articleRoot, e.path);

      ret[path] = {
        created,
        hierarchy: generateHierarchyFrom(articleRoot, e.path),
        id: generateIdFrom(articleRoot, e.path),
        modified,
        name: removeExtension(e.name),
        path: e.path.replace(`${articleRoot}/`, ""),
        sizeInBytes: e.stats!.size,
        type: e.dirent.isFile() ? "article" : "folder",
        uri: removeExtension(
          generatePrettyPath(e.path.replace(`${articleRoot}/`, "")),
        ),
      };
    }),
  );

  /**
   * Now add a special entity: the root of the articles. Only do this at the
   * root prefix! This function is used to map things at sub-trees as well!
   *
   * Note that we don't care about the creation and modification dates and set
   * them to Epoch.
   */
  if (prefix === "" && maxDepth > 1) {
    ret["ROOT"] = {
      created: new Date(0),
      hierarchy: [
        {
          name: "ROOT",
          type: "folder",
          uri: "",
        },
      ],
      id: generateIdFrom(articleRoot, "/ROOT"),
      modified: new Date(0),
      name: "Article Root",
      path: "",
      sizeInBytes: 0,
      type: "folder",
      uri: "ROOT",
    };
  }

  return ret;
};

export default entities;
