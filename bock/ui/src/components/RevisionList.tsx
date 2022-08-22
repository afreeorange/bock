import React, { useState } from "react";
import { Link, useHistory, useRouteMatch } from "react-router-dom";

import { MaybePath, RevisionMeta } from "../types";
import { humanReadable, humanReadableRelative } from "../helpers";

export const RevisionList: React.FC<{
  articlePath: string;
  revisionList: RevisionMeta[];
}> = ({ articlePath, revisionList }) => {
  const match = useRouteMatch<MaybePath>("/:maybeArticlePath+/revisions");
  const history = useHistory();

  const [revs, setRevs] = useState<string[]>([]);

  const handleCompare = (rid: string) => {
    let update: string[] = [...revs];

    if (revs.length === 0) {
      update.push(rid);
    } else if (revs.length === 1) {
      // Remove the Revision ID if it's already there!
      if (revs.includes(rid)) {
        update = [...revs.filter((_) => _ !== rid)];
      } else {
        update.push(rid);
      }
    } else {
      update.pop();

      // Only push an ID that's not already there.
      if (!revs.includes(rid)) {
        update.push(rid);
      }
    }

    setRevs(update);
  };

  const handleSubmit = () =>
    history.push(
      `/${match?.params.maybeArticlePath}/compare?a=${revs[0]}&b=${revs[1]}`
    );

  return (
    <div className="revision-list">
      {revisionList.map((revision) => (
        <section key={`revision-wrapper-${revision.id}`}>
          <label htmlFor={`revision-${revision.id}`}>
            <input
              disabled={revisionList.length === 1}
              type="checkbox"
              id={`revision-${revision.id}`}
              value={revision.id}
              onChange={(e) => handleCompare(e.currentTarget.value)}
              checked={revs.includes(revision.id)}
            />
            <Link to={`/${articlePath}/revisions/${revision.id}`}>
              {revision.id}
            </Link>
            <p>{revision.message}</p>
            <p>
              <small>
                <a href={`mailto:${revision.email}`}>{revision.author}</a>
                {", "}
                {humanReadableRelative(revision.committed)} ago, at{" "}
                {humanReadable(revision.committed)}
              </small>
            </p>
          </label>
        </section>
      ))}

      <button type="submit" disabled={revs.length < 2} onClick={handleSubmit}>
        Compare
      </button>
    </div>
  );
};

export default RevisionList;
