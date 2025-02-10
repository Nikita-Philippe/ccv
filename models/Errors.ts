export interface HTTPError {
  error?: {
    message: string;
    details: string[];
  };
}
