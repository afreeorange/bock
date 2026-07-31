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
        {props.title}
        <span>{count + " " + label}</span>
      </h1>
      <ul>
        {revisions.map((revision: Revision) => (
          <li>
            <a
              href={revision.ShortId}
              title={"View revision " + revision.ShortId}
            >
              {revision.ShortId}
            </a>
            <br />
            <small>
              {formatDate(revision.Date, "Monday, 2 January 2006 at 15:04 MST")}
            </small>
            {revision.Subject && (
              <>
                <br />
                <small>{revision.Subject}</small>
              </>
            )}
            <br />
            <small>
              {revision.AuthorName}{" "}
              <code>{"<" + revision.AuthorEmail + ">"}</code>
            </small>
          </li>
        ))}
      </ul>
    </Base>
  );
}
