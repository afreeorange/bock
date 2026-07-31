import { Base } from "../components/Base";
import { Hierarchy } from "../components/Hierarchy";

export default function RevisionRaw(props: any) {
  return (
    <Base {...props}>
      <Hierarchy nodes={props.hierarchy} type={props.type} uri={props.uri} revision={props.revision} />
      <h1>
        {props.title}
        <span>Revision</span>
        <span>{raw("as of " + formatDate(props.revision.Date, "Monday, 2 January 2006 at 15:04 MST"))}</span>
      </h1>
      <pre>
        <code>{props.source}</code>
      </pre>
    </Base>
  );
}
