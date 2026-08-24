import { Box, Button, Heading, Stack } from '@chakra-ui/react';
import { CampaignTeamPage } from 'app/interface/donationInter/campaignTeamDto';
import TeamFormFields from './TeamFormFields';
import { EDIT_ACTION, EDIT_HEADING, SAVING_LABEL } from './teamCopy';
import { TeamFormErrors, TeamFormValues } from './useTeamForm';

interface EditTeamPanelProps {
  team: CampaignTeamPage;
  values: TeamFormValues;
  errors: TeamFormErrors;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  onChange: (field: keyof TeamFormValues, value: string) => void;
  onSave: () => void;
}

/** The captain editing what donors read. Same fields and same rules as starting a team. */
export const EditTeamPanel = ({
  team,
  values,
  errors,
  hasUnsavedChanges,
  isSaving,
  onChange,
  onSave,
}: EditTeamPanelProps) => (
  <Box
    bg="white"
    _dark={{ bg: 'navy.700' }}
    borderRadius="16px"
    boxShadow="sm"
    p={{ base: 4, md: 6 }}
  >
    <Stack gap={{ base: 4, md: 6 }}>
      <Heading
        as="h2"
        fontSize={{ base: 'md', md: 'lg' }}
        color="navy.700"
        _dark={{ color: 'white' }}
      >
        {EDIT_HEADING}
      </Heading>

      <TeamFormFields
        values={values}
        errors={errors}
        currencySymbol={team.currencySymbol}
        isDisabled={isSaving}
        onChange={onChange}
      />

      <Button
        onClick={onSave}
        colorScheme="brand"
        alignSelf={{ md: 'flex-end' }}
        minH="44px"
        borderRadius="12px"
        cursor={isSaving || !hasUnsavedChanges ? 'not-allowed' : 'pointer'}
        isDisabled={isSaving || !hasUnsavedChanges}
        isLoading={isSaving}
        loadingText={SAVING_LABEL}
        w={{ base: 'full', md: 'auto' }}
      >
        {EDIT_ACTION}
      </Button>
    </Stack>
  </Box>
);

export default EditTeamPanel;
