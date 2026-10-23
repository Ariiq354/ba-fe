import { FetchError } from "ofetch";

export function extractErrorMessage(error: unknown, fallback = "Terjadi kesalahan."): string {
  if (error instanceof FetchError) {
    return error.data?.detail || fallback;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}
