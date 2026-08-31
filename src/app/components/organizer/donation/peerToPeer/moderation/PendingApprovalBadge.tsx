import { Badge, Box, HStack, Text, Tooltip } from '@chakra-ui/react';
import { MdWarningAmber } from 'react-icons/md';
import { Link as RouterLink } from 'react-router-dom';
import { pendingApprovalBadgeHint, pendingApprovalBadgeLabel } from './moderationCopy';
import { pendingFundraisersPath } from './moderationPaths';

interface PendingApprovalBadgeProps {
  campaignUniqueId: string;
  /** How many of this campaign's fundraising pages are waiting on a decision. */
  pendingCount: number;
}

/**
 * Tells a charity, on the screen it already opens every day, that a supporter is waiting on it. Without
 * this the only way to learn a page needs approving is to open the campaign's peer-to-peer screens and
 * look, which is exactly what somebody who does not know there is anything to see will never do.
 *
 * It is one line of text rather than a sentence so every campaign card stays the same height, and it
 * carries its own wording rather than leaving the meaning to the tooltip, which a phone cannot show.
 * The spoken name opens with the same words the pill shows before it goes on to the full sentence, so
 * somebody speaking the label aloud to a voice control names the control that is actually there.
 * The pill stays small while the area that responds to a finger is the full 44px, so a dense card is
 * not made taller by a control that is easy to hit.
 */
export const PendingApprovalBadge = ({
  campaignUniqueId,
  pendingCount,
}: PendingApprovalBadgeProps) => {
  if (!campaignUniqueId || pendingCount <= 0) {
    return null;
  }

  const label = pendingApprovalBadgeLabel(pendingCount);
  const hint = pendingApprovalBadgeHint(pendingCount);

  return (
    <Tooltip label={hint} hasArrow openDelay={300}>
      <Box
        as={RouterLink}
        to={pendingFundraisersPath(campaignUniqueId)}
        aria-label={`${label}. ${hint}`}
        display="inline-flex"
        alignItems="center"
        minH="44px"
        maxW="100%"
        minW={0}
        sx={{ cursor: 'pointer' }}
      >
        <Badge
          display="inline-flex"
          alignItems="center"
          colorScheme="orange"
          variant="subtle"
          borderRadius="full"
          px={2}
          py={0.5}
          fontSize="11px"
          fontWeight="medium"
          textTransform="none"
          whiteSpace="nowrap"
          maxW="100%"
          minW={0}
        >
          <HStack spacing={1} minW={0}>
            <Box as={MdWarningAmber} aria-hidden flexShrink={0} />
            <Text as="span" noOfLines={1}>
              {label}
            </Text>
          </HStack>
        </Badge>
      </Box>
    </Tooltip>
  );
};

export default PendingApprovalBadge;
