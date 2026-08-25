import { Box, Stack, Text } from '@chakra-ui/react';
import { ModerationHistoryEntry } from 'app/interface/donationInter/peerToPeerModerationDto';
import { HISTORY_EMPTY, HISTORY_HEADING, historyLine } from './moderationCopy';

interface ModerationHistoryPanelProps {
  history: ModerationHistoryEntry[];
}

const formatWhen = (isoUtc: string) => {
  const when = new Date(isoUtc);

  return Number.isNaN(when.getTime())
    ? ''
    : when.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
};

/**
 * Who did what, when, and to whom - the answer a charity has to be able to give when somebody asks why
 * their page came down. Read-only: nothing on this screen can edit or remove an entry.
 */
export const ModerationHistoryPanel = ({ history }: ModerationHistoryPanelProps) => (
  <Stack
    gap={3}
    p={{ base: 4, md: 5 }}
    borderWidth="1px"
    borderColor="secondaryGray.200"
    borderRadius="16px"
    bg="white"
    _dark={{ bg: 'navy.700', borderColor: 'whiteAlpha.300' }}
  >
    <Text fontSize={{ base: 'md', md: 'lg' }} fontWeight="700">
      {HISTORY_HEADING}
    </Text>

    {history.length === 0 ? (
      <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }}>
        {HISTORY_EMPTY}
      </Text>
    ) : (
      <Stack as="ol" gap={3} listStyleType="none" m={0} p={0}>
        {history.map((entry) => (
          <Box
            as="li"
            key={entry.uniqueId}
            borderLeftWidth="3px"
            borderColor="secondaryGray.300"
            pl={3}
          >
            <Text fontSize="sm" fontWeight="600">
              {historyLine(entry.action, entry.actedByName, entry.subjectName)}
            </Text>
            <Text fontSize="xs" color="gray.600" _dark={{ color: 'gray.300' }}>
              {formatWhen(entry.actedOnUtc)}
            </Text>
            {entry.reason && (
              <Text fontSize="sm" mt={1}>
                {entry.reason}
              </Text>
            )}
          </Box>
        ))}
      </Stack>
    )}
  </Stack>
);

export default ModerationHistoryPanel;
