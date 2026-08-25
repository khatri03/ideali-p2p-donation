import HttpClient from '../../httpClient/HttpClient';
import {
  PeerToPeerLeaderboard,
  PeerToPeerLeaderboardResponse,
} from 'app/interface/donationInter/peerToPeerLeaderboardDto';

/**
 * Mirrors the public address a reader sees, minus the /api prefix. The slug reaches this function from
 * the URL bar, so it is caller input and is encoded.
 */
const leaderboardUrl = (campaignSlug: string) =>
  `/api/campaigns/${encodeURIComponent(campaignSlug)}/leaderboard`;

/**
 * Reads a campaign's standings. Anonymous for a published board; a board the charity keeps to itself is
 * served by the same call to the charity's own signed-in session and refused to everyone else.
 *
 * The API answers "not found" identically for an unknown campaign, one that never switched supporter
 * fundraising on and a board the charity has hidden. That single sentence is passed through unchanged
 * rather than expanded into a guess.
 */
export const getLeaderboard = async (campaignSlug: string): Promise<PeerToPeerLeaderboard> => {
  const { data } = await HttpClient.get<PeerToPeerLeaderboardResponse>(leaderboardUrl(campaignSlug));

  if (!data?.success || !data.data) {
    throw new Error(data?.message ?? 'Leaderboard not found.');
  }

  return data.data;
};
