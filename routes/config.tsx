import ConfigCollection from "@islands/Config/index.tsx";
import { getHelloPageRedirect, getUserBySession } from "@utils/auth.ts";
import { getContent } from "../utils/content.ts";

export default async function Config(req: Request) {
  const user = await getUserBySession({ req });
  if (!user) return getHelloPageRedirect(req.url);

  const content = await getContent({ user });

  return <ConfigCollection content={content} />;
}
