import { Base } from "../components/Base";

function EntityNode(props: any) {
  const { entity } = props;
  const type = entity.IsFolder ? "folder" : "article";

  return (
    <li data-entity-type={type}>
      <a href={entity.URI} title={"Go to " + entity.Title}>
        {entity.IsFolder ? <strong>{entity.Title}</strong> : entity.Title}
      </a>
      {entity.Children && entity.Children.length > 0 && (
        <ul>
          {entity.Children.map((child: any) => (
            <EntityNode entity={child} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function Archive(props: any) {
  const scripts = (
    <>
      {raw('<script src="/js/sql-wasm.js"></script>')}
      {raw('<script src="/js/search.js"></script>')}
    </>
  );

  return (
    <Base {...props} scripts={scripts}>
      <h1>{raw("Search " + humanizeNumber(props.meta.ArticleCount) + " articles")}</h1>
      <form role="search">
        <input placeholder="3 or more characters" autofocus />
      </form>
      <ul data-content="results"></ul>
      <ul data-content="tree">
        {props.tree &&
          props.tree.map((entity: any) => <EntityNode entity={entity} />)}
      </ul>
    </Base>
  );
}
