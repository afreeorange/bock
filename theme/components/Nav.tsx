export function Nav(props: any) {
  const { type, uri, meta, revision } = props;

  return (
    <header>
      <nav>
        <ul>
          <li>
            <a href="/archive" className={type === "archive" ? "active" : ""} title="Archive">
              <span>Archive</span>
            </a>
          </li>
          <li>
            <a
              href="/Home"
              className={uri === "/Home" && type !== "revision-list" ? "active" : ""}
              title="Home"
            >
              <span>Home</span>
            </a>
          </li>
          <li>
            <a href="/random" className={uri === "/random" ? "active" : ""} title="See a random article">
              <span>Random</span>
            </a>
          </li>

          {meta && meta.GenerateRaw && type === "article" && (
            <li>
              <a
                href={uri + "/raw.txt"}
                className={type === "raw" || type === "revision-raw" ? "active" : ""}
                title="View Source"
              >
                <span>Raw</span>
              </a>
            </li>
          )}

          {meta && meta.GenerateRaw && type === "revision" && (
            <li>
              <a
                href={uri + "/revisions/" + (revision && revision.ShortId) + "/raw.txt"}
                className={type === "raw" || type === "revision-raw" ? "active" : ""}
                title="View Source"
              >
                <span>Raw</span>
              </a>
            </li>
          )}

          {(type === "raw" || type === "revision-list") && (
            <li>
              <a href={uri} title="View Article">
                <span>Current Revision</span>
              </a>
            </li>
          )}

          {type === "revision-raw" && (
            <li>
              <a href={uri + "/revisions/" + (revision && revision.ShortId)} title="View Article">
                <span>Current Revision</span>
              </a>
            </li>
          )}

          {meta && meta.GenerateRevisions &&
            (type === "article" ||
              type === "revision" ||
              type === "raw" ||
              type === "revision-raw" ||
              type === "revision-list") && (
              <li>
                <a href={uri + "/revisions"} className={type === "revision-list" ? "active" : ""}>
                  <span>Revisions</span>
                </a>
              </li>
            )}

          {meta && meta.GenerateJSON &&
            (type === "article" ||
              type === "folder" ||
              type === "revision" ||
              type === "raw" ||
              type === "revision-raw" ||
              type === "revision-list") && (
              <li>
                {uri === "" ? (
                  <a href="/ROOT/index.json" title="View JSON Object">
                    <span>JSON</span>
                  </a>
                ) : type === "revision" || type === "revision-raw" ? (
                  <a
                    href={uri + "/revisions/" + (revision && revision.ShortId) + "/index.json"}
                    title="View JSON Object"
                  >
                    <span>JSON</span>
                  </a>
                ) : (
                  <a href={uri + "/index.json"} title="View JSON Object">
                    <span>JSON</span>
                  </a>
                )}
              </li>
            )}
        </ul>
      </nav>
    </header>
  );
}
