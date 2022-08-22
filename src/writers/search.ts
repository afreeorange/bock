import { writeFile } from "fs/promises";

import { mkdirp } from "../helpers";
import { render } from "../renderer";
import { Bock } from "../types";

const search = async (bock: Bock) => {
  const { outputFolder, listOfEntities, prettify } = bock;

  await mkdirp(`${outputFolder}/search`);

  await writeFile(
    `${outputFolder}/search/index.html`,
    render({
      template: `search.html`,
      variables: {
        type: "search",
        name: "Search Articles",
        uri: "/search",

        // Don't want to render the ROOT entity. It's special.
        articles: listOfEntities.filter((e) => e.uri !== "ROOT"),
      },
      prettify,
    }),
  );
};

export default search;
