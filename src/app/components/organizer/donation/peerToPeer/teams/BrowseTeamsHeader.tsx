import { Button, Heading, Stack, Text } from '@chakra-ui/react';
import { CampaignTeamBrowse } from 'app/interface/donationInter/campaignTeamDto';
import TeamSearchField from './TeamSearchField';
import { BROWSE_HEADING, GO_TO_MY_TEAM, START_A_TEAM, browseSubheading } from './teamCopy';

interface BrowseTeamsHeaderProps {
  browse: CampaignTeamBrowse;
  search: string;
  isSearching: boolean;
  onSearchChange: (value: string) => void;
  onStartTeam: () => void;
  onGoToMyTeam: () => void;
}

/**
 * The title, the search, and the one action that fits this caller: the team they are already in takes
 * precedence over starting another, and neither is offered to somebody who cannot do it.
 */
export const BrowseTeamsHeader = ({
  browse,
  search,
  isSearching,
  onSearchChange,
  onStartTeam,
  onGoToMyTeam,
}: BrowseTeamsHeaderProps) => {
  const canStartTeam = browse.areTeamsAllowed && browse.isFundraiser && !browse.myTeamSlug;

  return (
    <Stack gap={{ base: 4, md: 5 }}>
      <Stack
        direction={{ base: 'column', md: 'row' }}
        gap={4}
        justify="space-between"
        align={{ md: 'flex-start' }}
      >
        <Stack gap={1} minW={0}>
          <Heading
            as="h1"
            fontSize={{ base: 'xl', md: '2xl', lg: '3xl' }}
            color="navy.700"
            _dark={{ color: 'white' }}
          >
            {BROWSE_HEADING}
          </Heading>
          <Text fontSize={{ base: 'sm', md: 'md' }} color="gray.600" _dark={{ color: 'gray.300' }}>
            {browseSubheading(browse.campaignName)}
          </Text>
        </Stack>

        {browse.myTeamSlug && (
          <Button
            onClick={onGoToMyTeam}
            colorScheme="brand"
            variant="outline"
            minH="44px"
            borderRadius="12px"
            cursor="pointer"
            w={{ base: 'full', md: 'auto' }}
          >
            {GO_TO_MY_TEAM}
          </Button>
        )}

        {canStartTeam && (
          <Button
            onClick={onStartTeam}
            colorScheme="brand"
            minH="44px"
            borderRadius="12px"
            cursor="pointer"
            w={{ base: 'full', md: 'auto' }}
          >
            {START_A_TEAM}
          </Button>
        )}
      </Stack>

      <TeamSearchField value={search} isSearching={isSearching} onChange={onSearchChange} />
    </Stack>
  );
};

export default BrowseTeamsHeader;
