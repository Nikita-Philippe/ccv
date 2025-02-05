import { DateTime } from 'luxon';

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

/** Utility type to make some properties of T optional. */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type TDailyEntryKey = Date | string | DateTime;