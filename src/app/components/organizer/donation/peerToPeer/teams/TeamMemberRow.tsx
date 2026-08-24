import type { ReactNode } from 'react';
import { Avatar, Badge, Button, Stack, Text } from '@chakra-ui/react';
import { CampaignTeamMember } from 'app/interface/donationInter/campaignTeamDto';
import { fundraiserPhotoUrl } from 'app/service/organizer/donation/fundraiserConsoleService';
import { initialsOf } from '../page/pageCopy';
import { formatMoney } from '../page/money';
import { CAPTAIN_BADGE, VIEW_MEMBER_PAGE, raisedByMember } from './teamCopy';

interface TeamMemberRowProps {
  member: CampaignTeamMember;
  currencySymbol: string;
  onViewPage: () => void;
  /** The captain screen passes its own actions here; the public page passes none. */
  actions?: ReactNode;
}

/**
 * One member, their own total, and the way to their page. The same row serves the public team page and
 * the captain screen, so a member is described identically wherever they appear.
 */
export const TeamMemberRow = ({
  member,
  currencySymbol,
  onViewPage,
  actions,
}: TeamMemberRowProps) => (
  <Stack
    direction={{ base: 'column', md: 'row' }}
    gap={{ base: 3, md: 4 }}
    align={{ md: 'center' }}
    py={4}
    borderBottomWidth="1px"
    borderColor="gray.100"
    _dark={{ borderColor: 'whiteAlpha.200' }}
    _last={{ borderBottomWidth: 0, pb: 0 }}
  >
    <Stack direction="row" gap={4} align="center" flex="1" minW={0}>
      <Avatar
        name={member.displayName}
        src={member.photoUniqueId ? fundraiserPhotoUrl(member.photoUniqueId) : undefined}
        getInitials={() => initialsOf(member.displayName)}
        size="md"
        bg="brand.500"
        color="white"
      />

      <Stack gap={1} minW={0}>
        <Stack direction="row" gap={2} align="center" flexWrap="wrap">
          <Text
            fontWeight="600"
            color="navy.700"
            _dark={{ color: 'white' }}
            fontSize={{ base: 'sm', md: 'md' }}
            noOfLines={1}
          >
            {member.displayName}
          </Text>

          {member.isCaptain && (
            <Badge colorScheme="purple" borderRadius="full" px={2} textTransform="none">
              {CAPTAIN_BADGE}
            </Badge>
          )}
        </Stack>

        <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }}>
          {raisedByMember(formatMoney(member.raisedAmount, currencySymbol))}
        </Text>
      </Stack>
    </Stack>

    <Stack direction={{ base: 'column', '2sm': 'row' }} gap={2} w={{ base: 'full', md: 'auto' }}>
      <Button
        onClick={onViewPage}
        variant="outline"
        colorScheme="brand"
        size="sm"
        minH="44px"
        borderRadius="12px"
        cursor="pointer"
        w={{ base: 'full', '2sm': 'auto' }}
        aria-label={`${VIEW_MEMBER_PAGE} for ${member.displayName}`}
      >
        {VIEW_MEMBER_PAGE}
      </Button>

      {actions}
    </Stack>
  </Stack>
);

export default TeamMemberRow;
