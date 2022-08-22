import React from "react";

import Message from "./Message";

const Component: React.FC = ({ children }) => (
  <Message>
    <h1>Could not find that article or folder... sorry.</h1>
  </Message>
);

export default Component;
