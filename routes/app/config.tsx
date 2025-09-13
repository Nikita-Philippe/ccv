import ConfigCollection from "@islands/Config/index.tsx";
import { getContent } from "@utils/content.ts";

export default async function Config(req: Request) {
  const content = await getContent(req);

  return <ConfigCollection content={content} />;
}
