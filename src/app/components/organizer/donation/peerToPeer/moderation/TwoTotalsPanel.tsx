import { Box, SimpleGrid, Stack, Text } from '@chakra-ui/react';
import { PeerToPeerCampaignTotals } from 'app/interface/donationInter/peerToPeerModerationDto';
import { formatMoney } from '../page/money';
import {
  AWAITING_APPROVAL_LABEL,
  FUNDRAISER_COUNT_LABEL,
  RAISED_IN_TOTAL_LABEL,
  RAISED_IN_TOTAL_NOTE,
  RAISED_THROUGH_FUNDRAISERS_LABEL,
  RAISED_THROUGH_FUNDRAISERS_NOTE,
  TEAM_COUNT_LABEL,
} from './moderationCopy';

interface TwoTotalsPanelProps {
  totals: PeerToPeerCampaignTotals;
}

interface FigureProps {
  label: string;
  value: string;
  note?: string;
}

const Figure = ({ label, value, note }: FigureProps) => (
  <Stack
    gap={1}
    p={{ base: 4, md: 5 }}
    borderWidth="1px"
    borderColor="secondaryGray.200"
    borderRadius="16px"
    bg="white"
    _dark={{ bg: 'navy.700', borderColor: 'whiteAlpha.300' }}
    minW={0}
  >
    <Text fontSize={{ base: 'xs', md: 'sm' }} color="gray.600" _dark={{ color: 'gray.300' }} fontWeight="600">
      {label}
    </Text>
    <Text
      fontSize={{ base: 'xl', md: '2xl' }}
      fontWeight="700"
      color="secondaryGray.900"
      _dark={{ color: 'white' }}
    >
      {value}
    </Text>
    {note && (
      <Text fontSize="xs" color="gray.600" _dark={{ color: 'gray.300' }}>
        {note}
      </Text>
    )}
  </Stack>
);

/**
 * The two money figures, always side by side and never abbreviated to one. Each carries its own
 * definition, because "raised" meaning two different things on two screens is the failure this panel
 * exists to prevent.
 */
export const TwoTotalsPanel = ({ totals }: TwoTotalsPanelProps) => (
  <Box>
    <SimpleGrid columns={{ base: 1, '2sm': 2 }} gap={{ base: 3, md: 4 }}>
      <Figure
        label={RAISED_THROUGH_FUNDRAISERS_LABEL}
        value={formatMoney(totals.raisedThroughFundraisers, totals.currencySymbol)}
        note={RAISED_THROUGH_FUNDRAISERS_NOTE}
      />
      <Figure
        label={RAISED_IN_TOTAL_LABEL}
        value={formatMoney(totals.raisedInTotal, totals.currencySymbol)}
        note={RAISED_IN_TOTAL_NOTE}
      />
    </SimpleGrid>
    <SimpleGrid columns={{ base: 1, '2sm': 3 }} gap={{ base: 3, md: 4 }} mt={{ base: 3, md: 4 }}>
      <Figure label={FUNDRAISER_COUNT_LABEL} value={String(totals.fundraiserCount)} />
      <Figure label={AWAITING_APPROVAL_LABEL} value={String(totals.awaitingApprovalCount)} />
      <Figure label={TEAM_COUNT_LABEL} value={String(totals.teamCount)} />
    </SimpleGrid>
  </Box>
);

export default TwoTotalsPanel;
