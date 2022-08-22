import React from "react";

import Message from "./Message";

const Component: React.FC = ({ children }) => (
  <Message>
    <h1>Oh no 😔</h1>
    <hr />
    <p>Something appears to have gone terribly wrong.</p>
  </Message>
);

export default Component;
