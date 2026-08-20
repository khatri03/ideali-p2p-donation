import React from 'react';
import { Box, Text } from '@chakra-ui/react';
import CommonMethod from '../../../../service/helpers/commonMethod';
import { Step10ReviewConfirmProps } from './shared/types';
import StepNavigationButtons from './shared/StepNavigationButtons';

const stripHtmlTags = (html: string): string => {
  if (!html) return '';
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || '';
};

export default function Step10ReviewConfirm({
  campaignData,
  isLoading,
  isAlreadyPublished,
  onPublish,
  onPrevStep,
  onBackToList,
  isSubmitting,
}: Step10ReviewConfirmProps) {
  return (
    <>
      <Text fontSize="32" mb="4">Review & Confirm</Text>

      <Box mb="3" p="4" borderWidth="1px" borderRadius="md">
        {campaignData ? (
          <>
            <Text><b>Name:</b> {campaignData.name}</Text>
            <Text><b>Start Date:</b> {CommonMethod.formatISOToLocalString(campaignData.startDate)}</Text>
            <Text><b>End Date:</b> {CommonMethod.formatISOToLocalString(campaignData.endDate)}</Text>
            <Text><b>Fundraising Goal:</b> {campaignData.goalAmount}</Text>
            <Text><b>Description:</b> {stripHtmlTags(campaignData.description || '')}</Text>
            <Text><b>Payment Account:</b> {campaignData?.paymentAccount?.name || '-'}</Text>
            <Text><b>Payment Account Merchant:</b> {campaignData?.paymentAccount?.merchant || '-'}</Text>
          </>
        ) : (
          <Text>Loading campaign data...</Text>
        )}
      </Box>

      <StepNavigationButtons
        onPrev={onPrevStep}
        onNext={onPublish}
        onSkip={onBackToList}
        prevLabel="Back One Step"
        nextLabel={isLoading ? 'Loading...' : 'Publish Campaign'}
        skipLabel="Back to list"
        showSkip
        isSubmitting={isSubmitting}
        disableNext={isAlreadyPublished || isLoading}
        loadingText="Publishing..."
      />
    </>
  );
}
