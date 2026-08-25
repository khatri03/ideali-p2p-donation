import { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Skeleton,
  Stack,
  Text,
} from '@chakra-ui/react';
import { SupporterCandidate } from 'app/interface/donationInter/fundraiserInvitationDto';
import { getSupporterCandidates } from 'app/service/organizer/donation/fundraiserInvitationService';
import { SUPPORTERS_LABEL, SUPPORTERS_SEARCH_PLACEHOLDER } from './invitationCopy';

interface SupporterPickerProps {
  campaignUniqueId: string;
  onPick: (emailAddress: string) => void;
}

const SEARCH_DEBOUNCE_MS = 300;

/**
 * People who have already given to this campaign. Someone already fundraising, or already invited, is
 * shown as such rather than hidden — the organiser is choosing who to ask, and needs to see both.
 */
export const SupporterPicker = ({ campaignUniqueId, onPick }: SupporterPickerProps) => {
  const [search, setSearch] = useState('');
  const [candidates, setCandidates] = useState<SupporterCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    const timer = setTimeout(() => {
      setIsLoading(true);

      getSupporterCandidates(campaignUniqueId, search.trim() || undefined)
        .then((next) => {
          if (isActive) {
            setCandidates(next);
            setError(null);
          }
        })
        .catch((failure: unknown) => {
          if (isActive) {
            setError(
              failure instanceof Error ? failure.message : 'Those supporters could not be read.',
            );
          }
        })
        .finally(() => {
          if (isActive) {
            setIsLoading(false);
          }
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [campaignUniqueId, search]);

  return (
    <Stack gap={3}>
      <FormControl>
        <FormLabel fontSize="sm" htmlFor="supporter-search">
          {SUPPORTERS_LABEL}
        </FormLabel>
        <Input
          id="supporter-search"
          value={search}
          minH="44px"
          placeholder={SUPPORTERS_SEARCH_PLACEHOLDER}
          onChange={(event) => setSearch(event.target.value)}
        />
      </FormControl>

      {error && (
        <Text fontSize="sm" color="red.500">
          {error}
        </Text>
      )}

      {isLoading && !error && (
        <Stack gap={2} aria-hidden="true">
          <Skeleton height="44px" borderRadius="10px" />
          <Skeleton height="44px" borderRadius="10px" />
        </Stack>
      )}

      {!isLoading && !error && candidates.length === 0 && (
        <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }}>
          Nobody has given to this campaign yet, so there is nobody to pick from.
        </Text>
      )}

      {!isLoading && !error && candidates.length > 0 && (
        <Stack gap={2} maxH="240px" overflowY="auto">
          {candidates.map((candidate) => {
            const isBlocked = candidate.isAlreadyFundraising;

            return (
              <Flex
                key={candidate.emailAddress}
                align="center"
                justify="space-between"
                gap={3}
                wrap="wrap"
                borderWidth="1px"
                borderColor="secondaryGray.300"
                borderRadius="10px"
                px={3}
                py={2}
              >
                <Stack gap={0} minW={0}>
                  <Text fontSize="sm" fontWeight="600" noOfLines={1}>
                    {candidate.displayName}
                  </Text>
                  <Text fontSize="xs" color="gray.600" _dark={{ color: 'gray.300' }} noOfLines={1}>
                    {candidate.emailAddress}
                  </Text>
                </Stack>
                <Flex align="center" gap={2}>
                  {candidate.isAlreadyFundraising && (
                    <Badge colorScheme="green" borderRadius="8px">
                      Already fundraising
                    </Badge>
                  )}
                  {!candidate.isAlreadyFundraising && candidate.isAlreadyInvited && (
                    <Badge colorScheme="purple" borderRadius="8px">
                      Already invited
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    minH="44px"
                    isDisabled={isBlocked}
                    onClick={() => onPick(candidate.emailAddress)}
                    sx={{ cursor: isBlocked ? 'not-allowed' : 'pointer' }}
                  >
                    Add
                  </Button>
                </Flex>
              </Flex>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
};

export default SupporterPicker;
