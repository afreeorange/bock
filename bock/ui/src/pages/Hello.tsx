/**
 * The homepage. This component doesn't need to exist because `Hello.md` is
 * just any other entity/article. But keep this here so you can customize
 * the homepage ♥️
 */

import React from "react";
import { Recent } from ".";

import { Article } from "../components";
import { Article as ArticleT } from "../types";

import "./Hello.css";

const Component: React.FC<{
  articleData: ArticleT;
}> = ({ articleData }) => {
  let ret = (
    <>
      <h1>Looks like you don't have a &#8220;Hello.md&#8221;&hellip;</h1>
      <p>That's OK. Just make one and refresh!</p>
    </>
  );
  if (articleData) {
    ret = <Article article={articleData as ArticleT} />;
  }

  return (
    <div className="hello">
      {ret}
      <hr />
      <Recent hideRoot={true} />
    </div>
  );
};

export default Component;
