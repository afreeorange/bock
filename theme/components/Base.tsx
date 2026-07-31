import { Nav } from "./Nav";
import { Footer } from "./Footer";

export function Base(props: any) {
  const { title, type, version } = props;

  return (
    <>
      {raw("<!DOCTYPE html>")}
      <html lang="en">
        <head>
          {raw('<meta charset="UTF-8"/>')}
          {raw('<meta http-equiv="X-UA-Compatible" content="IE=edge"/>')}
          {raw('<meta name="viewport" content="width=device-width, initial-scale=1.0"/>')}
          {raw('<meta property="og:image" content="/img/logo512.png"/>')}
          {raw('<meta property="og:site_name" content="Nikhil\'s Personal Wiki"/>')}
          {raw('<link rel="og:image" href="/img/logo512.png"/>')}
          {raw('<link rel="icon" href="/img/favicon.png"/>')}
          {raw('<link rel="apple-touch-icon" href="/img/logo192.png"/>')}
          {raw('<link rel="stylesheet" href="/css/styles.css"/>')}
          {raw('<link rel="stylesheet" href="/css/highlight.css"/>')}
          <title>{raw(title + " &ndash; Nikhil&#39;s Personal Wiki")}</title>
          {raw(
            '<script type="text/javascript" id="MathJax-script" defer src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js"></script>'
          )}
          {raw(
            '<script defer data-domain="wiki.nikhil.io" src="https://plausible.io/js/plausible.js"></script>'
          )}
        </head>
        <body>
          <noscript>{raw("&#x1F449; A few things won&#8217;t work if you have JavaScript disabled.")}</noscript>
          <div className={"container" + (type ? " " + type : "")}>
            <Nav {...props} />
            <main>{props.children}</main>
            <Footer {...props} />
          </div>
          {props.scripts}
          {type !== "archive" &&
            raw(`<script type="text/javascript">
        document.body.addEventListener(
          "keypress", (e) => e.key === "f"
          ? window.location.assign("/archive")
          : null);
        window.MathJax = {
          tex: {
            inlineMath: [
              ['$', '$'],
              ['\\\\(', '\\\\)']
            ]
          },
          svg: {
            fontCache: 'global'
          }
        };
      </script>`)}
        </body>
      </html>
    </>
  );
}
