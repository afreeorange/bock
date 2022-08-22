import React from "react";
import { Helmet } from "react-helmet";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import theme from "react-syntax-highlighter/dist/esm/styles/hljs/github-gist";
import { useParams, useRouteMatch } from "react-router-dom";

import { Footer, Hierarchy, Loading, Oops } from "../components";
import { useRevision } from "../hooks";
import { MaybePath } from "../types";
import { APP_URI } from "../constants";

const Component = () => {
  const { maybeArticlePath, revisionId } =
    useParams<
      MaybePath & {
        revisionId: string;
      }
    >();
  const { state, data } = useRevision(maybeArticlePath!, revisionId);
  const isRaw = useRouteMatch<MaybePath>(
    "/:maybeArticlePath+/revisions/:revisionId/raw"
  );

  if (state === "Loaded" && data) {
    let ret;

    if (isRaw) {
      ret = (
        <SyntaxHighlighter language="markdown" style={theme}>
          {data.text}
        </SyntaxHighlighter>
      );
    } else {
      ret = <div dangerouslySetInnerHTML={{ __html: data.html }} />;
    }

    const title = `${data.name} - Revision ${revisionId.slice(0, 8)}`;

    return (
      <>
        <Helmet>
          <meta property="og:title" content={title} />
          <meta property="og:description" content={title} />
          <meta
            property="og:url"
            content={`${APP_URI}/${maybeArticlePath}/revisions/${revisionId}`}
          />

          <title>{title}</title>
        </Helmet>

        <Hierarchy hierarchy={data.hierarchy} />

        <header>
          <h1>
            {data.name} <span>Revision {revisionId.slice(0, 8)}</span>
            {isRaw && <span>Raw</span>}
          </h1>
        </header>

        <article>{ret}</article>
        <Footer committedDate={data.committed} />
      </>
    );
  }

  if (state === "Error") {
    return <Oops />;
  }

  return <Loading />;
};

export default Component;
