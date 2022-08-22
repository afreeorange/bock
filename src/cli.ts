import { existsSync } from "fs";

import { Command } from "commander";

import { removeTrailingSlashes, trim } from "./helpers";
import packageJson from "../package.json";

const CLI = new Command();

CLI.version(packageJson.version)
  .requiredOption(
    "-a, --article-root <articleRoot>",
    "Git repo containing your articles",
  )
  .requiredOption(
    "-o, --output-folder <outputFolder>",
    "Output folder for generated articles",
  )
  .option("-d, --debug", "Show debugging information", false)
  .option("-s, --serve", "Run a local live-reloading server", false)
  .option("-b, --build", "Build all the static output", false)
  .option("-w, --watch", "Watch the output folder for changes", false)
  .option("-c, --clean", "Clear output folder before writing", false)
  .option("-s, --progress", "View article generation progress (slow)", false)
  .option("-p, --prettify", "Prettify output HTML (slow)", false);

export const getArguments = () => {
  CLI.parse(process.argv);
  let { articleRoot, outputFolder, watch, prettify, progress } = CLI.opts();

  // Check if the articles and output folders exist
  if (!existsSync(articleRoot)) {
    console.error(`The supplied article root does not exist: ${articleRoot}`);
  } else {
    articleRoot as string;
  }

  if (!existsSync(outputFolder)) {
    console.error(`The supplied output folder does not exist: ${outputFolder}`);
  }

  return {
    articleRoot: removeTrailingSlashes(trim(articleRoot)),
    outputFolder: removeTrailingSlashes(trim(outputFolder)),
    watch,
    prettify,
    progress,
  };
};
