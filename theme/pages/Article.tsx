import { Base } from "../components/Base";
import { Hierarchy } from "../components/Hierarchy";

export default function Article(props: any) {
  const footerElements = (
    <>
      <li>{raw(humanizeNumber(props.sizeInBytes) + " bytes")}</li>
      {!props.untracked && (
        <>
          <li>{raw("Created on " + formatDate(props.created, "Monday, 2 January 2006 at 15:04 MST"))}</li>
          <li>{raw("Modified on " + formatDate(props.modified, "Monday, 2 January 2006 at 15:04 MST"))}</li>
          {raw("<br/>")}
          <li>
            <a
              href={"https://github.com/afreeorange/wiki.nikhil.io.articles/edit/master/" + props.relativePath}
              title="Edit this article"
            >
              Edit this article
            </a>
          </li>
        </>
      )}
    </>
  );

  return (
    <Base {...props} footerElements={footerElements}>
      <Hierarchy nodes={props.hierarchy} type={props.type} uri={props.uri} />
      <h1>
        {props.title}
        {props.meta && props.meta.GenerateRevisions && props.untracked && <span>Untracked</span>}
      </h1>
      {raw(props.html)}
    </Base>
  );
}
