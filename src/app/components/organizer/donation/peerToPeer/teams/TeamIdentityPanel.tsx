import { Link as RouterLink } from 'react-router-dom';
import { Badge, Box, Button, Heading, Link, Stack, Text } from '@chakra-ui/react';
import { MdGroups } from 'react-icons/md';
import { CampaignTeamPage } from 'app/interface/donationInter/campaignTeamDto';
import FundraiserAvatar from '../page/FundraiserAvatar';
import { byOrganizer } from '../page/pageCopy';
import {
  ALL_TEAMS_LINK,
  CAMPAIGN_FINISHED_BADGE,
  CAPTAIN_BADGE,
  LEAVE_LABEL,
  MANAGE_TEAM,
  TEAM_FUNDRAISING_FOR,
  TEAM_STORY_HEADING,
  membersCount,
} from './teamCopy';
import { browseTeamsPath } from './teamPaths';

interface TeamIdentityPanelProps {
  team: CampaignTeamPage;
  /** Only the captain is offered management, and only a member is offered a way out. */
  onManage?: () => void;
  onLeave?: () => void;
}

/**
 * The team first, then the campaign the gifts are ring-fenced to, then the charity that receipts them.
 * Reads the same way as a member's own page so the two surfaces never say it differently.
 *
 * The mark is a group rather than a photo because a team has none to upload, and the way out to the
 * other teams lives here because a shared team address is often the only one somebody was given.
 */
export const TeamIdentityPanel = ({ team, onManage, onLeave }: TeamIdentityPanelProps) => {
  const captain = team.members.find((member) => member.isCaptain);

  return (
    <Box
      bg="white"
      _dark={{ bg: 'navy.700' }}
      borderRadius="16px"
      boxShadow="sm"
      p={{ base: 4, md: 6 }}
    >
      <Stack gap={4}>
        <Stack direction={{ base: 'column', '2sm': 'row' }} gap={4} align={{ '2sm': 'flex-start' }}>
          <FundraiserAvatar displayName={team.name} photoUrl={null} icon={MdGroups} />

          <Stack gap={2} flex="1" minW={0}>
            <Heading
              as="h1"
              fontSize={{ base: 'xl', md: '2xl', lg: '3xl' }}
              color="navy.700"
              _dark={{ color: 'white' }}
              wordBreak="break-word"
            >
              {team.name}
            </Heading>

            <Text fontSize={{ base: 'sm', md: 'md' }} color="gray.700" _dark={{ color: 'gray.200' }}>
              {`${TEAM_FUNDRAISING_FOR} `}
              <Link
                as={RouterLink}
                to={`/donate/${team.campaignUniqueId}`}
                color="brand.600"
                _dark={{ color: 'brand.300' }}
                fontWeight="semibold"
                textDecoration="underline"
                cursor="pointer"
              >
                {team.campaignName}
              </Link>
            </Text>

            <Text
              fontSize={{ base: 'sm', md: 'md' }}
              fontWeight="medium"
              color="gray.700"
              _dark={{ color: 'gray.200' }}
            >
              {byOrganizer(team.organizerName)}
            </Text>

            <Stack direction="row" gap={2} flexWrap="wrap">
              <Badge colorScheme="gray" borderRadius="full" px={3} py={1} textTransform="none">
                {membersCount(team.members.length)}
              </Badge>

              {captain && (
                <Badge colorScheme="gray" borderRadius="full" px={3} py={1} textTransform="none">
                  {`${CAPTAIN_BADGE}: ${captain.displayName}`}
                </Badge>
              )}

              {!team.isCampaignOpen && (
                <Badge colorScheme="orange" borderRadius="full" px={3} py={1} textTransform="none">
                  {CAMPAIGN_FINISHED_BADGE}
                </Badge>
              )}
            </Stack>

            <Link
              as={RouterLink}
              to={browseTeamsPath(team.campaignSlug)}
              fontSize="sm"
              color="brand.600"
              _dark={{ color: 'brand.300' }}
              fontWeight="semibold"
              textDecoration="underline"
              cursor="pointer"
              alignSelf="flex-start"
              display="inline-flex"
              alignItems="center"
              minH="44px"
            >
              {ALL_TEAMS_LINK}
            </Link>
          </Stack>
        </Stack>

        {team.story && (
          <Stack gap={2}>
            <Heading
              as="h2"
              fontSize={{ base: 'md', md: 'lg' }}
              color="navy.700"
              _dark={{ color: 'white' }}
            >
              {TEAM_STORY_HEADING}
            </Heading>
            <Text
              fontSize={{ base: 'sm', md: 'md' }}
              color="gray.700"
              _dark={{ color: 'gray.200' }}
              whiteSpace="pre-wrap"
            >
              {team.story}
            </Text>
          </Stack>
        )}

        {(onManage || onLeave) && (
          <Stack direction={{ base: 'column', '2sm': 'row' }} gap={3}>
            {onManage && (
              <Button
                onClick={onManage}
                colorScheme="brand"
                variant="outline"
                minH="44px"
                borderRadius="12px"
                cursor="pointer"
                w={{ base: 'full', '2sm': 'auto' }}
              >
                {MANAGE_TEAM}
              </Button>
            )}

            {onLeave && (
              <Button
                onClick={onLeave}
                colorScheme="red"
                variant="outline"
                minH="44px"
                borderRadius="12px"
                cursor="pointer"
                w={{ base: 'full', '2sm': 'auto' }}
              >
                {LEAVE_LABEL}
              </Button>
            )}
          </Stack>
        )}
      </Stack>
    </Box>
  );
};

export default TeamIdentityPanel;
