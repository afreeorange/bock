interface IndexProps {
  type: string;
  version: string;
}

export default function Index(_props: IndexProps) {
  return (
    <html>
      <head>
        <meta httpEquiv="refresh" content="0; url=/Home" />
        <title>Redirect</title>
        <link rel="stylesheet" href="/css/styles.css" />
        <style
          dangerouslySetInnerHTML={{
            __html: `
          body {
            flex-direction: column;
            padding: 0;
            color: white;
            font-weight: bold;
            font-size: 8em;
            height: 100%;
            width: 100%;
            display: flex;
            justify-content: center;
            text-align: center;
          }
          a {
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
