import { Avatar, Box, Flex, Heading, Stack, Text } from '@chakra-ui/react';
import { FundraiserPageSupporter } from 'app/interface/donationInter/fundraiserPageDto';
import { formatMoney } from './money';
import {
  SUPPORTERS_EMPTY_GUIDANCE,
  SUPPORTERS_EMPTY_HEADING,
  SUPPORTERS_HEADING,
  initialsOf,
} from './pageCopy';

interface RecentSupportersPanelProps {
  supporters: FundraiserPageSupporter[];
  currencySymbol: string;
  /**
   * Where this panel sits in the page outline. A panel nested inside a card that already carries a
   * heading is an h3, so the outline a screen reader announces matches what the eye sees.
   */
  headingLevel?: 'h2' | 'h3';
  /** Flattens the panel for use inside a card, which already carries the surface and the shadow. */
  isNested?: boolean;
}

const formatGivenOn = (isoDate: string): string => {
  const given = new Date(isoDate);

  return Number.isNaN(given.getTime())
    ? ''
    : given.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

/**
 * The wall of recent gifts. A donor who asked to stay anonymous arrives from the API already reduced
 * to the word "Anonymous", so there is no name here for this component to hide.
 */
export const RecentSupportersPanel = ({
  supporters,
  currencySymbol,
  headingLevel = 'h2',
  isNested = false,
}: RecentSupportersPanelProps) => (
  <Box
    bg={isNested ? 'secondaryGray.300' : 'white'}
    _dark={{ bg: isNested ? 'whiteAlpha.100' : 'navy.700' }}
    borderRadius={isNested ? '14px' : '16px'}
    boxShadow={isNested ? 'none' : 'sm'}
    p={isNested ? 4 : { base: 4, md: 6 }}
  >
    <Heading
      as={headingLevel}
      fontSize={{ base: 'sm', md: 'md' }}
      mb={4}
      color="navy.700"
      _dark={{ color: 'white' }}
    >
      {SUPPORTERS_HEADING}
    </Heading>

    {supporters.length === 0 ? (
      <Stack gap={1} py={2}>
        <Text fontWeight="600" color="navy.700" _dark={{ color: 'white' }}>
          {SUPPORTERS_EMPTY_HEADING}
        </Text>
        <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }}>
          {SUPPORTERS_EMPTY_GUIDANCE}
        </Text>
      </Stack>
    ) : (
      <Stack as="ul" gap={4} listStyleType="none" m={0} p={0}>
        {supporters.map((supporter, index) => (
          <Flex
            as="li"
            key={`${supporter.givenOnUtc}-${index}`}
            align="center"
            gap={3}
            minW={0}
          >
            <Avatar
              name={supporter.donorName}
              getInitials={() => initialsOf(supporter.donorName)}
              size="sm"
              bg="gray.200"
              color="gray.700"
            />

            <Stack gap={0} flex="1" minW={0}>
              <Text
                fontSize={{ base: 'sm', md: 'md' }}
                fontWeight="600"
                color="navy.700"
                _dark={{ color: 'white' }}
                noOfLines={1}
              >
                {supporter.donorName}
              </Text>
              <Text fontSize="xs" color="gray.600" _dark={{ color: 'gray.400' }}>
                {formatGivenOn(supporter.givenOnUtc)}
              </Text>
            </Stack>

            <Text
              fontSize={{ base: 'sm', md: 'md' }}
              fontWeight="700"
              color="brand.500"
              whiteSpace="nowrap"
            >
              {formatMoney(supporter.amount, currencySymbol)}
            </Text>
          </Flex>
        ))}
      </Stack>
    )}
  </Box>
);

export default RecentSupportersPanel;
