import { AxiosError } from 'axios';
import { describe, expect, it } from 'vitest';
import { extractApiError } from './apiError';

const axiosErrorWith = (data: unknown): AxiosError => {
  const error = new Error('Request failed with status code 500') as AxiosError;
  error.isAxiosError = true;
  error.response = { data, status: 500, statusText: '', headers: {}, config: {} } as never;
  return error;
};

describe('extractApiError', () => {
  it('ExtractApiError_BodyHasMessage_ReturnsMessage', () => {
    expect(extractApiError(axiosErrorWith({ message: 'Campaign is closed.' }))).toBe(
      'Campaign is closed.',
    );
  });

  it('ExtractApiError_BodyHasTitleOnly_ReturnsTitle', () => {
    expect(extractApiError(axiosErrorWith({ title: 'Validation failed' }))).toBe(
      'Validation failed',
    );
  });

  it('ExtractApiError_BodyHasMessageAndTitle_PrefersMessage', () => {
    expect(
      extractApiError(axiosErrorWith({ message: 'Too low.', title: 'Validation failed' })),
    ).toBe('Too low.');
  });

  it('ExtractApiError_AxiosErrorWithoutBody_ReturnsFallbackNotTransportDetail', () => {
    const result = extractApiError(axiosErrorWith(undefined), 'Settings could not be loaded.');

    expect(result).toBe('Settings could not be loaded.');
    expect(result).not.toContain('status code');
  });

  it('ExtractApiError_PlainError_ReturnsItsMessage', () => {
    expect(extractApiError(new Error('The campaign settings could not be read.'))).toBe(
      'The campaign settings could not be read.',
    );
  });

  it('ExtractApiError_NonError_ReturnsDefaultFallback', () => {
    expect(extractApiError('boom')).toBe('Something went wrong. Please try again.');
  });

  it('ExtractApiError_Undefined_ReturnsDefaultFallback', () => {
    expect(extractApiError(undefined)).toBe('Something went wrong. Please try again.');
  });
});
