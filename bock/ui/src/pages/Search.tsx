import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { Link, useHistory, useParams } from "react-router-dom";

import { Footer, Loading, Oops } from "../components";
import { linkFromPath } from "../helpers";
import { useSearch } from "../hooks";

import "./Search.css";

export const Results: React.FC<{
  term: string;
}> = ({ term }) => {
  const { state, data } = useSearch(term);

  if (data) {
    return (
      <div className="search-results">
        {data.count === 0 ? (
          <h2>Could not find anything with &#8220;{term}&#8221;</h2>
        ) : (
          <>
            <h2>
              Results for &#8220;{term}&#8221; <span>{data.count}</span>
            </h2>
            {data?.results.map((r) => (
              <section>
                <h3>
                  <Link to={`/${linkFromPath(r.path)}`}>{r.name}</Link>
                </h3>
                <div dangerouslySetInnerHTML={{ __html: r.content_matches }} />
              </section>
            ))}
          </>
        )}
      </div>
    );
  } else {
    if (state === "Error") {
      return <Oops />;
    }
  }

  return <Loading />;
};

export const Search: React.FC = () => {
  const { term } = useParams<{ term: string }>();
  const [searchTerm, setSearchTerm] = useState<string>(term || "");
  const history = useHistory();

  const submitHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    history.push(`/search/${searchTerm}`);
  };

  return (
    <>
      <Helmet>
        <title>Search</title>
      </Helmet>
      <header>
        <h1>Search</h1>
      </header>
      <form role="search" onSubmit={(e) => submitHandler(e)}>
        <input
          autoFocus
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="three characters"
        />
        <button type="submit" disabled={searchTerm.length < 3}>
          go
        </button>
      </form>
      {term && term.length >= 3 && <Results term={term} />}
      <Footer />
    </>
  );
};
