import { Handlers } from "$fresh/server.ts";
import { ISettings } from "@models/App.ts";
import { TField } from "@models/Content.ts";
import { getHelloPageRedirect, getUserBySession } from "@utils/auth.ts";
import { setSettings } from "@utils/settings.ts";

export const handler: Handlers<TField | null> = {
  async PUT(req, _) {
    const user = await getUserBySession(req);
    if (!user?.isAuthenticated) return getHelloPageRedirect(req.url);

    const body = await req.json() as
      | Pick<NonNullable<ISettings["notifications"]>, "onesignal_id" | "push" | "email">
      | null;

    if (!body || !body.onesignal_id) return new Response(null, { status: 400 });

    const newSettings = await setSettings(user.id, "notifications", {
      onesignal_id: body.onesignal_id,
      ...(body.push !== undefined ? { push: body.push } : {}),
      ...(body.email !== undefined ? { email: body.email } : {}),
    });

    return new Response(JSON.stringify(newSettings), { status: 200 });
  },
};
