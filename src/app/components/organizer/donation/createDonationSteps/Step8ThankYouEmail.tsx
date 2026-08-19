import { useRef } from 'react';
import {
  Box,
  Flex,
  FormControl,
  FormLabel,
  Text,
} from '@chakra-ui/react';
import EmailEditor from '../createDonationSteps/shared/emailEditor';
import VariableInsertButton from '../createDonationSteps/step8Components/variableInsertButton';
import SubjectInput, { SubjectInputHandle } from '../createDonationSteps/step8Components/subjectInput';
import StepNavigationButtons from './shared/StepNavigationButtons';

export interface Step8ThankYouEmailProps {
  emailSubject: string;
  emailBody: string;
  campaignName?: string;
  setEmailSubject: (s: string) => void;
  setEmailBody: (s: string) => void;
  onPrevStep: () => void;
  onSkip: () => void;
  onSaveAndNext: () => void;
  isSubmitting: boolean;
  onSaveAndExit?: () => void;
  isSavingAndExiting?: boolean;
  renderNavigation?: () => React.ReactNode;
}

export default function Step8ThankYouEmail({
  emailSubject,
  emailBody,
  setEmailSubject,
  setEmailBody,
  onPrevStep,
  onSkip,
  onSaveAndNext,
  isSubmitting,
  onSaveAndExit,
  isSavingAndExiting,
  renderNavigation,
}: Step8ThankYouEmailProps) {
  const subjectRef = useRef<SubjectInputHandle>(null);

  return (
    <>
      <Text fontSize="32" mb="6">Thank You Email</Text>

      <Text fontSize="sm" color="gray.600" mb="6">
        This email will be automatically sent to your donors and will include
        their transaction receipts. If applicable, links on receipts will
        reference this campaign.
      </Text>

      <Box mb="6">
        <FormControl mb="4">
          <Flex align="center" justify="space-between" mb={2}>
            <FormLabel fontWeight="semibold" mb={0}>Email Subject</FormLabel>
            <VariableInsertButton
              size="sm"
              onInsert={(placeholder) => subjectRef.current?.insertVariable(placeholder)}
            />
          </Flex>
          <SubjectInput
            ref={subjectRef}
            value={emailSubject}
            onChange={setEmailSubject}
            placeholder="Enter email subject"
          />
        </FormControl>

        <FormControl mb="4">
          <FormLabel fontWeight="semibold">Message</FormLabel>
          <Text fontSize="xs" color="gray.600" mb="2">
            The message begins with a default template that can't be edited; you can add your personalized message after it.
          </Text>
          <EmailEditor
            value={emailBody}
            onChange={setEmailBody}
            maxLength={5000}
          />
        </FormControl>
      </Box>

      {renderNavigation ? renderNavigation() : (
        <StepNavigationButtons
          onPrev={onPrevStep}
          onNext={onSaveAndNext}
          onSkip={onSkip}
          onSaveAndExit={onSaveAndExit}
          prevLabel="Back One Step"
          nextLabel="Save & Next"
          skipLabel="Skip"
          showSkip
          isSubmitting={isSubmitting}
          isSavingAndExiting={isSavingAndExiting}
          loadingText="Saving..."
        />
      )}
    </>
  );
}
