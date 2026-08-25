import { describe, expect, it } from 'vitest';
import { buildLeaderboardFundraiser, buildLeaderboardTeam } from '../peerToPeerTestFactory';
import { toFundraiserStandings, toTeamStandings } from './standings';

describe('standings', () => {
  it('Fundraisers_MappedForTheBoard_KeepThePlaceTheApiDecided', () => {
    const [row] = toFundraiserStandings('winter-appeal', [
      buildLeaderboardFundraiser({ rank: 4 }),
    ]);

    expect(row.rank).toBe(4);
    expect(row.name).toBe('Sarah Khan');
    expect(row.href).toBe('/campaigns/winter-appeal/sarah-khan');
  });

  it('Fundraisers_InNoTeam_ReadAsFundraisingOnTheirOwnRatherThanAsAGap', () => {
    const [row] = toFundraiserStandings('winter-appeal', [
      buildLeaderboardFundraiser({ teamName: null }),
    ]);

    expect(row.detail).toBe('On their own');
  });

  it('Fundraisers_CountShown_IsTheirDonorsRatherThanAnythingElse', () => {
    const [row] = toFundraiserStandings('winter-appeal', [
      buildLeaderboardFundraiser({ donorCount: 11 }),
    ]);

    expect(row.count).toBe(11);
    expect(row.countLabel).toBe('Donors');
  });

  it('Teams_MappedForTheBoard_PointAtTheTeamAddressAndCountMembers', () => {
    const [row] = toTeamStandings('winter-appeal', [buildLeaderboardTeam({ memberCount: 5 })]);

    expect(row.href).toBe('/campaigns/winter-appeal/teams/the-early-risers');
    expect(row.count).toBe(5);
    expect(row.countLabel).toBe('Members');
  });

  it('Teams_CarryNoSecondFact_SoNoDetailIsInvented', () => {
    const [row] = toTeamStandings('winter-appeal', [buildLeaderboardTeam()]);

    expect(row.detail).toBeNull();
  });

  it('Standings_NothingToRank_MapToAnEmptyBoardRatherThanThrowing', () => {
    expect(toFundraiserStandings('winter-appeal', [])).toEqual([]);
    expect(toTeamStandings('winter-appeal', [])).toEqual([]);
  });
});
