import React, { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import Highlight from "react-highlight.js";
import {
  getArticle,
  getArticles,
  ServiceState,
  IArticle,
  IArticleList,
} from "../services/BockService";

export const NoHome: React.FC = () => {
  return (
    <div className="no-home">
      <h1>There's no home page.</h1>
      <h2>
        Set this up by creating a <code>Home.md</code> in your document repo.
      </h2>
    </div>
  );
};

export const Article: React.FC = () => {
  const { articleTitle } = useParams();
  const location = useLocation();
  const [response, setResponse] = useState<IArticle | ServiceState>(
    ServiceState.Loading,
  );

  useEffect(() => {
    getArticle(articleTitle).then(r => setResponse(r));
  }, []);

  if (response === ServiceState.Loading) {
    return <h1>Loading</h1>;
  } else if (response === ServiceState.Error) {
    return <h1>Error</h1>;
  }

  return (
    <div className="article">
      <h1>{articleTitle}</h1>
      {location.search.indexOf("?raw") > -1 ? (
        <Highlight language="markdown">{response.raw}</Highlight>
      ) : (
        <article dangerouslySetInnerHTML={{ __html: response.html }} />
      )}
    </div>
  );
};

export const ListOfArticles: React.FC = () => {
  const [response, setResponse] = useState<IArticleList | ServiceState>(
    ServiceState.Loading,
  );

  useEffect(() => {
    getArticles().then(r => setResponse(r));
  }, []);

  if (response === ServiceState.Loading) {
    return <h1>Loading</h1>;
  } else if (response === ServiceState.Error) {
    return <h1>Error</h1>;
  }

  return (
    <React.Fragment>
      <h2>List of Articles</h2>
      <ul>
        {response.articles.map(a => {
          return (
            <li>
              <Link to={`/${a.title}`}>{a.title}</Link>
            </li>
          );
        })}
      </ul>
    </React.Fragment>
  );
};

export const Header: React.FC = () => {
  let location = useLocation();

  console.log(location);

  return (
    <nav>
      <li>Search</li>
      <li>
        <Link to="/Home">Home</Link>
      </li>
      <li>
        <Link to="/articles">List of Articles</Link>
      </li>
      <li>Random</li>
      <li>Compare</li>
      <li>Raw</li>
    </nav>
  );
};

export default Header;
