import { Alert, AlertIcon, Box, Button, Divider, Stack, Text } from '@chakra-ui/react';
import {
  FundraiserJoinContext,
  FundraiserJoinRequest,
} from 'app/interface/donationInter/fundraiserJoinDto';
import { JOIN_LEAD, JOIN_SUBMIT } from './joinCopy';
import FundraiserJoinFields from './FundraiserJoinFields';
import FundraiserTeamFields from './FundraiserTeamFields';
import { useFundraiserJoinForm } from './useFundraiserJoinForm';
import { useJoinableTeams } from './useJoinableTeams';

interface FundraiserJoinFormProps {
  context: FundraiserJoinContext;
  suggestedDisplayName: string;
  /** The team the supporter arrived from, pre-selected so they never pick it twice. */
  invitedTeamSlug: string | null;
  isSubmitting: boolean;
  onSubmit: (request: FundraiserJoinRequest) => void;
}

export const FundraiserJoinForm = ({
  context,
  suggestedDisplayName,
  invitedTeamSlug,
  isSubmitting,
  onSubmit,
}: FundraiserJoinFormProps) => {
  const form = useFundraiserJoinForm(context, suggestedDisplayName, invitedTeamSlug);
  const teams = useJoinableTeams(context.campaignSlug, context.areTeamsAllowed);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (form.validate()) {
      onSubmit(form.buildRequest());
    }
  };

  return (
    <Box
      as="form"
      onSubmit={handleSubmit}
      bg="white"
      _dark={{ bg: 'navy.700' }}
      borderRadius="16px"
      p={{ base: 5, md: 8 }}
      boxShadow="sm"
      noValidate
    >
      <Stack gap={5}>
        <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }} lineHeight="1.7">
          {JOIN_LEAD}
        </Text>

        {context.requiresApproval && (
          <Alert status="info" borderRadius="12px">
            <AlertIcon />
            <Text fontSize="sm">
              {context.campaignName} reviews supporter pages before they go live. Yours will not be
              public until the charity approves it.
            </Text>
          </Alert>
        )}

        <FundraiserJoinFields form={form} isDisabled={isSubmitting} />

        {context.areTeamsAllowed && (
          <>
            <Divider />
            <FundraiserTeamFields
              form={form}
              teams={teams.teams}
              isLoadingTeams={teams.isLoading}
              teamsError={teams.loadError}
              onRetryTeams={teams.reload}
              isDisabled={isSubmitting}
            />
          </>
        )}

        <Button
          type="submit"
          colorScheme="brand"
          w={{ base: 'full', md: 'auto' }}
          alignSelf={{ base: 'stretch', md: 'flex-start' }}
          minH="44px"
          isDisabled={isSubmitting}
          isLoading={isSubmitting}
          loadingText="Creating your page..."
          sx={{ cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
        >
          {JOIN_SUBMIT}
        </Button>
      </Stack>
    </Box>
  );
};

export default FundraiserJoinForm;
