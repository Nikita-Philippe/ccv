import UserTable from "@islands/Admin/UserTable.tsx";
import { requestTransaction } from "@utils/database.ts";
import { isSuperAdmin } from "@utils/user.ts";

export default async function Admin(req: Request) {
  // Only "super" admin user has access to this page
  if (!await isSuperAdmin(req)) return Response.redirect(req.url.replace("/app/admin", "/app"), 303);

  const data = await requestTransaction(req, { action: "getSAdminStats" });

  console.log("data: ",data)

  if (!data) return <div>No users</div>;

  return <UserTable users={data} />
}
