import { Base } from "../components/Base";
import { Hierarchy } from "../components/Hierarchy";

export default function RevisionList(props: any) {
  const revisions = props.revisions || [];
  const count = revisions.length;
  const label = count === 1 ? "Revision" : "Revisions";

  return (
    <Base {...props}>
      <Hierarchy nodes={props.hierarchy} type={props.type} uri={props.uri} />
      <h1>
        {props.title}
        <span>{raw(count + " " + label)}</span>
      </h1>
      <ul>
        {revisions.map((revision: any) => (
          <li>
            <a href={revision.ShortId} title={"View revision " + revision.ShortId}>
              {revision.ShortId}
            </a>
            {raw("<br/>")}
            <small>{raw(formatDate(revision.Date, "Monday, 2 January 2006 at 15:04 MST"))}</small>
            {revision.Subject && (
              <>
                {raw("<br/>")}
                <small>{revision.Subject}</small>
              </>
            )}
            {raw("<br/>")}
            <small>
              {revision.AuthorName} {raw("<code>&lt;" + revision.AuthorEmail + "&gt;</code>")}
            </small>
          </li>
        ))}
      </ul>
    </Base>
  );
}
