/** The public address of the standings, mirroring the backend route minus /api. */
export const leaderboardPath = (campaignSlug: string) => `/campaigns/${campaignSlug}/leaderboard`;
