export interface HTTPError {
  error: {
    code: number;
    message?: string;
    details?: string[];
  };
}

export enum ERROR_MESSAGE {
  RECOVER_NOT_FOUND = "Recovery is not available for this account",
  RECOVER_MISSING_KEY = "Recovery key is missing",
  RECOVER_MISSING_EMAIL = "Recovery email is missing",
}