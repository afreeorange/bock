import { extname } from "path";
import { MakeDirectoryOptions } from "fs";
import { mkdir } from "fs/promises";

import { v5 as uuidv5 } from "uuid";

import { ROOT_NODE_NAME, UUID_NAMESPACE } from "./constants";
import { EntityHierarchy } from "./types";

export const generateIdFrom = (articleRoot: string, articlePath: string) =>
  uuidv5(`${articleRoot}/${articlePath}`, UUID_NAMESPACE);

export const generatePrettyPath = (entityPath: string) =>
  entityPath.replace(/\s+/g, "_");

export const removeExtension = (articlePath: string) =>
  articlePath.replace(extname(articlePath), "");

export const mkdirp = async (path: string, options?: MakeDirectoryOptions) => {
  try {
    await mkdir(path, options);
  } catch (error) {
    if (!(error as Error).message.includes("EEXIST")) {
      console.log(`Error creating ${path} folder: ${error}`);
    }
  }
};

export const generateHierarchyFrom = (
  articleRoot: string,
  articlePath: string,
): EntityHierarchy[] => {
  const initialList = [
    ROOT_NODE_NAME,
    ...articlePath
      .replace(articleRoot, "")
      .split("/")
      .filter((p) => p !== ""),
  ].map((e) => ({
    name: removeExtension(e),
    type: extname(e).toLowerCase().includes("md") ? "article" : "folder",
    uri: removeExtension(generatePrettyPath(e.replace(`${articleRoot}/`, ""))),
  }));

  let finalList: any[] = [
    {
      ...initialList[0],
      uri: "",
    },
  ];

  for (let i = 1; i < initialList.length; i++) {
    finalList.push({
      name: initialList[i].name,
      type: initialList[i].type,
      uri: initialList
        .slice(1, i + 1)
        .map((_) => _.uri)
        .reduce((a, v) => a + "/" + v),
    });
  }

  return finalList;
};

export const stripHTML = (html = "") =>
  html.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>?/gi, "");

export const trim = (s: string) => s.replace(/^\s+|\s+$/g, "");

export const removeTrailingSlashes = (s: string) =>
  s.replace(/(.*)[\/].$/g, "$1");

/**
 * TODO: How would you accomplish this with a simple closure?
 */
export class Statistics {
  articleCount: number;
  revisionCount: number;
  revisionAverage: number;
  generationTimeInSeconds: number;

  constructor() {
    /**
     * NOTE: Starting with 1 since we include the 'fake' ROOT entity...
     */
    this.articleCount = 1;
    this.revisionCount = 0;
    this.revisionAverage = 0;
    this.generationTimeInSeconds = 0;
  }

  setArticleCount(count: number) {
    this.articleCount = count - 1;
  }

  updateArticleRevisionsCount(count: number) {
    this.revisionCount += count;
    this.revisionAverage = Math.round(this.revisionCount / this.articleCount);
  }

  updateGenerationTime(count: number) {
    this.generationTimeInSeconds = count;
  }
}
