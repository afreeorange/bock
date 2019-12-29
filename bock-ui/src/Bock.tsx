import React from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";

import { Footer, Header } from "./components";
import { Article, ListOfArticles } from "./components/Header";

import "./code-highlight.scss";

const Bock: React.FC = () => {
  return (
    <div>
      <Router>
        <Header />
        <Switch>
          <Route path="/articles" exact component={ListOfArticles} />
          <Route path="/:articleTitle" component={Article} />
        </Switch>
        <Footer />
      </Router>
    </div>
  );
};

export default Bock;
