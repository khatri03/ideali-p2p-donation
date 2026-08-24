import { SimpleGrid } from '@chakra-ui/react';
import { CampaignTeamBrowse, CampaignTeamSummary } from 'app/interface/donationInter/campaignTeamDto';
import FundraiserPageNotice from '../page/FundraiserPageNotice';
import TeamCard from './TeamCard';
import TeamsEmptyState from './TeamsEmptyState';
import {
  NOT_FUNDRAISER_GUIDANCE,
  SEARCH_CLEAR,
  SEARCH_NO_MATCH_GUIDANCE,
  SEARCH_NO_MATCH_HEADING,
  teamsOffGuidance,
} from './teamCopy';

interface TeamResultsProps {
  browse: CampaignTeamBrowse;
  search: string;
  canJoin: boolean;
  onClearSearch: () => void;
  onStartTeam: () => void;
  onOpenTeam: (team: CampaignTeamSummary) => void;
  onJoinTeam: (team: CampaignTeamSummary) => void;
}

/** The list of teams, and the two designed screens that stand in for it when there is nothing to list. */
export const TeamResults = ({
  browse,
  search,
  canJoin,
  onClearSearch,
  onStartTeam,
  onOpenTeam,
  onJoinTeam,
}: TeamResultsProps) => {
  if (browse.teams.length === 0 && search.trim()) {
    return (
      <FundraiserPageNotice
        heading={SEARCH_NO_MATCH_HEADING}
        message={SEARCH_NO_MATCH_GUIDANCE}
        onRetry={onClearSearch}
        retryLabel={SEARCH_CLEAR}
      />
    );
  }

  if (browse.teams.length === 0) {
    return (
      <TeamsEmptyState
        onStartTeam={canJoin ? onStartTeam : undefined}
        note={
          browse.areTeamsAllowed ? NOT_FUNDRAISER_GUIDANCE : teamsOffGuidance(browse.organizerName)
        }
      />
    );
  }

  return (
    <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap={{ base: 4, md: 6 }}>
      {browse.teams.map((team) => (
        <TeamCard
          key={team.uniqueId}
          team={team}
          currencySymbol={browse.currencySymbol}
          onOpen={() => onOpenTeam(team)}
          onJoin={canJoin ? () => onJoinTeam(team) : undefined}
        />
      ))}
    </SimpleGrid>
  );
};

export default TeamResults;
