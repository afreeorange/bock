import React from "react";
import { BsClock } from "react-icons/bs";

import { Hierarchy, Loading, Oops } from "../components";
import { humanReadableRelative, humanSize } from "../helpers";
import { useStatistics } from "../hooks";

import "./Recent.css";

export const Component: React.FC<{
  hideRoot?: boolean;
}> = ({ hideRoot = false }) => {
  const { state, data } = useStatistics();

  if (state === "Loading") {
    return <Loading />;
  }

  if (state === "Error") {
    return <Oops />;
  }

  return (
    <div className="recent">
      <h2>Recent Updates</h2>
      {data &&
        data.latest.map((a) => (
          <section key={a.key}>
            <Hierarchy hierarchy={a.hierarchy} hideRoot={hideRoot} />
            <p>{a.excerpt}</p>
            <p>
              <BsClock /> {humanReadableRelative(a.modified)} ago,{" "}
              {humanSize(a.size_in_bytes)}
            </p>
          </section>
        ))}
    </div>
  );
};

export default Component;
