import React from "react";
import { Helmet } from "react-helmet";
import { useRouteMatch, Link } from "react-router-dom";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import md from "react-syntax-highlighter/dist/esm/languages/hljs/markdown";
import theme from "react-syntax-highlighter/dist/esm/styles/hljs/github-gist";

import Hierarchy from "./Hierarchy";
import Footer from "./Footer";
import RevisionList from "./RevisionList";
import { Article, MaybePath } from "../types";

import "./Article.css";
import "./CodeHighlight.css";
import { APP_URI } from "../constants";

SyntaxHighlighter.registerLanguage("markdown", md);

const Component: React.FC<{
  article: Article;
}> = ({ article }) => {
  const isRevisions = useRouteMatch<MaybePath>("/:maybeArticlePath+/revisions");
  const isRaw = useRouteMatch<MaybePath>("/:maybeArticlePath+/raw");

  let ret;

  if (isRevisions) {
    ret = (
      <RevisionList
        articlePath={isRevisions.params.maybeArticlePath!}
        revisionList={article.revisions}
      />
    );
  } else if (isRaw) {
    ret = (
      <SyntaxHighlighter language="markdown" style={theme}>
        {article.text}
      </SyntaxHighlighter>
    );
  } else {
    ret = (
      <article>
        <div dangerouslySetInnerHTML={{ __html: article.html }} />
      </article>
    );
  }

  return (
    <>
      <Helmet>
        <meta property="og:title" content={article.name} />
        <meta property="og:description" content={article.excerpt} />
        <meta property="og:url" content={`${APP_URI}/${article.path}`} />

        <title>{article.name}</title>
      </Helmet>

      <Hierarchy hierarchy={article.hierarchy} />

      <header>
        <h1>
          {article.name}{" "}
          {isRaw && <span>Raw</span>}
          {isRaw && <span className="green-badge"><Link to={`/${isRaw.params.maybeArticlePath!}`}>See HTML</Link></span>}
          {isRevisions && <span>Revisions</span>}
        </h1>
      </header>

      {ret}
      <Footer modifiedDate={article.modified} />
    </>
  );
};

export default Component;
