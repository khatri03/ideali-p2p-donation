import React, { useRef, useState, KeyboardEvent } from 'react';
import {
  Box, Flex, FormControl, FormLabel, Icon, Switch, Tag, TagCloseButton,
  TagLabel, Text, Input as ChakraInput,
} from '@chakra-ui/react';
import { MdNotifications } from 'react-icons/md';
import EmailEditor from 'app/components/organizer/donation/createDonationSteps/shared/emailEditor';
import SubjectInput, { SubjectInputHandle } from 'app/components/organizer/donation/createDonationSteps/step8Components/subjectInput';
import membershipEmailTemplateService from 'app/components/organizer/membership/services/membershipEmailTemplateService';
import Loader from 'app/components/common/Loader';
import MembershipVariableInsertButton from './MembershipVariableInsertButton';
import MembershipSnippetManager from './MembershipSnippetManager';
import StepNavButtons from '../../shared/StepNavButtons';
import { useStep09 } from './useStep09';

interface Step09Props {
  membershipId: string | null;
  isEditMode?: boolean;
  onComplete: () => void;
  onPrev?: () => void;
  onSaveAndExit?: () => void;
  isSavingAndExiting?: boolean;
}

export default function Step09ThankYouEmail({
  membershipId,
  isEditMode,
  onComplete,
  onPrev,
  onSaveAndExit,
  isSavingAndExiting,
}: Step09Props) {
  const {
    emailSubject, setEmailSubject,
    emailBody, setEmailBody,
    notifyOrganizer, setNotifyOrganizer,
    otherEmails, setOtherEmails,
    isLoading, isSubmitting, submit, saveAndExit,
  } = useStep09({ membershipId, isEditMode, onComplete });

  const subjectRef = useRef<SubjectInputHandle>(null);
  const [emailInput, setEmailInput] = useState('');

  const addEmail = (raw: string) => {
    const trimmed = raw.trim().replace(/,+$/, '');
    if (!trimmed) return;
    const parts = trimmed.split(',').map((e) => e.trim()).filter(Boolean);
    setOtherEmails((prev) => {
      const next = [...prev];
      parts.forEach((p) => { if (!next.includes(p)) next.push(p); });
      return next;
    });
    setEmailInput('');
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const nativeEvent = e.nativeEvent as InputEvent;
    // Browser autocomplete fires insertReplacementText; also handle comma-paste
    if (nativeEvent.inputType === 'insertReplacementText' || value.includes(',')) {
      addEmail(value);
    } else {
      setEmailInput(value);
    }
  };

  const handleEmailKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addEmail(emailInput);
    } else if (e.key === 'Backspace' && emailInput === '' && otherEmails.length > 0) {
      setOtherEmails((prev) => prev.slice(0, -1));
    }
  };

  return (
    <Box
      bg="white"
      borderRadius="2xl"
      border="1px solid"
      borderColor="gray.200"
      boxShadow="0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04)"
      overflow="hidden"
    >
      <Box px={{ base: 3, md: 6 }} pt={6} pb={5}>
        {isLoading ? (
          <Loader message="Loading Email" subtitle="Fetching saved thank you email settings..." />
        ) : (<>
        <Text fontSize="xl" fontWeight="bold" color="gray.900" mb={1}>
          Thank You Email
        </Text>
        <Text fontSize="sm" color="gray.400" mb={6}>
          This email will be automatically sent to members after they sign up for this membership type.
        </Text>

        {/* Notifications section */}
        <Box
          border="1px solid"
          borderColor="gray.200"
          borderRadius="xl"
          overflow="hidden"
          mb={5}
        >
          {/* Header */}
          <Flex
            align="center"
            gap={2}
            px={4}
            py={3}
            bg="gray.50"
            borderBottom="1px solid"
            borderColor="gray.200"
          >
            <Icon as={MdNotifications} boxSize={4} color="gray.500" />
            <Text fontSize="sm" fontWeight="semibold" color="gray.700">Notifications</Text>
            <Box flex={1} />
            {/* Notify Organizer inline toggle */}
            <Box
              bg="white"
              border="1px solid"
              borderColor="gray.200"
              borderRadius="lg"
              px={3}
              py={2}
            >
              <Flex align="center" gap={3}>
                <Box>
                  <Text fontSize="xs" fontWeight="semibold" color="gray.700">Notify Organizer</Text>
                  <Text fontSize="xs" color="gray.400">Send a copy to the organizer.</Text>
                </Box>
                <Switch
                  isChecked={notifyOrganizer}
                  onChange={(e) => setNotifyOrganizer(e.target.checked)}
                  colorScheme="teal"
                  size="md"
                  flexShrink={0}
                />
              </Flex>
            </Box>
          </Flex>

          {/* Other notification emails */}
          <Box px={4} py={3}>
            <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={2}>
              Other Notification Emails
            </Text>
            <Flex
              flexWrap="wrap"
              align="center"
              gap={1.5}
              border="1px solid"
              borderColor="gray.200"
              borderRadius="lg"
              px={3}
              py={2}
              minH="42px"
              cursor="text"
              onClick={() => document.getElementById('email-chip-input')?.focus()}
              _focusWithin={{ borderColor: '#044bd9', boxShadow: '0 0 0 1px #044bd9' }}
              transition="border-color 0.15s, box-shadow 0.15s"
            >
              {otherEmails.map((email) => (
                <Tag
                  key={email}
                  size="sm"
                  borderRadius="full"
                  variant="outline"
                  colorScheme="teal"
                  fontSize="xs"
                >
                  <TagLabel>{email}</TagLabel>
                  <TagCloseButton
                    onClick={() => setOtherEmails((prev) => prev.filter((e) => e !== email))}
                  />
                </Tag>
              ))}
              <ChakraInput
                id="email-chip-input"
                value={emailInput}
                onChange={handleEmailChange}
                onKeyDown={handleEmailKeyDown}
                onBlur={() => addEmail(emailInput)}
                placeholder={otherEmails.length === 0 ? 'Add another email' : ''}
                variant="unstyled"
                fontSize="sm"
                color="gray.700"
                flex={1}
                minW="120px"
                _placeholder={{ color: 'gray.400' }}
              />
            </Flex>
            <Text fontSize="xs" color="teal.500" mt={1.5}>
              Enter comma-separated email addresses for additional recipients.
            </Text>
          </Box>
        </Box>

        {/* Subject */}
        <FormControl mb={4}>
          <Flex align="center" justify="space-between" gap={2} flexWrap="wrap" mb={2}>
            <FormLabel fontWeight="semibold" mb={0}>Email Subject</FormLabel>
            <MembershipVariableInsertButton
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

        {/* Body */}
        <FormControl mb={4}>
          <FormLabel fontWeight="semibold" mb={2}>Message</FormLabel>
          <Text fontSize="xs" color="gray.500" mb={2}>
            The message begins with a default template that can't be edited; you can add your personalized message after it.
          </Text>
          <EmailEditor
            value={emailBody}
            onChange={setEmailBody}
            maxLength={5000}
            getPlaceHolders={() => membershipEmailTemplateService.getEmailPlaceHolders()}
            SnippetManagerComponent={MembershipSnippetManager}
          />
        </FormControl>
        </>)}
      </Box>

      <StepNavButtons
        onNext={submit}
        onPrev={onPrev}
        onSaveAndExit={onSaveAndExit ? () => saveAndExit(onSaveAndExit) : undefined}
        isSavingAndExiting={isSavingAndExiting}
        isSubmitting={isSubmitting}
      />
    </Box>
  );
}
