import { Nav } from "./Nav";
import { Footer } from "./Footer";

export function Base(props: any) {
  const { title, type } = props;

  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta property="og:image" content="/img/logo512.png" />
        <meta property="og:site_name" content="Nikhil's Personal Wiki" />
        <link rel="og:image" href="/img/logo512.png" />
        <link rel="icon" href="/img/favicon.png" />
        <link rel="apple-touch-icon" href="/img/logo192.png" />
        <link rel="stylesheet" href="/css/styles.css" />
        <title>{title} – Nikhil's Personal Wiki</title>
        <script
          defer
          data-domain="wiki.nikhil.io"
          src="https://plausible.io/js/plausible.js"
        ></script>
      </head>
      <body>
        <noscript>
          👉 A few things won't work if you have JavaScript disabled.
        </noscript>
        <div className={"container" + (type ? " " + type : "")}>
          <Nav {...props} />
          <main>{props.children}</main>
          <Footer {...props} />
        </div>
        {props.scripts}
        {type !== "archive" && (
          <script
            type="text/javascript"
            dangerouslySetInnerHTML={{
              __html: `
        document.body.addEventListener(
          "keypress", (e) => e.key === "f"
          ? window.location.assign("/archive")
          : null);
      `,
            }}
          />
        )}
      </body>
    </html>
  );
}
