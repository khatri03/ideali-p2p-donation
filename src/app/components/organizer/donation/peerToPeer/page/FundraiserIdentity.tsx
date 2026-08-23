import { Avatar, Badge, Box, Heading, Stack, Text } from '@chakra-ui/react';
import { fundraiserPhotoUrl } from 'app/service/organizer/donation/fundraiserConsoleService';
import { fundraiserCountSummary, fundraisingSince, initialsOf } from './pageCopy';

interface FundraiserIdentityProps {
  displayName: string;
  campaignName: string;
  organizerName: string;
  fundraisingSinceUtc: string;
  campaignFundraiserCount: number;
  /** The supporter's own photo. Absent until they upload one, in which case initials stand in. */
  photoUniqueId?: string | null;
}

/**
 * The person first, the charity second. This is the whole point of a peer-to-peer page: a donor is
 * giving because they know the person, so the person's name leads and the campaign supports it.
 */
export const FundraiserIdentity = ({
  displayName,
  campaignName,
  organizerName,
  fundraisingSinceUtc,
  campaignFundraiserCount,
  photoUniqueId,
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

        <Text fontSize={{ base: 'sm', md: 'md' }} color="gray.600" _dark={{ color: 'gray.300' }}>
          {`${displayName} is fundraising for ${organizerName}`}
        </Text>

        <Stack direction="row" gap={2} flexWrap="wrap">
          <Badge colorScheme="purple" borderRadius="full" px={3} py={1} textTransform="none">
            {campaignName}
          </Badge>
          <Badge colorScheme="gray" borderRadius="full" px={3} py={1} textTransform="none">
            {fundraiserCountSummary(campaignFundraiserCount)}
          </Badge>
        </Stack>

        <Text fontSize="sm" color="gray.500" _dark={{ color: 'gray.400' }}>
          {fundraisingSince(fundraisingSinceUtc)}
        </Text>
      </Stack>
    </Stack>
  </Box>
);

export default FundraiserIdentity;
