import ExportButtons from "@islands/Settings/ExportButtons.tsx";
import { getContent } from "../utils/content.ts";
import Card from "@islands/UI/Card.tsx";
import { getHelloPageRedirect, getUserBySession } from "@utils/auth.ts";

export default async function Settings(req: Request) {
  const user = await getUserBySession({ req });
  if (!user) return getHelloPageRedirect(req.url);

  const content = await getContent({ user });

  return (
    <div>
      {content && <ExportButtons content={content} />}
      <Card title={"Sync"} sx={{ content: "flex-col no-wrap" }}>
        {user.isAuthenticated
          ? (
            <>
              <div>
                <p>Id: {user.id}</p>
                <p>Name: {user.name}</p>
                <p>Email: {user.email}</p>
                <p>Session Id: {user.sessionId}</p>
              </div>
              <button class={"btn btn-error w-fit"}>
                <a href="/signout?success_url=/settings">Sign Out</a>
              </button>
            </>
          )
          : (
            <>
              <p>You are not logged in</p>
              <p>Your assigned user id: {user.id}</p>
              <button class={"btn w-fit"}>
                <a href="/signin?success_url=/settings">Sign In</a>
              </button>
            </>
          )}
      </Card>
    </div>
  );
}
