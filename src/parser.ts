import MarkdownIt from "markdown-it";

const markdownParser = new MarkdownIt({
  breaks: false,
  html: true,
  linkify: true,
  typographer: true,
})
  .use(require("markdown-it-prism"))
  .use(require("markdown-it-attrs"))
  .use(require("markdown-it-attribution"), {
    classNameContainer: null,
    classNameAttribution: null,
    marker: "--",
    removeMarker: true,
  });

export default markdownParser;
