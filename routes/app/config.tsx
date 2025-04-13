import ConfigCollection from "@islands/Config/index.tsx";
import { getHelloPageRedirect, getUserBySession, isAuthorized } from "@utils/auth.ts";
import { requestTransaction } from "@utils/database.ts";

export default async function Config(req: Request) {
  const content = await requestTransaction(req, { action: 'getContent' })

  return <ConfigCollection content={content} />;
}
