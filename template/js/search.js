const REMOTE_DATABASE = "/articles.db";

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

(async () => {
  const sqlPromise = initSqlJs({ locateFile: (file) => `/js/${file}` });
  const dataPromise = fetch(REMOTE_DATABASE).then((res) => res.arrayBuffer());
  const [SQL, buf] = await Promise.all([sqlPromise, dataPromise]);
  const db = new SQL.Database(new Uint8Array(buf));

  const renderer = nunjucks.configure({});
  renderer.addFilter("markMatch", (path) =>
    path.replace(/\>\>\>/g, "<mark>").replace(/\<\<\</g, "</mark>")
  );
  renderer.addFilter("arrowPath", (path) =>
    path.replace(".md", "").replace(/\//g, " &rarr; ")
  );

  const template = `
  {% for row in rows %}
  <li>
    <a href="{{ row.uri }}" title="{{ row.title }}">{{ row.highlightedTitle | arrowPath | markMatch | safe }}</a>
    <span>
    {{ row.content | markMatch | safe }}
    </span>
  </li>
  {% endfor %}
  `;

  const resultsSection = document.querySelector(`[data-content="results"]`);
  const treeSection = document.querySelector(`[data-content="tree"]`);
  const countSection = document.querySelector("h1");
  const oldCount = document.querySelector("h1").innerHTML;

  // Prepare once; reset + rebind on each search instead of re-parsing SQL.
  // snippet max is 64 tokens per FTS5 docs.
  const searchStmt = db.prepare(`
    SELECT
      uri,
      title,
      highlight(articles_fts, 0, '>>>', '<<<') as highlightedTitle,
      snippet(articles_fts, 1, '>>>', '<<<', '...', 64) as content
    FROM articles_fts
    WHERE articles_fts MATCH ?
    ORDER BY RANK
    LIMIT 100
  `);

  document.querySelector("input").addEventListener(
    "keyup",
    debounce((e) => {
      const term = e.target.value;

      if (term && term.length >= 3) {
        searchStmt.reset();
        searchStmt.bind([`title:${term}* OR content:${term}*`]);

        let rows = [];
        while (searchStmt.step()) {
          rows.push(searchStmt.getAsObject());
        }

        const summary =
          rows.length > 1
            ? rows.length.toString() + " results"
            : rows.length === 1
            ? "One result"
            : "No Results :/";

        countSection.innerHTML = term + " <span>" + summary + "</span>";
        treeSection.style.display = "none";
        resultsSection.style.display = "block";
        resultsSection.innerHTML = renderer.renderString(template, {
          count: rows.length,
          term,
          rows,
        });
      } else {
        countSection.innerHTML = oldCount;
        treeSection.style.display = "block";
        resultsSection.style.display = "none";
      }
    }, 150)
  );
})();
