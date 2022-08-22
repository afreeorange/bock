import { writeFile } from "fs/promises";

import { mkdirp } from "../helpers";
import { render } from "../renderer";
import { Bock } from "../types";

const random = async ({ listOfEntities, outputFolder, prettify }: Bock) => {
  await mkdirp(`${outputFolder}/random`);

  await writeFile(
    `${outputFolder}/random/index.html`,

    render({
      template: `random.html`,
      variables: {
        type: "random",
        name: "Random Article",
        uri: "/random",

        listOfEntities,
      },
      prettify,
    }),
  );
};

export default random;
