import React from "react";
import { BsThreeDots } from "react-icons/bs";
import { IoBeerOutline } from "react-icons/io5";

import packageJson from "../../package.json";
import { humanReadable, humanReadableRelative } from "../helpers";

import "./Footer.css";

type Props = {
  modifiedDate?: string;
  committedDate?: string;
};

const Component = ({ modifiedDate, committedDate }: Props) => {
  let date = modifiedDate;
  let text = "modified";

  if (committedDate) {
    date = committedDate;
    text = "committed";
  }

  return (
    <footer>
      <p>
        {date && (
          <>
            Last {text} {humanReadableRelative(date)} ago, at{" "}
            {humanReadable(date)}
            {" "}<BsThreeDots />{" "}
          </>
        )}
        <a href="https://github.com/afreeorange/bock" title="Powered by Bock">
          <IoBeerOutline /> v{packageJson.version}
        </a>
      </p>
    </footer>
  );
};

export default Component;
