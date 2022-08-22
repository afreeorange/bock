import React from "react";
import { Link } from "react-router-dom";
import { FiFolder, FiFile } from "react-icons/fi";
import { BiGitBranch } from "react-icons/bi";
import { IoIosArrowForward } from "react-icons/io";

import { Hierarchy } from "../types";

const Component: React.FC<{
  hierarchy: Hierarchy;
  hideRoot?: boolean;
}> = ({ hierarchy, hideRoot = false }) => {
  let glom = "";
  let label = "";

  return (
    <nav aria-label="Hierarchy">
      <ol>
        {!hideRoot && (
          <li>
            <Link title={`Root-level entities`} to={"/ROOT"}>
              <BiGitBranch /> Root
            </Link>
            {hierarchy.length > 1 && (
              <span role="separator">
                <IoIosArrowForward />
              </span>
            )}
          </li>
        )}
        {hierarchy.slice(1).map((h, idx) => {
          glom += "/" + h.name.replaceAll(" ", "_");
          label = h.name;

          return (
            <li key={`hierarchy-${idx}`}>
              {h.type === "folder" ? (
                <>
                  <FiFolder />{" "}
                </>
              ) : (
                <>
                  <FiFile />{" "}
                </>
              )}
              <Link title={`Link to ${label}`} to={glom}>
                {label}
              </Link>
              {idx + 2 !== hierarchy.length && (
                <span role="separator">
                  <IoIosArrowForward />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Component;
