import { type PageProps } from "$fresh/server.ts";

export default function App({ Component }: PageProps) {
  return (
    <html class="min-h-screen" data-theme="light">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>ccv</title>
        <link rel="stylesheet" href="/styles.css" />
        <script src="/loader.js" defer></script>
      </head>
      <body class="min-h-screen">
        <Component />
      </body>
    </html>
  );
}
