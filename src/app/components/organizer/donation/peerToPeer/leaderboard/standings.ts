import {
  LeaderboardFundraiser,
  LeaderboardTeam,
} from 'app/interface/donationInter/peerToPeerLeaderboardDto';
import { fundraiserPagePath } from '../page/FundraiserPage';
import { teamPagePath } from '../teams/teamPaths';
import type { Standing } from './StandingsBoard';
import {
  DONORS_COLUMN,
  MEMBERS_COLUMN,
  NO_TEAM,
  TEAM_COLUMN,
  VIEW_PAGE_LABEL,
  VIEW_TEAM_LABEL,
} from './leaderboardCopy';

/**
 * The two shapes the API sends, reduced to the one shape the board renders. Written as plain functions
 * rather than inside the screen so the mapping is testable without mounting anything.
 */
export const toFundraiserStandings = (
  campaignSlug: string,
  fundraisers: LeaderboardFundraiser[],
): Standing[] =>
  fundraisers.map((fundraiser) => ({
    key: fundraiser.slug,
    rank: fundraiser.rank,
    name: fundraiser.displayName,
    raisedAmount: fundraiser.raisedAmount,
    goal: fundraiser.goal,
    count: fundraiser.donorCount,
    countLabel: DONORS_COLUMN,
    detail: fundraiser.teamName ?? NO_TEAM,
    detailLabel: TEAM_COLUMN,
    href: fundraiserPagePath(campaignSlug, fundraiser.slug),
    linkLabel: VIEW_PAGE_LABEL,
  }));

export const toTeamStandings = (campaignSlug: string, teams: LeaderboardTeam[]): Standing[] =>
  teams.map((team) => ({
    key: team.slug,
    rank: team.rank,
    name: team.name,
    raisedAmount: team.raisedAmount,
    goal: team.teamGoal,
    count: team.memberCount,
    countLabel: MEMBERS_COLUMN,
    detail: null,
    detailLabel: TEAM_COLUMN,
    href: teamPagePath(campaignSlug, team.slug),
    linkLabel: VIEW_TEAM_LABEL,
  }));
