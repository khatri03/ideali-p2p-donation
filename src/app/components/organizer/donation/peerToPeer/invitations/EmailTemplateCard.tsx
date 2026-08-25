import { useEffect, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Stack,
  Switch,
  Tag,
  Text,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import {
  EmailPlaceholder,
  EmailTemplate,
  EmailTemplateType,
} from 'app/interface/donationInter/peerToPeerEmailTemplateDto';
import LifecycleEmailEditor from './LifecycleEmailEditor';
import {
  SAVE_LABEL,
  SAVING_LABEL,
  SEND_TEST_LABEL,
  SENDING_TEST_LABEL,
  SUBJECT_LABEL,
  SUBJECT_REQUIRED_ERROR,
  TEMPLATE_OFF_LABEL,
  TEMPLATE_ON_LABEL,
  TEST_ADDRESS_HELP,
  TEST_ADDRESS_LABEL,
} from './emailTemplateCopy';

interface EmailTemplateCardProps {
  template: EmailTemplate;
  placeholders: EmailPlaceholder[];
  isSaving: boolean;
  isTesting: boolean;
  onSave: (template: EmailTemplate) => void;
  onSendTest: (templateType: EmailTemplateType, emailAddress?: string) => void;
}

export const EmailTemplateCard = ({
  template,
  placeholders,
  isSaving,
  isTesting,
  onSave,
  onSendTest,
}: EmailTemplateCardProps) => {
  const [draft, setDraft] = useState<EmailTemplate>(template);
  const [testAddress, setTestAddress] = useState('');
  const [subjectError, setSubjectError] = useState<string | null>(null);

  useEffect(() => setDraft(template), [template]);

  const handleSave = () => {
    if (draft.subject.trim().length === 0) {
      setSubjectError(SUBJECT_REQUIRED_ERROR);
      return;
    }

    setSubjectError(null);
    onSave(draft);
  };

  return (
    <Box
      as="section"
      borderWidth="1px"
      borderColor="secondaryGray.300"
      borderRadius="16px"
      p={{ base: 4, md: 6 }}
    >
      <Stack gap={4}>
        <Flex align="flex-start" justify="space-between" gap={3} wrap="wrap">
          <Stack gap={1} minW={0}>
            <Heading as="h2" fontSize={{ base: 'md', md: 'lg' }}>
              {template.displayName}
            </Heading>
            <Text fontSize="sm" color="secondaryGray.600">
              {template.whenItSends}
            </Text>
          </Stack>
          <Flex align="center" gap={3}>
            <Badge colorScheme={draft.isEnabled ? 'green' : 'gray'} borderRadius="8px" px={2} py={1}>
              {draft.isEnabled ? TEMPLATE_ON_LABEL : TEMPLATE_OFF_LABEL}
            </Badge>
            <Switch
              isChecked={draft.isEnabled}
              aria-label={`${template.displayName} enabled`}
              onChange={(event) => setDraft({ ...draft, isEnabled: event.target.checked })}
              sx={{ cursor: 'pointer' }}
            />
          </Flex>
        </Flex>

        <FormControl isInvalid={subjectError !== null}>
          <FormLabel fontSize="sm" htmlFor={`subject-${template.templateType}`}>
            {SUBJECT_LABEL}
          </FormLabel>
          <Input
            id={`subject-${template.templateType}`}
            value={draft.subject}
            minH="44px"
            maxLength={200}
            onChange={(event) => setDraft({ ...draft, subject: event.target.value })}
          />
          {subjectError && <FormErrorMessage fontSize="sm">{subjectError}</FormErrorMessage>}
        </FormControl>

        <LifecycleEmailEditor
          value={draft.bodyHtml}
          label={`${template.displayName} body`}
          onChange={(bodyHtml) => setDraft({ ...draft, bodyHtml })}
        />

        <Wrap>
          {placeholders.map((placeholder) => (
            <WrapItem key={placeholder.placeHolderText}>
              <Tag size="sm" borderRadius="8px">
                {placeholder.placeHolderText}
              </Tag>
            </WrapItem>
          ))}
        </Wrap>

        <Flex gap={3} wrap="wrap" align="flex-end" direction={{ base: 'column', md: 'row' }}>
          <FormControl maxW={{ md: '320px' }}>
            <FormLabel fontSize="sm" htmlFor={`test-${template.templateType}`}>
              {TEST_ADDRESS_LABEL}
            </FormLabel>
            <Input
              id={`test-${template.templateType}`}
              type="email"
              value={testAddress}
              minH="44px"
              placeholder={TEST_ADDRESS_HELP}
              onChange={(event) => setTestAddress(event.target.value)}
            />
          </FormControl>
          <Button
            colorScheme="brand"
            minH="44px"
            w={{ base: 'full', md: 'auto' }}
            isDisabled={isSaving}
            isLoading={isSaving}
            loadingText={SAVING_LABEL}
            onClick={handleSave}
            sx={{ cursor: isSaving ? 'not-allowed' : 'pointer' }}
          >
            {SAVE_LABEL}
          </Button>
          <Button
            variant="outline"
            minH="44px"
            w={{ base: 'full', md: 'auto' }}
            isDisabled={isTesting}
            isLoading={isTesting}
            loadingText={SENDING_TEST_LABEL}
            onClick={() => onSendTest(template.templateType, testAddress.trim() || undefined)}
            sx={{ cursor: isTesting ? 'not-allowed' : 'pointer' }}
          >
            {SEND_TEST_LABEL}
          </Button>
        </Flex>
      </Stack>
    </Box>
  );
};

export default EmailTemplateCard;
