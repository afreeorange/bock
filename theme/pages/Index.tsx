export default function Index(_props: { type: string; version: string }) {
  return (
    <html lang="en">
      <head>
        <meta httpEquiv="refresh" content="0; url=/Home" />
        <title>Redirect</title>
        <link rel="stylesheet" href="/css/styles.css" />
        <style
          dangerouslySetInnerHTML={{
            __html: `
            body {
              flex-direction: column;
              color: #111;
              font-weight: bold;
              font-size: 4em;
              height: 100%;
              display: flex;
              justify-content: center;
            }
            p {
              padding: 2rem;
              margin: 0 auto;
            }
            a {
              text-decoration: underline;
              text-underline-offset: 10px;
            }
        `,
          }}
        />
      </head>
      <body>
        <p>
          <a href="/Home" title="Go to the homepage">
            Click if you are not redirected
          </a>
        </p>
      </body>
    </html>
  );
}
