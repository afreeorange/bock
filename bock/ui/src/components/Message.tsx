import React from "react";

import "./Message.css";

const Component: React.FC = ({ children }) => (
  <div className="message">{children}</div>
);

export default Component;
