import React from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Text,
} from '@chakra-ui/react';
import { useStep01 } from './useStep01';
import { MembershipPreviewData } from '../../../types';
import StepNavButtons from '../../shared/StepNavButtons';
import Loader from 'app/components/common/Loader';

interface Step01Props {
  membershipId: string | null;
  isEditMode?: boolean;
  onComplete: (createdId: string) => void;
  onSkip?: (tempId: string) => void;
  onSaveAndExit?: () => void;
  isSavingAndExiting?: boolean;
  onPreviewUpdate?: (data: Partial<MembershipPreviewData>) => void;
}

const MAX = 80;
const MIN = 3;

export default function Step01BasicInfo({
  membershipId,
  isEditMode,
  onComplete,
  onSkip,
  onSaveAndExit,
  isSavingAndExiting,
  onPreviewUpdate,
}: Step01Props) {
  const { name, setName, nameError, isLoading, isSubmitting, submit, saveAndExit } = useStep01({
    membershipId,
    isEditMode,
    onComplete,
    onPreviewUpdate,
  });

  const count = name.length;
  const isOverLimit = count > MAX;

  return (
    <Box
      bg="white"
      borderRadius="2xl"
      border="1px solid"
      borderColor="gray.200"
      boxShadow="0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04)"
      overflow="hidden"
    >
      {/* Form body */}
      <Box px={{ base: 3, md: 6 }} pt={6} pb={5}>
        {isLoading ? (
          <Loader message="Loading Title" subtitle="Fetching membership title..." />
        ) : (<>
        <Text fontSize="xl" fontWeight="bold" color="gray.900" mb={1}>
          Membership Title
        </Text>
        <Text fontSize="sm" color="gray.400" mb={6}>
          Set the title for the membership type. This value will be saved as the
          membership type name.
        </Text>

        <FormControl isRequired>
          <FormLabel fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
            Membership Title
          </FormLabel>
          <Input
            placeholder="Monthly Membership"
            fontSize="sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            bg="gray.100"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="lg"
            boxShadow="sm"
            _focus={{
              boxShadow: '0 0 0 2px #044bd9',
              bg: 'white',
              borderColor: '#044bd9',
            }}
            _hover={{ bg: 'white', borderColor: 'gray.300', boxShadow: 'md' }}
            size="md"
          />
        </FormControl>

        <Text
          fontSize="xs"
          color={
            isOverLimit
              ? 'red.500'
              : count > 0 && count < MIN
                ? 'orange.400'
                : 'gray.400'
          }
          mt={2}
        >
          {count}/{MAX} characters · {MIN}–{MAX} characters allowed.
        </Text>
        {nameError && (
          <Text fontSize="xs" color="red.500" mt={1}>
            {nameError}
          </Text>
        )}
        </>)}
      </Box>

      {/* Footer */}
      <StepNavButtons
        onNext={submit}
        onSaveAndExit={onSaveAndExit ? () => saveAndExit(onSaveAndExit) : undefined}
        isSavingAndExiting={isSavingAndExiting}
        isSubmitting={isSubmitting}
        disableNext={isOverLimit}
        nextLabel="Save & Continue"
      />
    </Box>
  );
}
