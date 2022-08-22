import { writeFile } from "fs/promises";

import highlight from "highlight.js";

import { JSON_PADDING } from "../constants";
import { mkdirp } from "../helpers";
import { render } from "../renderer";
import { getRevision } from "../repository";
import { Article, Bock, ShortRevision } from "../types";

const raw = async (bock: Bock, article: Article) => {
  const { outputFolder, prettify, showProgress } = bock;
  const { name, uri } = article;

  await mkdirp(`${outputFolder}/${article.uri}/raw`);

  if (showProgress) {
    console.log(`Writing ${article.name} - Raw`);
  }

  await writeFile(
    `${outputFolder}/${article.uri}/raw/index.html`,
    render({
      template: `raw.html`,
      variables: {
        type: "raw",
        name,
        uri,

        entity: article,
        raw: highlight.highlight(article.source!, {
          language: "markdown",
        }).value,
      },
      prettify,
    }),
  );
};

const revisionList = async (bock: Bock, article: Article): Promise<void> => {
  const { outputFolder, prettify, showProgress } = bock;

  const revisionListFolder = `${outputFolder}/${article.uri}/revisions`;
  await mkdirp(revisionListFolder);

  if (showProgress) {
    console.log(`Writing ${article.name} - Revision List`);
  }

  await writeFile(
    `${revisionListFolder}/index.json`,
    `{ "revisions": ${JSON.stringify(article.revisions, null, JSON_PADDING)}}`,
  );

  await writeFile(
    `${revisionListFolder}/index.html`,
    render({
      template: `revision-list.html`,
      variables: {
        type: "revision-list",
        name: article.name,
        uri: article.uri,

        entity: article,
      },
      prettify,
    }),
  );
};

const revision = async (
  bock: Bock,
  article: Article,
  revision: ShortRevision,
) => {
  const { outputFolder, prettify, showProgress } = bock;
  const revisionPath = `${outputFolder}/${article.uri}/revisions/${revision.shortId}`;
  await mkdirp(`${revisionPath}`);

  const revisionData = await getRevision(
    bock.articleRoot,
    article.path,
    revision.id,
  );

  if (showProgress) {
    console.log(`Writing ${article.name} - Revision ${revision.shortId}`);
  }

  await writeFile(
    `${revisionPath}/index.json`,
    JSON.stringify(revisionData, null, JSON_PADDING),
  );

  await writeFile(
    `${revisionPath}/index.html`,
    render({
      template: `revision.html`,
      variables: {
        type: "revision",
        name: article.name,
        uri: article.uri,

        entity: article,
        revisionData,
      },
      prettify,
    }),
  );
};

const revisions = async (bock: Bock, article: Article): Promise<void> => {
  const { outputFolder, statistics } = bock;

  await mkdirp(`${outputFolder}/${article.uri}/revisions`);
  await Promise.all(
    article.revisions.map(async (r) => revision(bock, article, r)),
  );

  statistics.updateArticleRevisionsCount(article.revisions.length);
};

export default {
  revisionList,
  revisions,
  revision,
  raw,
};
