import nunjucks from "nunjucks";
import numeral from "numeral";
import formatDate from "date-fns/format";
import beautify from "js-beautify";

import { BEAUTIFY_OPTIONS } from "./constants";
import { TemplateVariables } from "./types";
import packageInfo from "../package.json";

/**
 * FUCKING NUNJUCKS
 * https://stackoverflow.com/questions/39050788/nunjucks-template-not-found
 */
const renderer = nunjucks.configure(`${__dirname}/templates`, {});

/**
 * Some custom filters
 */
renderer.addFilter("numeral", (number: string, format: string) => {
  const n = numeral(number);
  return format === "value" ? n.value() : n.format(format);
});

renderer.addFilter("date", (date: Date, format: string = "MMM") =>
  formatDate(date, format),
);

renderer.addGlobal("now", new Date());

export const render = ({
  template,
  variables,
  prettify,
}: {
  template: string;
  variables: TemplateVariables;
  prettify: boolean;
}) => {
  const rendered = renderer.render(template, {
    ...variables,
    packageInfo,
  });

  return prettify ? beautify.html(rendered, BEAUTIFY_OPTIONS) : rendered;
};
