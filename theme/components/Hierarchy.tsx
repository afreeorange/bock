export function Hierarchy(props: any) {
  const { nodes, type, uri, revision } = props;

  if (!nodes || nodes.length === 0) return null;

  return (
    <article-hierarchy>
      <ul>
        {nodes.map((node: HierarchicalEntity) => (
          <li>
            <a
              data-entity-type={node.Type}
              href={node.Name === "ROOT" ? "/ROOT" : "/" + node.URI}
              title={node.Name}
            >
              {node.Name === "ROOT" ? "Root" : node.Name}
            </a>
          </li>
        ))}

        {type === "raw" && (
          <li>
            <span>Raw</span>
          </li>
        )}

        {type === "revision" && (
          <>
            <li>
              <a
                data-entity-type="revision-list"
                href={uri + "/revisions"}
                title="Article revisions"
              >
                Revisions
              </a>
            </li>
            <li>
              <span className={"single-revision-title"}>{"Revision " + (revision && revision.ShortId)}</span>
            </li>
          </>
        )}

        {type === "revision-raw" && (
          <>
            <li>
              <a
                data-entity-type="revision-list"
                href={uri + "/revisions"}
                title="Article revisions"
              >
                Revisions
              </a>
            </li>
            <li>
              <a
                data-entity-type="revision"
                href={uri + "/revisions/" + (revision && revision.ShortId)}
                title={"View revision " + (revision && revision.ShortId)}
              >
                {"Revision " + (revision && revision.ShortId)}
              </a>
            </li>
            <li>
              <span>Raw</span>
            </li>
          </>
        )}

        {type === "revision-list" && (
          <li>
            <span className={"multiple-revisions-title"}>Revisions</span>
          </li>
        )}
      </ul>
    </article-hierarchy>
  );
}
