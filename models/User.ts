import type { DateTime } from "luxon";
import { RequiredBy } from "./Common.ts";

export enum EUserProvider {
  PUBLIC = "public",
  GOOGLE = "google",
}

/** User model of a user. */
export interface IUser {
  id: string;
  /** isAuthenticated will be set to true if the user is connected from an oauth client */
  isAuthenticated: boolean;
  /** The oauth client. Used to limit collision between user ids. */
  provider: `${EUserProvider}`;
}

export interface IAuthenticatedUser extends IUser {
  isAuthenticated: true;
  provider: Exclude<`${EUserProvider}`, EUserProvider.PUBLIC>;
  sessionId: string;
  email?: string;
  name: string;
}

export interface IPublicUser extends IUser {
  isAuthenticated: false;
  provider: `${EUserProvider.PUBLIC}`;
  token: string;
  expires: DateTime;
}

export type TUser = IAuthenticatedUser | IPublicUser;

/** Basic Google user fetched from the Google API */
export interface IGoogleUser {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}

/** User saved in the 'session' kv.
 *
 * It only contains id for referencing, and the token for verifying the user.
 *
 * For 90% on user operations, we just need the user id to refernce correct tables.
 * Is it the right way to do it? Check if this is enough secure.
 */
export interface ISessionUser {
  id: string;
  /** The token is used to sign and verify the current user in kv */
  token: string;
  provider: IUser["provider"];
  isAuthenticated: boolean;
  expires: number;
}

export interface IRecoverEntry {
  id: string;
  email: string;
  provider: IUser["provider"];
}

/** Minimal user object, used in some crypto operations where we don't need all user info */
export type MinUser = RequiredBy<Partial<TUser>, "id" | "isAuthenticated"> & {
  provider?: EUserProvider | `${EUserProvider}`;
};
