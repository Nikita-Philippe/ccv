import ConfigCollection from "@islands/Config/index.tsx";
import { getContent } from "../utils/content.ts";

export default async function Config() {
  const content = await getContent();

  return <ConfigCollection content={content} />;
}
