import { useNavigate, useParams } from 'react-router-dom';
import { Box, Button, Heading, Stack, Text } from '@chakra-ui/react';
import { createCampaignTeam } from 'app/service/organizer/donation/campaignTeamService';
import FundraiserPageNotice from '../page/FundraiserPageNotice';
import PublicPageShell from '../page/PublicPageShell';
import CreateTeamRefusal, { createTeamRefusal } from './CreateTeamRefusal';
import CreateTeamSkeleton from './CreateTeamSkeleton';
import TeamActionError from './TeamActionError';
import TeamFormFields from './TeamFormFields';
import {
  BROWSE_LOAD_FAILED_HEADING,
  CANCEL_LABEL,
  CREATE_ACTION,
  CREATE_HEADING,
  CREATE_NOTE,
  CREATING_LABEL,
  RETRY_LABEL,
  createSubheading,
} from './teamCopy';
import { browseTeamsPath, teamPagePath } from './teamPaths';
import { useCampaignTeams } from './useCampaignTeams';
import { useTeamAction } from './useTeamAction';
import { toTeamSaveRequest, useTeamForm } from './useTeamForm';

const CREATE_FAILED = 'Could not create the team.';

/**
 * Screen 14. Every reason somebody cannot start a team here is a designed refusal with the way forward
 * on it, and the form itself is the shared one, so a rule enforced when editing is enforced when
 * creating.
 */
export const CreateTeamScreen = () => {
  const { campaignSlug } = useParams<{ campaignSlug: string }>();
  const navigate = useNavigate();
  const { browse, isLoading, loadError, reload } = useCampaignTeams(campaignSlug);
  const { isBusy, actionError, clearActionError, run } = useTeamAction();
  const { values, errors, setField, validate } = useTeamForm(null);

  const handleCreate = async () => {
    if (Object.keys(validate()).length || !campaignSlug) return;

    const created = await run(
      () => createCampaignTeam(campaignSlug, toTeamSaveRequest(values)),
      CREATE_FAILED,
    );

    if (created) {
      navigate(teamPagePath(created.campaignSlug, created.slug));
    }
  };

  if (isLoading) {
    return (
      <PublicPageShell maxWidth="760px">
        <CreateTeamSkeleton />
      </PublicPageShell>
    );
  }

  if (loadError || !browse) {
    return (
      <PublicPageShell maxWidth="760px">
        <FundraiserPageNotice
          heading={BROWSE_LOAD_FAILED_HEADING}
          message={loadError}
          onRetry={reload}
          retryLabel={RETRY_LABEL}
        />
      </PublicPageShell>
    );
  }

  const refusal = createTeamRefusal(browse);

  if (refusal) {
    return (
      <PublicPageShell maxWidth="760px">
        <CreateTeamRefusal reason={refusal} onAct={navigate} />
      </PublicPageShell>
    );
  }

  return (
    <PublicPageShell maxWidth="760px">
      <Stack gap={{ base: 4, md: 6 }}>
        <Stack gap={1}>
          <Heading
            as="h1"
            fontSize={{ base: 'xl', md: '2xl', lg: '3xl' }}
            color="navy.700"
            _dark={{ color: 'white' }}
          >
            {CREATE_HEADING}
          </Heading>
          <Text fontSize={{ base: 'sm', md: 'md' }} color="gray.600" _dark={{ color: 'gray.300' }}>
            {createSubheading(browse.campaignName)}
          </Text>
        </Stack>

        {actionError && <TeamActionError message={actionError} onDismiss={clearActionError} />}

        <Box
          bg="white"
          _dark={{ bg: 'navy.700' }}
          borderRadius="16px"
          boxShadow="sm"
          p={{ base: 4, md: 6 }}
        >
          <Stack gap={{ base: 4, md: 6 }}>
            <TeamFormFields
              values={values}
              errors={errors}
              currencySymbol={browse.currencySymbol}
              isDisabled={isBusy}
              onChange={setField}
            />

            <Text fontSize="sm" color="gray.500" _dark={{ color: 'gray.400' }}>
              {CREATE_NOTE}
            </Text>

            <Stack direction={{ base: 'column-reverse', md: 'row' }} gap={3} justify="flex-end">
              <Button
                onClick={() => navigate(browseTeamsPath(browse.campaignSlug))}
                variant="outline"
                minH="44px"
                borderRadius="12px"
                cursor={isBusy ? 'not-allowed' : 'pointer'}
                isDisabled={isBusy}
                w={{ base: 'full', md: 'auto' }}
              >
                {CANCEL_LABEL}
              </Button>

              <Button
                onClick={handleCreate}
                colorScheme="brand"
                minH="44px"
                borderRadius="12px"
                cursor={isBusy ? 'not-allowed' : 'pointer'}
                isDisabled={isBusy}
                isLoading={isBusy}
                loadingText={CREATING_LABEL}
                w={{ base: 'full', md: 'auto' }}
              >
                {CREATE_ACTION}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </PublicPageShell>
  );
};

export default CreateTeamScreen;
