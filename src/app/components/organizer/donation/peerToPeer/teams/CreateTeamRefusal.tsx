import { Button } from '@chakra-ui/react';
import { CampaignTeamBrowse } from 'app/interface/donationInter/campaignTeamDto';
import FundraiserPageNotice from '../page/FundraiserPageNotice';
import {
  ALREADY_IN_A_TEAM,
  ALREADY_IN_A_TEAM_GUIDANCE,
  GO_TO_MY_TEAM,
  NOT_FUNDRAISER_GUIDANCE,
  NOT_FUNDRAISER_HEADING,
  RETRY_LABEL,
  SET_UP_MY_PAGE,
  TEAMS_OFF_HEADING,
  teamsOffGuidance,
} from './teamCopy';
import { browseTeamsPath, teamPagePath } from './teamPaths';

interface CreateTeamRefusalReason {
  heading: string;
  message: string;
  actionLabel: string;
  actionPath: string;
}

/**
 * The three reasons the server would refuse a new team, said on the screen before anything is sent.
 * Presentation only: the server refuses each of them again on the way in.
 */
export const createTeamRefusal = (browse: CampaignTeamBrowse): CreateTeamRefusalReason | null => {
  if (!browse.areTeamsAllowed) {
    return {
      heading: TEAMS_OFF_HEADING,
      message: teamsOffGuidance(browse.organizerName),
      actionLabel: RETRY_LABEL,
      actionPath: browseTeamsPath(browse.campaignSlug),
    };
  }

  if (!browse.isFundraiser) {
    return {
      heading: NOT_FUNDRAISER_HEADING,
      message: NOT_FUNDRAISER_GUIDANCE,
      actionLabel: SET_UP_MY_PAGE,
      actionPath: `/donation/campaign/${browse.campaignUniqueId}/peer-to-peer/join`,
    };
  }

  if (browse.myTeamSlug) {
    return {
      heading: ALREADY_IN_A_TEAM,
      message: ALREADY_IN_A_TEAM_GUIDANCE,
      actionLabel: GO_TO_MY_TEAM,
      actionPath: teamPagePath(browse.campaignSlug, browse.myTeamSlug),
    };
  }

  return null;
};

interface CreateTeamRefusalProps {
  reason: CreateTeamRefusalReason;
  onAct: (path: string) => void;
}

export const CreateTeamRefusal = ({ reason, onAct }: CreateTeamRefusalProps) => (
  <FundraiserPageNotice
    heading={reason.heading}
    message={reason.message}
    action={
      <Button
        onClick={() => onAct(reason.actionPath)}
        colorScheme="brand"
        minH="44px"
        borderRadius="12px"
        cursor="pointer"
        w={{ base: 'full', md: 'auto' }}
      >
        {reason.actionLabel}
      </Button>
    }
  />
);

export default CreateTeamRefusal;
