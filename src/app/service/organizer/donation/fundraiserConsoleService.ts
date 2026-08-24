import HttpClient from '../../httpClient/HttpClient';
import {
  FundraiserPageUpdate,
  FundraiserPhotoResponse,
  MyFundraisingListResponse,
  MyFundraisingPage,
  MyFundraisingPageResponse,
} from 'app/interface/donationInter/fundraiserConsoleDto';

const CONSOLE_URL = '/api/member/my-fundraising';

const NOT_FOUND_MESSAGE = 'Fundraising page not found.';

/**
 * Which page is being addressed comes from the URL bar, so it is caller input and is encoded. Whether
 * the page is theirs is decided by the server against the token, never here.
 */
const pageUrl = (fundraiserUniqueId: string) =>
  `${CONSOLE_URL}/${encodeURIComponent(fundraiserUniqueId)}`;

const photoUrl = (fundraiserUniqueId: string) => `${pageUrl(fundraiserUniqueId)}/photo`;

export const getMyFundraisingPages = async (): Promise<MyFundraisingPage[]> => {
  const { data } = await HttpClient.get<MyFundraisingListResponse>(CONSOLE_URL);

  if (!data?.success || !Array.isArray(data.data)) {
    throw new Error(data?.message ?? 'Could not load your fundraising pages.');
  }

  return data.data;
};

export const getMyFundraisingPage = async (
  fundraiserUniqueId: string,
): Promise<MyFundraisingPage> => {
  const { data } = await HttpClient.get<MyFundraisingPageResponse>(pageUrl(fundraiserUniqueId));

  if (!data?.success || !data.data) {
    throw new Error(data?.message ?? NOT_FOUND_MESSAGE);
  }

  return data.data;
};

export const updateMyFundraisingPage = async (
  fundraiserUniqueId: string,
  update: FundraiserPageUpdate,
): Promise<MyFundraisingPage> => {
  const { data } = await HttpClient.put<MyFundraisingPageResponse>(
    pageUrl(fundraiserUniqueId),
    update,
  );

  if (!data?.success || !data.data) {
    throw new Error(data?.message ?? 'Could not save your page.');
  }

  return data.data;
};

/**
 * Sends the photo as multipart, which is what the endpoint binds. The multipart content type has to
 * be asked for on the request: the shared client defaults to JSON, and axios turns a form body into
 * JSON whenever the content type says JSON, which strips the file and leaves the server with nothing
 * to bind. The browser replaces this value with one carrying the boundary before the body is sent.
 */
export const setMyFundraisingPhoto = async (
  fundraiserUniqueId: string,
  photo: File,
): Promise<string> => {
  const body = new FormData();
  body.append('photo', photo);

  const { data } = await HttpClient.post<FundraiserPhotoResponse>(
    photoUrl(fundraiserUniqueId),
    body,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );

  if (!data?.success || !data.data) {
    throw new Error(data?.message ?? 'Could not save your photo.');
  }

  return data.data;
};

export const removeMyFundraisingPhoto = async (fundraiserUniqueId: string): Promise<void> => {
  const { data } = await HttpClient.delete<FundraiserPhotoResponse>(photoUrl(fundraiserUniqueId));

  if (!data?.success) {
    throw new Error(data?.message ?? 'Could not remove your photo.');
  }
};

/**
 * Where a stored photo is served from. Built against the API's own address rather than left relative:
 * an <img> is not sent through HttpClient, so a relative path would be resolved against whatever host
 * is serving the app and would miss the API entirely wherever the two are not the same origin.
 */
export const fundraiserPhotoUrl = (photoUniqueId: string) => {
  const apiBase = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '');

  return `${apiBase}/api/images/${encodeURIComponent(photoUniqueId)}.png`;
};
