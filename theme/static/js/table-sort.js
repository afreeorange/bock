document.querySelectorAll("article-content table").forEach((table) => {
  const thead = table.querySelector("thead");
  const tbody = table.querySelector("tbody");
  if (!thead || !tbody) return;

  const headers = thead.querySelectorAll("th");
  let sortCol = -1;
  let sortAsc = true;

  headers.forEach((th, i) => {
    th.style.cursor = "pointer";
    th.style.userSelect = "none";
    th.addEventListener("click", () => {
      if (sortCol === i) {
        sortAsc = !sortAsc;
      } else {
        sortCol = i;
        sortAsc = true;
      }

      const rows = Array.from(tbody.rows);
      const numeric = rows.every((r) => {
        const v = r.cells[i]?.textContent.trim();
        return v === "" || !isNaN(v);
      });

      rows.sort((a, b) => {
        const av = a.cells[i]?.textContent.trim() ?? "";
        const bv = b.cells[i]?.textContent.trim() ?? "";
        if (numeric) return (parseFloat(av) || 0) - (parseFloat(bv) || 0);
        return av.localeCompare(bv);
      });

      if (!sortAsc) rows.reverse();
      rows.forEach((r) => tbody.appendChild(r));

      headers.forEach((h, j) => {
        h.textContent = h.textContent.replace(/ [▲▼]$/, "");
        if (j === i) h.textContent += sortAsc ? " ▲" : " ▼";
      });
    });
  });
});
