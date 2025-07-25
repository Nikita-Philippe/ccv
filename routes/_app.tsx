import { FreshContext } from "$fresh/server.ts";
import { ONESIGNAL_EXTERNAL_ID } from "@utils/constants.ts";
import { getCookies } from "@std/http/cookie";
import { PushCheck } from "@islands/PushCheck.tsx";

// deno-lint-ignore require-await
export default async function App(req: Request, { Component }: FreshContext) {
  
  const userOSId = getCookies(req.headers)[ONESIGNAL_EXTERNAL_ID];

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

        {/* One signal init script */}
        <script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" defer></script>
        <script
          src={`/onesignal-init.js?appId=${encodeURIComponent(Deno.env.get("ONESIGNAL_APP_ID")!)}&safariWebId=${
            encodeURIComponent(Deno.env.get("ONESIGNAL_APP_SAFARI_ID") || "")
          }&isLocal=${Deno.env.get("ENVIRONMENT") === "local"}${userOSId ? `&userId=${userOSId}` : ""}`}
          defer
        />

        <link rel="stylesheet" href="/styles.css" />
        <script src="/loader.js" defer></script>
      </head>
      <body class="min-h-screen">
        <Component />
        <PushCheck />
      </body>
    </html>
  );
}
