import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import type { AxiosRequestConfig } from 'axios';
import HttpClient from '../../httpClient/HttpClient';
import { setMyFundraisingPhoto } from './fundraiserConsoleService';

/**
 * The shared client defaults to a JSON content type, and axios answers a JSON content type by
 * turning a form body into JSON — which throws the file away and leaves the server reporting the
 * photo as missing. These tests run the real client, stopping only at the adapter, so the body that
 * would actually go on the wire is the thing asserted.
 */
const PAGE_ID = '9a3c1f76-2c47-4b2c-9c0e-3f8d51f2b7aa';

let sent: AxiosRequestConfig;
const originalAdapter = HttpClient.defaults.adapter;

beforeEach(() => {
  sent = undefined;
  HttpClient.defaults.adapter = async (config) => {
    sent = config;
    return {
      data: { success: true, data: 'photo-unique-id' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    };
  };
});

afterEach(() => {
  HttpClient.defaults.adapter = originalAdapter;
});

describe('fundraiser photo transport', () => {
  it('Photo_SentThroughTheSharedClient_StaysAFormBodyRatherThanBecomingJson', async () => {
    const photo = new File(['binary'], 'portrait.png', { type: 'image/png' });

    await setMyFundraisingPhoto(PAGE_ID, photo);

    expect(sent.data).toBeInstanceOf(FormData);
    expect((sent.data as FormData).get('photo')).toBeInstanceOf(File);
  });

  it('Photo_SentThroughTheSharedClient_DoesNotCarryTheJsonContentType', async () => {
    await setMyFundraisingPhoto(PAGE_ID, new File(['binary'], 'portrait.png', { type: 'image/png' }));

    const contentType = String(sent.headers['Content-Type'] ?? '');

    expect(contentType).not.toContain('application/json');
  });
});
