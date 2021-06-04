import React from "react";
import { Helmet } from "react-helmet";
import { useLocation, useRouteMatch } from "react-router-dom";
import * as QueryString from "query-string";
import * as Diff2Html from "diff2html";

import { useCompare } from "../hooks";
import { MaybePath } from "../types";

import "./Compare.css";
import { articleNameFromPath } from "../helpers";
import { Loading } from "../components";

// https://github.com/rtfpessoa/diff2html#diff2html-configuration
const diff2HtmlConfiguration = {
  drawFileList: false,
};

const SafeComparison: React.FC<{
  articlePath: string;
  a: string;
  b: string;
}> = ({ articlePath, a, b }) => {
  const { state, data } = useCompare(articlePath, a, b);

  if (state === "Loaded" && data) {
    return (
      <>
        <Helmet>
          <title>Comparing Revisions</title>
        </Helmet>
        <h1>{articleNameFromPath(articlePath)} - Comparing Revisions</h1>
        <div
          dangerouslySetInnerHTML={{
            __html: Diff2Html.html(data, {
              ...diff2HtmlConfiguration,
              outputFormat: "side-by-side",
            }),
          }}
        />
        <div
          dangerouslySetInnerHTML={{
            __html: Diff2Html.html(data, diff2HtmlConfiguration),
          }}
        />
      </>
    );
  }

  if (state === "Error") {
    return <h1>Could not compare with those SHAs... :/</h1>;
  }

  return <Loading />;
};

// This is more of a SHA check wrapper
const Component = () => {
  const match = useRouteMatch<MaybePath>("/:maybeArticlePath+/compare");
  const location = useLocation();
  const q = QueryString.parse(location.search);

  if (
    !("a" in q || "b" in q) ||
    (q.a as string).trim() === "" ||
    (q.b as string).trim() === ""
  ) {
    return <h1>You must give me two SHAs</h1>;
  }

  return (
    <SafeComparison
      articlePath={match?.params.maybeArticlePath!}
      a={q.a as string}
      b={q.b as string}
    />
  );
};

export default Component;
