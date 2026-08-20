import { AxiosError } from 'axios';

interface ApiErrorBody {
  message?: string;
  title?: string;
}

const FALLBACK_MESSAGE = 'Something went wrong. Please try again.';

/**
 * Turns anything thrown by a service call into one sentence safe to show a user.
 * Axios messages are never surfaced directly — they leak URLs, status codes and transport detail.
 */
export function extractApiError(error: unknown, fallback: string = FALLBACK_MESSAGE): string {
  const body = (error as AxiosError<ApiErrorBody>)?.response?.data;

  if (body?.message) {
    return body.message;
  }

  if (body?.title) {
    return body.title;
  }

  if (error instanceof Error && !(error as AxiosError).isAxiosError) {
    return error.message;
  }

  return fallback;
}
