import { Base } from "../components/Base";
import { Hierarchy } from "../components/Hierarchy";

export default function RevisionList(props: RevisionListProps) {
  const revisions = props.revisions || [];
  const count = revisions.length;
  const label = count === 1 ? "Revision" : "Revisions";

  return (
    <Base {...props}>
      <Hierarchy nodes={props.hierarchy} type={props.type} uri={props.uri} />
      <h1>
        {props.title} <span>{count + " " + label}</span>
      </h1>
      <revision-list>
        <ul>
          {revisions.map((revision: Revision) => (
            <li>
              <a
                href={revision.ShortId}
                title={"View revision " + revision.ShortId}
              >
                {revision.ShortId}
              </a>
              {revision.Subject && (
                <>
                  <br />
                  <revision-subject>{revision.Subject}</revision-subject>
                </>
              )}
              <br />
              <revision-author>
                {revision.AuthorName}{" "}
                <code>{"<" + revision.AuthorEmail + ">"}</code>
              </revision-author>{" "}
              <revision-date>
                {formatDate(
                  revision.Date,
                  "Monday, 2 January 2006 at 15:04 MST",
                )}
              </revision-date>
            </li>
          ))}
        </ul>
      </revision-list>
    </Base>
  );
}
