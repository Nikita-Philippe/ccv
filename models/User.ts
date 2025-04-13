/** base user model, shared between public and signed-in */
interface IUser {
  id: string;
  isAuthenticated: boolean;
  /** The token is used to sign and verify the current user in kv */
  token: string;
}

/** User model of an authenticated user. */
export interface IAuthenticatedUser extends IUser {
  name: string;
  sessionId: string;
  email?: string;
  isAuthenticated: true;
}

/** User model of a public user. */
export interface IPublicUser extends IUser {
  isAuthenticated: false;
  expires: Date;
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
  token: string;
  isAuthenticated?: boolean;
  // Not used yet. For types only
  expires?: string;
}

export interface IRecoverEntry {
  id: string;
  email: string;
}