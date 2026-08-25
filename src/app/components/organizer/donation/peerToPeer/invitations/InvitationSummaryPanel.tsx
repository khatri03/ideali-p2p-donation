import { SimpleGrid, Stack, Text } from '@chakra-ui/react';
import { InvitationSummary } from 'app/interface/donationInter/fundraiserInvitationDto';
import {
  SUMMARY_ACCEPTED,
  SUMMARY_EXPIRED,
  SUMMARY_OPENED,
  SUMMARY_SENT,
  SUMMARY_SUPPRESSED,
} from './invitationCopy';

interface InvitationSummaryPanelProps {
  summary: InvitationSummary;
}

interface CountProps {
  label: string;
  value: number;
}

const Count = ({ label, value }: CountProps) => (
  <Stack
    gap={1}
    borderWidth="1px"
    borderColor="secondaryGray.300"
    borderRadius="12px"
    px={4}
    py={3}
  >
    <Text fontSize="xs" color="gray.600" _dark={{ color: 'gray.300' }} textTransform="uppercase">
      {label}
    </Text>
    <Text fontSize={{ base: 'lg', md: 'xl' }} fontWeight="700">
      {value}
    </Text>
  </Stack>
);

/** Where every invitation on this campaign stands, so following up does not need guesswork. */
export const InvitationSummaryPanel = ({ summary }: InvitationSummaryPanelProps) => (
  <SimpleGrid columns={{ base: 2, md: 3, xl: 5 }} gap={3}>
    <Count label={SUMMARY_SENT} value={summary.sent} />
    <Count label={SUMMARY_OPENED} value={summary.opened} />
    <Count label={SUMMARY_ACCEPTED} value={summary.accepted} />
    <Count label={SUMMARY_EXPIRED} value={summary.expired} />
    <Count label={SUMMARY_SUPPRESSED} value={summary.suppressed} />
  </SimpleGrid>
);

export default InvitationSummaryPanel;
