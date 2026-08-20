import HttpClient from '../../httpClient/HttpClient';
import {
  PeerToPeerSettings,
  PeerToPeerSettingsDetail,
  PeerToPeerSettingsResponse,
  PeerToPeerUpdateResponse,
} from 'app/interface/donationInter/peerToPeerDto';

const settingsUrl = (campaignUniqueId: string) =>
  `/api/donation/campaign/${campaignUniqueId}/peer-to-peer/settings`;

export const getPeerToPeerSettings = async (
  campaignUniqueId: string,
): Promise<PeerToPeerSettingsDetail> => {
  const { data } = await HttpClient.get<PeerToPeerSettingsResponse>(settingsUrl(campaignUniqueId));

  if (!data?.data) {
    throw new Error('The campaign settings could not be read.');
  }

  return data.data;
};

export const updatePeerToPeerSettings = async (
  campaignUniqueId: string,
  settings: PeerToPeerSettings,
): Promise<void> => {
  const { data } = await HttpClient.post<PeerToPeerUpdateResponse>(
    settingsUrl(campaignUniqueId),
    settings,
  );

  if (!data?.success) {
    throw new Error(data?.message ?? 'The settings could not be saved.');
  }
};
