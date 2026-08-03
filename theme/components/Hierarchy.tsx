export function Hierarchy(props: any) {
  const { nodes, type, uri, revision } = props;

  if (!nodes || nodes.length === 0) return null;

  return (
    <article-breadcrumbs>
      <ul>
        <li>
          <a data-entity-type="folder" href="/ROOT" title="ROOT">
            Root
          </a>
        </li>
        <li>
          <a data-entity-type="folder" href="/Food" title="Food">
            Food
          </a>
        </li>
        <li>
          <a
            data-entity-type="folder"
            href="/Food/Thai_Curry_Experiments"
            title="Thai Curry Experiments"
          >
            Thai Curry Experiments
          </a>
        </li>
        <li>
          <a
            data-entity-type="article"
            href="/Food/Thai_Curry_Experiments/Thai_Green_Curry_Chicken_-_Instant_Pot"
            title="Thai Green Curry Chicken - Instant Pot"
          >
            Thai Green Curry Chicken - Instant Pot
          </a>
        </li>
        <li>
          <a
            data-entity-type="revision-list"
            href="/Food/Thai_Curry_Experiments/Thai_Green_Curry_Chicken_-_Instant_Pot/revisions"
            title="Article revisions"
          >
            Revisions
          </a>
        </li>
        <li>
          <span class="single-revision-title">Revision 24364775</span>
        </li>
      </ul>
    </article-breadcrumbs>
  );
}
