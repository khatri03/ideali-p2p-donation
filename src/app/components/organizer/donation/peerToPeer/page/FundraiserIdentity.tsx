import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Avatar, Box, Heading, Link, Stack, Text } from '@chakra-ui/react';
import { fundraiserPhotoUrl } from 'app/service/organizer/donation/fundraiserConsoleService';
import { byOrganizer, fundraisingForCampaign, fundraisingSince, initialsOf } from './pageCopy';

interface FundraiserIdentityProps {
  displayName: string;
  campaignName: string;
  /** The campaign a donor can open to see what they would be funding. */
  campaignUniqueId: string;
  organizerName: string;
  fundraisingSinceUtc: string;
  /** The supporter's own photo. Absent until they upload one, in which case initials stand in. */
  photoUniqueId?: string | null;
  /** The link to the team behind this person, when they are in one. Absent otherwise. */
  team?: ReactNode;
}

/**
 * The person first, then what their money is for, then who receipts it. A donor deciding here needs the
 * campaign the gift is ring-fenced to and the charity that will issue the receipt, so both are readable
 * text rather than decorative tags.
 */
export const FundraiserIdentity = ({
  displayName,
  campaignName,
  campaignUniqueId,
  organizerName,
  fundraisingSinceUtc,
  photoUniqueId,
  team,
}: FundraiserIdentityProps) => (
  <Box
    bg="white"
    _dark={{ bg: 'navy.700' }}
    borderRadius="16px"
    boxShadow="sm"
    p={{ base: 4, md: 6 }}
  >
    <Stack direction={{ base: 'column', '2sm': 'row' }} gap={4} align={{ '2sm': 'center' }}>
      <Avatar
        name={displayName}
        src={photoUniqueId ? fundraiserPhotoUrl(photoUniqueId) : undefined}
        getInitials={() => initialsOf(displayName)}
        size="xl"
        bg="brand.500"
        color="white"
      />

      <Stack gap={2} flex="1" minW={0}>
        <Heading
          as="h1"
          fontSize={{ base: 'xl', md: '2xl', lg: '3xl' }}
          color="navy.700"
          _dark={{ color: 'white' }}
        >
          {displayName}
        </Heading>

        <Text fontSize={{ base: 'sm', md: 'md' }} color="gray.700" _dark={{ color: 'gray.200' }}>
          {`${fundraisingForCampaign} `}
          <Link
            as={RouterLink}
            to={`/donate/${campaignUniqueId}`}
            color="brand.600"
            _dark={{ color: 'brand.300' }}
            fontWeight="semibold"
            textDecoration="underline"
            cursor="pointer"
          >
            {campaignName}
          </Link>
        </Text>

        <Text
          fontSize={{ base: 'sm', md: 'md' }}
          fontWeight="medium"
          color="gray.700"
          _dark={{ color: 'gray.200' }}
        >
          {byOrganizer(organizerName)}
        </Text>

        <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
          {fundraisingSince(fundraisingSinceUtc)}
        </Text>

        {team}
      </Stack>
    </Stack>
  </Box>
);

export default FundraiserIdentity;
