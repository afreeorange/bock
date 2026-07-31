export function Footer(props: any) {
  const { type, uri, meta, version } = props;

  return (
    <footer>
      <p>
        {type === "article" && uri === "/Home" && meta && (
          <>
            {raw("There are " + humanizeNumber(meta.ArticleCount) + " articles")}
            {meta.GenerateRevisions &&
              raw(" and " + humanizeNumber(meta.RevisionCount) + " revisions")}
            {raw(
              " in this wiki. It took " +
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
                formatDate(meta.BuildDate, "Monday, 2 January 2006 at 15:04 MST")
            )}
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
            {raw("bock " + version)}
          </a>
        </li>
      </ul>
    </footer>
  );
}
