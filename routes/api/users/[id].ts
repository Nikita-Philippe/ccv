import { Handlers } from "$fresh/server.ts";
import { TField } from "@models/Content.ts";
import { getUserBySession } from "@utils/auth.ts";
import { wipeUser } from "@utils/database.ts";
import { isSuperAdmin } from "@utils/user.ts";
import { error } from "node:console";

export const handler: Handlers<TField | null> = {
  async DELETE(req, ctx) {
    try {
      const user = await getUserBySession(req, true);
      if (!user) throw new Error("Invalid request");

      const userId = ctx.params.id;

      if (!userId) throw new Error("Invalid id");

      // Forbidden request. Only super admin can delete a user. User deleting itself should use the settings page.
      if (!await isSuperAdmin(user)) throw new Error("Invalid request");

      await wipeUser(userId);

      return new Response(null, { status: 200 });
    } catch (e) {
      if (e instanceof Error) return new Response(e.message, { status: 400 });

      console.error("Unknown error in user deletion", error);

      return new Response("Internal server error", { status: 500 });
    }
  },
};
