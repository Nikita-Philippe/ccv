import { escape, unescape } from 'lodash';

/** Encode and sanitize a string to be saved in the database. */
export const encodeString = (str: string): string => {
  return escape(str);
}

/** Decode a string from the database to be displayed in the app. */
export const decodeString = (str: string): string => {
  return unescape(str);
}