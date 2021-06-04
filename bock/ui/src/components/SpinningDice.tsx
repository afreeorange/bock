import React from "react";
import { GiDiceTwentyFacesOne } from "react-icons/gi";

import Message from "./Message";

const Component: React.FC = ({ children }) => (
  <Message>
    <GiDiceTwentyFacesOne style={{ width: "3em", height: "3em" }} />
    <>&nbsp;&nbsp;</>
    <h1>Random article!</h1>
  </Message>
);

export default Component;
