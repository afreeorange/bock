import React from "react";
import { GiDiceTwentyFacesOne } from "react-icons/gi";

import Message from "./Message";

import "./SpinningDice.css";

const Component: React.FC = ({ children }) => (
  <Message>
    <GiDiceTwentyFacesOne className="rotate dice" />
    <>&nbsp;&nbsp;</>
    <h1>Random article!</h1>
  </Message>
);

export default Component;
