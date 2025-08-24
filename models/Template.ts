import { IPartialContent } from "./Content.ts";

export type AvailableTemplateType = "content";

/** Template configuration model */
export interface ITemplate {
  type: AvailableTemplateType;
  label: string;
  description: {
    title: string;
    description?: string;
    image?: string;
  };
  content: IPartialContent;
}