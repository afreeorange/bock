import { HTMLBeautifyOptions } from "js-beautify";

export const ASSETS_FOLDER = "__assets";
export const BEAUTIFY_OPTIONS: HTMLBeautifyOptions = {
  end_with_newline: false,
  indent_char: " ",
  indent_empty_lines: false,
  indent_size: 2,
  max_preserve_newlines: -1,
  preserve_newlines: false,
  wrap_line_length: 0,
};
export const ENTITIES_TO_IGNORE = [".git", "search"];
export const HOME_PAGE_DOCUMENT = "Home.md";
export const JSON_PADDING = 2;
export const MAX_DEPTH = 6;
export const MAX_RECENT_ARTICLES = 15;
export const ROOT_NODE_NAME = "ROOT";
export const UUID_NAMESPACE = "59D9B91E-93D8-4A1E-8373-D4B574283E3B";
