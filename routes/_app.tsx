import { type PageProps } from "$fresh/server.ts";

export default function App({ Component }: PageProps) {
  return (
    <html class="min-h-screen" data-theme="light">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>ccv</title>
        <link rel="apple-touch-icon" sizes="180x180" href="/logo/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/logo/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/logo/favicon-16x16.png" />
        <link rel="manifest" href="/logo/site.webmanifest" />
        <link rel="stylesheet" href="/styles.css" />
        <script src="/loader.js" defer></script>
      </head>
      <body class="min-h-screen">
        <Component />
      </body>
    </html>
  );
}
