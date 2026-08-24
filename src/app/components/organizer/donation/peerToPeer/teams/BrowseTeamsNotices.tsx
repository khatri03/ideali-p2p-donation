import { Alert, AlertDescription, AlertIcon, Button } from '@chakra-ui/react';
import { CampaignTeamBrowse } from 'app/interface/donationInter/campaignTeamDto';
import {
  NOT_FUNDRAISER_GUIDANCE,
  SET_UP_MY_PAGE,
  TEAMS_OFF_HEADING,
  teamsOffGuidance,
} from './teamCopy';

interface BrowseTeamsNoticesProps {
  browse: CampaignTeamBrowse;
  onSetUpMyPage: () => void;
}

/** The two reasons a person cannot act on the browse screen, each said once and each with a way forward. */
export const BrowseTeamsNotices = ({ browse, onSetUpMyPage }: BrowseTeamsNoticesProps) => (
  <>
    {!browse.areTeamsAllowed && (
      <Alert status="info" borderRadius="12px" alignItems="flex-start">
        <AlertIcon />
        <AlertDescription fontSize={{ base: 'sm', md: 'md' }}>
          {`${TEAMS_OFF_HEADING}. ${teamsOffGuidance(browse.organizerName)}`}
        </AlertDescription>
      </Alert>
    )}

    {browse.areTeamsAllowed && !browse.isFundraiser && (
      <Alert status="info" borderRadius="12px" alignItems="flex-start" flexWrap="wrap" gap={3}>
        <AlertIcon />
        <AlertDescription fontSize={{ base: 'sm', md: 'md' }} flex="1" minW="200px">
          {NOT_FUNDRAISER_GUIDANCE}
        </AlertDescription>
        <Button
          onClick={onSetUpMyPage}
          colorScheme="brand"
          size="sm"
          minH="44px"
          borderRadius="12px"
          cursor="pointer"
          w={{ base: 'full', md: 'auto' }}
        >
          {SET_UP_MY_PAGE}
        </Button>
      </Alert>
    )}
  </>
);

export default BrowseTeamsNotices;
