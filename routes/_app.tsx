import { FreshContext } from "$fresh/server.ts";
import { ONESIGNAL_EXTERNAL_ID } from "@utils/constants.ts";
import { getCookies } from "@std/http/cookie";
import { PushCheck } from "@islands/PushCheck.tsx";

// deno-lint-ignore require-await
export default async function App(req: Request, { Component }: FreshContext) {
  // Only instantiate OneSignal in-app
  const fetchOneSignal = Deno.env.get("ONESIGNAL_APP_ID") && new URL(req.url).pathname.startsWith("/app");

  const userOSId = getCookies(req.headers)[ONESIGNAL_EXTERNAL_ID];

  const url = new URL(req.url);
  const pathname = url.pathname;
  const origin = url.origin;
  const pageTitle = "CCV - Habits Tracker";
  const description = "CCV is a simple, privacy-first habit tracker with templates, notifications, and encrypted data.";

  return (
    <html class="min-h-screen" data-theme="light">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{pageTitle}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`${origin}/`} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={`${origin}${pathname}`} />
        <meta property="og:image" content="/logo/apple-touch-icon.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content="/logo/apple-touch-icon.png" />
        <meta name="theme-color" content="#ffffff" />
        <link rel="apple-touch-icon" sizes="180x180" href="/logo/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/logo/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/logo/favicon-16x16.png" />
        <link rel="manifest" href="/logo/site.webmanifest" />

        {/* One signal init script */}
        {fetchOneSignal && (
          <>
            <script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" defer></script>
            <script
              src={`/onesignal-init.js?appId=${encodeURIComponent(Deno.env.get("ONESIGNAL_APP_ID")!)}&safariWebId=${
                encodeURIComponent(Deno.env.get("ONESIGNAL_APP_SAFARI_ID") || "")
              }&isLocal=${req.url.includes("localhost")}${userOSId ? `&userId=${userOSId}` : ""}`}
              defer
            />
          </>
        )}

        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.css" />
        <link rel="stylesheet" href="/styles.css" />
        <script src="/loader.js" defer></script>
      </head>
      <body class="min-h-screen">
        <Component />
        {fetchOneSignal && <PushCheck />}
      </body>
    </html>
  );
}
