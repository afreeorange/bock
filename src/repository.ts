/**
 * Yeah, I'm just parsing command-line `git` output here. Every other option
 * (simplegit, node-git) was too heavy and complicated for the simple shit I
 * wanted. No pipes or anything UNIX-y btw.
 */

import util from "util";
const exec = util.promisify(require("child_process").exec);

import { stat } from "fs/promises";

import { Revision, RevisionList } from "./types";
import parser from "./parser";

export const getDates = async (
  articleRoot: string,
  articlePath: string,
): Promise<{
  created: Date;
  modified: Date;
}> => {
  const path = articlePath.replace(`${articleRoot}/`, "");
  let { ctime, mtime } = await stat(articlePath);
  let ret = {
    created: ctime,
    modified: mtime,
  };

  try {
    const { stdout, stderr } = await exec(
      `git -C ${articleRoot} log --diff-filter=AM --follow --format=%aD --reverse -- "${path}"`,
    );

    // Case I
    if (stderr || !stdout) {
      return ret;
    }

    // Case II
    else {
      const _ = stdout.split("\n");

      return {
        created: new Date(_[0]),
        modified: new Date(_[_.length - 2]),
      };
    }
  } catch (error) {
    console.error(`Dates error: ${articlePath}: ${error}`);
    return ret;
  }
};

export const getRevisionList = async (
  articleRoot: string,
  articlePath: string,
): Promise<RevisionList> => {
  const path = articlePath.replace(`${articleRoot}/`, "");
  let revisionList: RevisionList;

  try {
    /**
     * https://gist.github.com/varemenos/e95c2e098e657c7688fd
     */
    let { stdout, stderr } = await exec(
      `git -C ${articleRoot} log --pretty=format:'{ "id": "%H", "shortId": "%h", "date": "%aD", "subject": "%f", "body": "%b", "author": { "name": "%aN", "email": "%aE"}}' "${path}"`,
    );

    if (stderr || !stdout) {
      return [];
    }

    /**
     * Output does not have commas. Add them and make a list before parsing as
     * JSON. Then parse the dates before returning the list.
     */
    revisionList = JSON.parse(`[${stdout.split("\n").join(",")}]`);

    return revisionList.map((r) => ({
      ...r,
      date: new Date(r.date),
    }));
  } catch (error) {
    console.error(`Revision List error: ${articlePath}: ${error}`);
    return [];
  }
};

export const getRevision = async (
  articleRoot: string,
  articlePath: string,
  id: string,
): Promise<Revision> => {
  const path = articlePath.replace(`${articleRoot}/`, "");
  let ret: Revision = {
    id,
    shortId: id.slice(0, 7),
    html: "",
    source: "",
  };

  try {
    let { stdout, stderr } = await exec(
      `git -C ${articleRoot} show "${id}:${path}"`,
    );

    if (stderr || !stdout) {
      return ret;
    }

    return {
      ...ret,
      source: stdout,
      html: parser.render(stdout),
    };
  } catch (error) {
    console.error(`Revision error: ${articlePath}: ${error}`);
    return ret;
  }
};
