import { Link as RouterLink } from 'react-router-dom';
import { Avatar, Box, Container, Flex, Link, Stack, Text } from '@chakra-ui/react';
import { BACK_TO_FUNDRAISER_PAGE, initialsOf, supportingBanner } from './pageCopy';

interface SupportingFundraiserBannerProps {
  displayName: string;
  campaignName: string;
  organizerName: string;
  pagePath: string;
}

/**
 * The only visible change to the existing donation screen: who the donor is giving through. It stays
 * on screen for the whole flow so nobody reaches the card step wondering whose page they are on.
 */
export const SupportingFundraiserBanner = ({
  displayName,
  campaignName,
  organizerName,
  pagePath,
}: SupportingFundraiserBannerProps) => (
  <Box bg="purple.50" _dark={{ bg: 'navy.800' }} borderBottom="1px solid" borderColor="purple.100">
    <Container maxW="1200px" py={3}>
      <Flex align="center" gap={3} wrap="wrap">
        <Avatar
          name={displayName}
          getInitials={() => initialsOf(displayName)}
          size="sm"
          bg="brand.500"
          color="white"
        />

        <Stack gap={0} flex="1" minW="200px">
          <Text
            fontSize={{ base: 'sm', md: 'md' }}
            fontWeight="700"
            color="navy.700"
            _dark={{ color: 'white' }}
          >
            {supportingBanner(displayName)}
          </Text>
          <Text fontSize="xs" color="gray.600" _dark={{ color: 'gray.300' }}>
            {`${campaignName} · ${organizerName}`}
          </Text>
        </Stack>

        <Link
          as={RouterLink}
          to={pagePath}
          fontSize="sm"
          fontWeight="600"
          color="brand.500"
          minH="44px"
          display="flex"
          alignItems="center"
          px={2}
        >
          {BACK_TO_FUNDRAISER_PAGE}
        </Link>
      </Flex>
    </Container>
  </Box>
);

export default SupportingFundraiserBanner;
