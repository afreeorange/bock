import React from "react";
import { Redirect, useParams } from "react-router-dom";

import { useEntity } from "./hooks";
import { Hello, NotFound } from "./pages";
import Folder from "./components/Folder";
import Article from "./components/Article";
import { Article as ArticleT, Folder as FolderT, MaybePath } from "./types";
import { linkFromPath } from "./helpers";
import { Loading } from "./components";

const EntityRouter: React.FC<{
  entityPath: string;
}> = ({ entityPath }) => {
  const { state, data } = useEntity(linkFromPath(entityPath));

  if (!data && state === "Error") {
    return <NotFound />;
  }

  if (data && state === "Loaded") {
    if (entityPath === "Hello") {
      return <Hello articleData={data as ArticleT} />;
    }

    return data.type === "file" ? (
      <Article article={data as ArticleT} />
    ) : (
      <Folder folder={data as FolderT} />
    );
  }

  return <Loading />;
};

const PreparePath: React.FC = () => {
  let { maybeArticlePath } = useParams<MaybePath>();

  maybeArticlePath = maybeArticlePath || "";

  if (maybeArticlePath.includes(" ")) {
    return <Redirect to={`/${maybeArticlePath.replace(" ", "_")}`} />;
  }

  return <EntityRouter entityPath={maybeArticlePath} />;
};

export default PreparePath;
