import React from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";

import { Footer } from ".";
import { Folder } from "../types";
import Hierarchy from "./Hierarchy";

import "./Folder.css";

const Component = ({ folder }: { folder: Folder }) => {
  return (
    <div className="folder">
      <Helmet>
        <title>{folder.name}</title>
      </Helmet>

      <Hierarchy hierarchy={folder.hierarchy} />

      {folder.hierarchy.length > 1 && (
        <>
          <header>
            <h1>{folder.name}</h1>
          </header>
          {folder.folder_readme.present && (
            <div
              dangerouslySetInnerHTML={{ __html: folder.folder_readme.html }}
            />
          )}
        </>
      )}

      <hr />

      <div className="entities">
        {folder.children.folders.length > 0 && (
          <section className="folders">
            <h2>
              Folders <span>{folder.children.folders.length}</span>
            </h2>
            {folder.children.folders.map((folder) => (
              <li key={folder.key}>
                <Link to={`/${folder.path}`} key={folder.key}>
                  {folder.name}
                </Link>
              </li>
            ))}
          </section>
        )}

        {folder.children.articles.length > 0 ? (
          <section className="articles">
            <h2>
              Articles <span>{folder.children.articles.length}</span>
            </h2>
            {folder.children.articles.map((article) => (
              <li key={article.key}>
                <Link to={`/${article.path}`} key={article.key}>
                  {article.name}
                </Link>
              </li>
            ))}
          </section>
        ) : (
          <section className="no-articles">
            Looks like there are no articles in this folder
          </section>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Component;