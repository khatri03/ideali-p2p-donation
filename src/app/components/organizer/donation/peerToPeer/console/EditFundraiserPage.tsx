import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, AlertIcon, Box, Button, Heading, Stack, Text } from '@chakra-ui/react';
import CopyLinkButton from '../page/CopyLinkButton';
import FundraiserPageNotice from '../page/FundraiserPageNotice';
import EditFundraiserFields from './EditFundraiserFields';
import FundraiserPhotoField from './FundraiserPhotoField';
import MyFundraisingSkeleton from './MyFundraisingSkeleton';
import ViewPublicPageLink from './ViewPublicPageLink';
import { myFundraisingPath } from './MyFundraisingPage';
import {
  BACK_TO_CONSOLE,
  EDIT_HEADING,
  EDIT_SUBHEADING,
  NOT_FOUND_GUIDANCE,
  NOT_FOUND_HEADING,
  NO_PUBLIC_ADDRESS_NOTE,
  RETRY_LABEL,
  SAVED_MESSAGE,
  SAVE_LABEL,
  SAVING_LABEL,
  UNSAVED_WARNING,
} from './consoleCopy';
import { fundraiserShareUrl } from './shareUrl';
import { toUpdateRequest, useEditFundraiserForm } from './useEditFundraiserForm';
import { useEditFundraiserPage } from './useEditFundraiserPage';

/**
 * Screen 09. Composition only: the calls live in one hook, what was typed lives in another, and the
 * fields and photo picker below are presentational.
 */
export const EditFundraiserPageScreen = () => {
  const { fundraiserUniqueId } = useParams<{ fundraiserUniqueId: string }>();
  const navigate = useNavigate();

  const {
    page,
    isLoading,
    loadError,
    isSaving,
    isPhotoBusy,
    saveError,
    hasSaved,
    reload,
    save,
    setPhoto,
    removePhoto,
  } = useEditFundraiserPage(fundraiserUniqueId);

  const { values, errors, hasUnsavedChanges, setField, validate, reset } = useEditFundraiserForm(page);

  const shareUrl = page ? fundraiserShareUrl(page) : '';

  // Closing the tab is the one navigation React Router cannot intercept, so the browser is asked to.
  useEffect(() => {
    if (!hasUnsavedChanges) {
      return undefined;
    }

    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = UNSAVED_WARNING;
    };

    window.addEventListener('beforeunload', warn);

    return () => window.removeEventListener('beforeunload', warn);
  }, [hasUnsavedChanges]);

  const handleSave = async () => {
    if (Object.keys(validate()).length > 0) {
      return;
    }

    const updated = await save(toUpdateRequest(values));

    if (updated && page) {
      reset(page);
    }
  };

  const handleLeave = () => {
    if (hasUnsavedChanges && !window.confirm(UNSAVED_WARNING)) {
      return;
    }

    navigate(myFundraisingPath);
  };

  return (
    <Box w="100%">
      <Stack gap={{ base: 4, md: 6 }} maxW="760px" mx="auto">
        {isLoading && <MyFundraisingSkeleton />}

        {!isLoading && (loadError || !page) && (
          <FundraiserPageNotice
            heading={NOT_FOUND_HEADING}
            message={loadError ?? NOT_FOUND_GUIDANCE}
            onRetry={reload}
            retryLabel={RETRY_LABEL}
          />
        )}

        {!isLoading && !loadError && page && (
          <>
            <Stack gap={1}>
              <Heading
                as="h1"
                fontSize={{ base: 'xl', md: '2xl', lg: '3xl' }}
                color="navy.700"
                _dark={{ color: 'white' }}
              >
                {EDIT_HEADING}
              </Heading>
              <Text fontSize={{ base: 'sm', md: 'md' }} color="gray.600" _dark={{ color: 'gray.300' }}>
                {EDIT_SUBHEADING(page.campaignName)}
              </Text>
            </Stack>

            {/*
              Editing and sharing are the same errand: somebody polishing their page wants to see how
              it reads to a donor and send the link on, without walking back to the console for either.
            */}
            <Stack gap={2}>
              <Stack direction={{ base: 'column', md: 'row' }} gap={3}>
                <ViewPublicPageLink shareUrl={shareUrl} />
                <CopyLinkButton shareUrl={shareUrl} />
              </Stack>

              {!shareUrl && (
                <Text fontSize="sm" color="gray.500" _dark={{ color: 'gray.400' }}>
                  {NO_PUBLIC_ADDRESS_NOTE}
                </Text>
              )}
            </Stack>

            <Box
              bg="white"
              _dark={{ bg: 'navy.700' }}
              borderRadius="16px"
              boxShadow="sm"
              p={{ base: 4, md: 6 }}
            >
              <Stack gap={6}>
                <FundraiserPhotoField
                  displayName={page.displayName}
                  photoUniqueId={page.photoUniqueId}
                  isBusy={isPhotoBusy}
                  onSelect={setPhoto}
                  onRemove={removePhoto}
                />

                <EditFundraiserFields
                  values={values}
                  errors={errors}
                  currencySymbol={page.currencySymbol}
                  isDisabled={isSaving}
                  onChange={setField}
                />

                {saveError && (
                  <Alert status="error" borderRadius="12px">
                    <AlertIcon />
                    {saveError}
                  </Alert>
                )}

                {hasSaved && !hasUnsavedChanges && (
                  <Alert status="success" borderRadius="12px">
                    <AlertIcon />
                    {SAVED_MESSAGE}
                  </Alert>
                )}

                <Stack direction={{ base: 'column', md: 'row' }} gap={3}>
                  <Button
                    onClick={handleSave}
                    colorScheme="brand"
                    isDisabled={isSaving || isPhotoBusy}
                    isLoading={isSaving}
                    loadingText={SAVING_LABEL}
                    minH="44px"
                    borderRadius="12px"
                    cursor="pointer"
                    w={{ base: 'full', md: 'auto' }}
                  >
                    {SAVE_LABEL}
                  </Button>

                  <Button
                    onClick={handleLeave}
                    variant="ghost"
                    colorScheme="brand"
                    isDisabled={isSaving}
                    minH="44px"
                    borderRadius="12px"
                    cursor="pointer"
                    w={{ base: 'full', md: 'auto' }}
                  >
                    {BACK_TO_CONSOLE}
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </>
        )}
      </Stack>
    </Box>
  );
};

export default EditFundraiserPageScreen;
