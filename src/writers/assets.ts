import { ncp } from "ncp";

import { ASSETS_FOLDER } from "../constants";
import { Bock } from "../types";

/**
 * Note: `fs-extra` did not work with `pkg` and the compiled executable so I
 * had to resort to this ancient-ass (but simple) package instead.
 */
const assets = ({ articleRoot, outputFolder }: Bock) => {
  ncp(
    `${articleRoot}/${ASSETS_FOLDER}`,
    `${outputFolder}/${ASSETS_FOLDER}`,
    (e) => (e ? console.log(`Could not copy assets: ${e}`) : true),
  );

  /**
   * TODO: This is hell. If this were a package, this wouldn't work. WTF.
   */
  ncp(
    `./src/templates`,
    `${outputFolder}`,
    {
      filter: (src) => !src.endsWith("html"),
    },
    (e) => (e ? console.log(`Could not copy assets: ${e}`) : true),
  );
};

export default assets;
