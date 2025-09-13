import { Handlers } from "$fresh/server.ts";
import { TField } from "@models/Content.ts";
import { getUserBySession } from "@utils/user/auth.ts";
import { isSuperAdmin, wipeUser } from "@utils/user/index.ts";

export const handler: Handlers<TField | null> = {
  async DELETE(req, ctx) {
    try {
      const adminUser = await getUserBySession(req, true);
      // Forbidden request. Only super admin can delete a user. User deleting itself should use the settings page.
      if (!await isSuperAdmin(adminUser)) throw new Error("Invalid request");

      const userId = ctx.params.id;

      if (!userId) throw new Error("Invalid id");

      console.log("Deleting user", userId);

      await wipeUser(userId);

      return new Response(null, { status: 200 });
    } catch (e) {
      if (e instanceof Error) return new Response(e.message, { status: 400 });

      console.error("Unknown error in user deletion", e);

      return new Response("Internal server error", { status: 500 });
    }
  },
};
