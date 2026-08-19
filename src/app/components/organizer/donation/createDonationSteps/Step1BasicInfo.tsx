import React from 'react';
import {
  Box,
  FormControl,
  Input,
  Text,
  SimpleGrid,
  Divider,
} from '@chakra-ui/react';
import CommonMethod from '../../../../service/helpers/commonMethod';
import { Step1BasicInfoProps } from './shared/types';
import DateTimePicker from '../organizerDonationComponents/dateTimePicker';
import StepNavigationButtons from './shared/StepNavigationButtons';

export default function Step1BasicInfo({
  campaignData,
  formData,
  nameError,
  startDateError,
  endDateError,
  onNameChange,
  onDateChange,
  onSaveAndNext,
  onBackToList,
  isSubmitting,
  onSaveAndExit,
  isSavingAndExiting,
}: Step1BasicInfoProps) {
  function handleStartDateChange(date: Date | null) {
    onDateChange({
      target: {
        name: 'startDate',
        value: date ? CommonMethod.toDatetimeLocal(date.toISOString()) : '',
      },
    } as React.ChangeEvent<HTMLInputElement>);
  }

  function handleEndDateChange(date: Date | null) {
    onDateChange({
      target: {
        name: 'endDate',
        value: date ? CommonMethod.toDatetimeLocal(date.toISOString()) : '',
      },
    } as React.ChangeEvent<HTMLInputElement>);
  }

  const startDateValue = formData.startDate ? new Date(formData.startDate) : null;
  const endDateValue   = formData.endDate   ? new Date(formData.endDate)   : null;

  return (
    <>
      <Box maxW="100%" h="85%">
        <Text fontSize="32px" mb="4">
          Campaign Name
          <Text as="span" color="red.700">*</Text>
        </Text>

        <FormControl mb="3">
          <Input
            name="name"
            placeholder="Enter Donation Campaign Name"
            value={campaignData.name}
            onChange={(e) => onNameChange(e.target.value)}
            maxLength={40}
          />
          <Text as="span" fontSize="sm" fontWeight="bold" color="red.700" mt={2}>
            {nameError}
          </Text>
        </FormControl>

        <SimpleGrid columns={{ sm: 1, md: 2 }} spacing="20px">
          <DateTimePicker
            label="Start Date"
            required
            value={startDateValue}
            onChange={handleStartDateChange}
            placeholder="Select start date & time"
            error={startDateError}
          />
          <DateTimePicker
            label="End Date"
            value={endDateValue}
            minDate={startDateValue}
            onChange={handleEndDateChange}
            placeholder="Select end date & time"
            error={endDateError}
          />
        </SimpleGrid>
      </Box>

      <Divider my={1} />

      <Box maxW="100%" h="10%">
        <StepNavigationButtons
          onPrev={onBackToList}
          onNext={onSaveAndNext}
          onSaveAndExit={onSaveAndExit}
          prevLabel="Back To List"
          nextLabel="Save & Next"
          isSubmitting={isSubmitting}
          isSavingAndExiting={isSavingAndExiting}
          loadingText="Creating..."
        />
      </Box>
    </>
  );
}
