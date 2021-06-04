import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";

import { Footer, Loading, Oops } from "../components";
import { linkFromPath } from "../helpers";
import { useArticles } from "../hooks";
import { SimpleListOfArticles } from "../types";

import "./Articles.css";

export const refineArticleDisplay = (name: string) => {
  const fragments = name.split("/");

  if (fragments.length === 1) {
    return name;
  }

  return (
    <>
      {fragments.map((f, idx) => (
        <>
          {f}
          {idx + 1 !== fragments.length && (
            <span>&nbsp;&nbsp;&rarr;&nbsp;&nbsp;</span>
          )}
        </>
      ))}
    </>
  );
};

const Component: React.FC = () => {
  const { state, data } = useArticles();
  const [list, setList] = useState<SimpleListOfArticles | null>(null);

  useEffect(() => {
    setList(data);
  }, [data]);

  const handleChange = (term: string) => {
    if (term.length > 2) {
      let _ = list!.articles.filter((a) =>
        a.name.toLowerCase().includes(term.toLowerCase())
      );

      let update: SimpleListOfArticles = {
        articles: _,
        count: _?.length,
      };

      setList(update);
    } else {
      setList(data);
    }
  };

  if (state === "Loaded" && data) {
    return (
      <div className="articles">
        <Helmet>
          <title>List of Articles</title>
        </Helmet>

        <header>
          <h1>
            Articles <span>{data?.count}</span>
          </h1>
        </header>

        <form role="search">
          <input
            type="search"
            autoFocus
            onChange={(e) => handleChange(e.target.value)}
          />
        </form>

        {list!.articles.length === 0 ? (
          <h1>Got nothing with that term yo...</h1>
        ) : (
          <ul>
            {list!.articles.map((a) => (
              <li key={a.key}>
                <Link to={linkFromPath(a.name)}>
                  {refineArticleDisplay(a.name)}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <Footer />
      </div>
    );
  }

  if (state === "Error") {
    return <Oops />;
  }

  return <Loading />;
};

export default Component;
