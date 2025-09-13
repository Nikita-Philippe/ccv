import { DateTime } from "luxon";

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

/** Utility type to make some properties of T optional. */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** Utility type to make some properties of T required. */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/** Utility type to make all properties of T deeply optional. */
export type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;

export type TDailyEntryKey = Date | string | DateTime;
