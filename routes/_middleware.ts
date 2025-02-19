import { FreshContext } from "$fresh/server.ts";
import { verifyBetaCode } from "@utils/auth.ts";
import { getCookies } from "$std/http/cookie.ts";

const authorizedRoutes = [
  "/beta",
  "/styles.css",
  "/favicon.ico",
];

export async function handler(req: Request, ctx: FreshContext) {
  const { url } = req;
  const route = new URL(url).pathname;

  if (!authorizedRoutes.includes(route)) {
    const betaCode = getCookies(req.headers).beta_code;
    if (!betaCode || betaCode && !await verifyBetaCode(betaCode, true)) {
      return new Response("", {
        status: 303,
        headers: {
          Location: `/beta`,
        },
      });
    }
  }

  const resp = await ctx.next();
  return resp;
}
