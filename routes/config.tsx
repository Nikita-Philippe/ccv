import { useSignal } from "@preact/signals";
import { getContent } from "../utils/content.ts";
import ConfigCollection from "@islands/Config/index.tsx";

export default async function Config() {
  const content = await getContent();

  return <ConfigCollection content={content} />;
}
