export function Footer(props: any) {
  const { type, uri, meta, version } = props;

  return (
    <footer>
      <p>
        {type === "article" && uri === "/Home" && meta && (
          <>
            {"There are " + humanizeNumber(meta.ArticleCount) + " articles"}
            {meta.GenerateRevisions &&
              " and " + humanizeNumber(meta.RevisionCount) + " revisions"}
            {" in this wiki. It took " +
              meta.GenerationTimeRounded +
              " to generate it on a " +
              meta.CPUCount +
              "-core " +
              meta.Platform +
              "/" +
              meta.Architecture +
              " system with " +
              meta.MemoryInGB +
              "GiB RAM on " +
              formatDate(meta.BuildDate, "Monday, 2 January 2006 at 15:04 MST")}
          </>
        )}
      </p>
      <ul>
        {props.footerElements}
        <li>
          <a
            href="https://github.com/afreeorange/bock"
            title="View the project that generates this wiki on Github"
          >
            {"bock " + version}
          </a>
        </li>
      </ul>
    </footer>
  );
}
