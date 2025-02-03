import { PartialBy } from "@models/Common.ts";

/** This is the fields container, containing all fields configured in the app.
 *
 * It is versionned, as you cannot delete an entry. On fields CRUD, the app will
 * create a new version of the fields container.
 */
export interface IContent {
  id: string;
  fields: TField[];
  last_updated: Date;
}

/** This is a single field, containing all the information needed to display it in the app. */
interface IBaseField {
  id: string;
  name: string;
  label: string;
  icon: string;
}

export interface IBooleanField extends IBaseField {
  type: EConfigCardType.boolean;
}

export interface IIntField extends IBaseField {
  type: EConfigCardType.int;
  min: number;
  max: number;
}

export interface IStringField extends IBaseField {
  type: EConfigCardType.string;
}

export interface ITextareaField extends IBaseField {
  type: EConfigCardType.textarea;
}

export interface IMultistringField extends IBaseField {
  type: EConfigCardType.multistring;
  input_nb: number;
}

export enum EConfigCardType {
  boolean = "boolean",
  int = "int",
  string = "string",
  textarea = "textarea",
  multistring = "multistring",
}

/** Available field types. */
export type TField =
  | IBooleanField
  | IIntField
  | IStringField
  | ITextareaField
  | IMultistringField;

/** Minimal object needed for the content, when configuring in the app */
export interface IPartialContent {
  id?: string;
  last_updated?: Date;
  fields: PartialBy<TField, "id">[];
}

/** This is the settings, containing the app settings. */
export interface ISettings {
  saving_hour: number;
  saving_delta: number;
  theme: string;
  notifications: string;
}

/** This is the entry created daily, to store the user's data. */
export interface IDailyEntry {
  /** Use the at date as the primary key. The date is the day of the entry. */
  at: Date;
  content: IContent; // references Content.id
  entries: IEntry[];
}

/** This is a single key-value entry. */
export interface IEntry {
  name: string;
  value: any; // TODO: Define the type of the value
}
