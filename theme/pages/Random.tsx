import { Base } from "../components/Base";

export default function Random(props: RandomProps) {
  const listJSON = (props.list || [])
    .map((entity: Entity) => {
      return (
        '{ uri: "' +
        entity.URI +
        '", isFolder: ' +
        (entity.IsFolder ? "true" : "false") +
        " }"
      );
    })
    .join(",");

  const scripts = (
    <script
      type="text/javascript"
      dangerouslySetInnerHTML={{
        __html: `
    (() => {
      const list = [${listJSON}].filter(_ => !_.isFolder).map(_ => _.uri);
      const randomIndex = Math.floor(Math.random() * list.length);
      setTimeout(() => window.location.assign(list[randomIndex]), 3000);
    })();
  `,
      }}
    />
  );

  return (
    <Base {...props} scripts={scripts}>
      <h1>Random article!</h1>
      <div></div>
    </Base>
  );
}
