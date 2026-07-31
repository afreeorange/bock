import { Base } from "../components/Base";
import { Hierarchy } from "../components/Hierarchy";

export default function Folder(props: any) {
  return (
    <Base {...props}>
      <Hierarchy nodes={props.hierarchy} type={props.type} uri={props.uri} />
      <h1>{props.title}</h1>
      {props.readme && <div dangerouslySetInnerHTML={{__html: props.readme}} />}
      <ul data-content="tree">
        {props.children &&
          props.children.Folders &&
          props.children.Folders.map((child: any) => (
            <li data-entity-type="folder">
              <strong>
                <a href={child.URI} title={child.Name}>
                  {child.Name}
                </a>
              </strong>
            </li>
          ))}
        {props.children &&
          props.children.Articles &&
          props.children.Articles.map((child: any) => (
            <li data-entity-type="article">
              <a href={child.URI} title={child.Name}>
                {child.Name}
              </a>
            </li>
          ))}
      </ul>
    </Base>
  );
}
