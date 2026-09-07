import { Base } from "../components/Base";
import { Hierarchy } from "../components/Hierarchy";

const RECENT_ARTICLES_TO_SHOW = 10;

export default function Article(props: ArticleProps) {
  const recentArticles = (props.recentArticles || []).slice(
    0,
    RECENT_ARTICLES_TO_SHOW,
  );

  const footerElements = (
    <>
      <li>{humanizeNumber(props.sizeInBytes) + " bytes"}</li>
      {!props.untracked && (
        <>
          <li>
            {"Created on " +
              formatDate(props.created, "Monday, 2 January 2006 at 15:04 MST")}
          </li>
          <li>
            {"Modified on " +
              formatDate(props.modified, "Monday, 2 January 2006 at 15:04 MST")}
          </li>
          <br />
          <li>
            <a
              href={
                "https://github.com/afreeorange/wiki.nikhil.io.articles/edit/master/" +
                props.relativePath
              }
              title="Edit this article"
            >
              Edit this article
            </a>
          </li>
        </>
      )}
    </>
  );

  const scripts = <script src="/js/table-sort.js" defer></script>;

  return (
    <Base {...props} footerElements={footerElements} scripts={scripts}>
      <article>
        <Hierarchy nodes={props.hierarchy} type={props.type} uri={props.uri} />
        <header>
          <h1>
            {props.title}
            {props.meta && props.meta.GenerateRevisions && props.untracked && (
              <span>Untracked</span>
            )}
          </h1>
        </header>
        <article-content dangerouslySetInnerHTML={{ __html: props.html }} />

        {props.uri === "/Home" && recentArticles.length > 0 && (
          <section data-content="recent-articles">
            <h2>Recently Added or Updated</h2>
            <ul>
              {recentArticles.map((entity: Entity) => (
                <li>
                  <a href={entity.URI}>{entity.Title}</a>
                  <time>{formatDate(entity.Modified, "2 January 2006")}</time>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </Base>
  );
}
