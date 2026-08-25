import { Stack, Text, useToast } from '@chakra-ui/react';
import { useParams } from 'react-router-dom';
import {
  EmailTemplate,
  EmailTemplateType,
} from 'app/interface/donationInter/peerToPeerEmailTemplateDto';
import ModerationShell from '../moderation/ModerationShell';
import { ModerationError, ModerationSkeleton } from '../moderation/ModerationStates';
import EmailTemplateCard from './EmailTemplateCard';
import { EMAILS_HEADING, EMAILS_NOTE, PLACEHOLDERS_NOTE } from './emailTemplateCopy';
import useEmailTemplates from './useEmailTemplates';

/**
 * Screen 11. Six cards, one per lifecycle email, each editable and testable on its own so a charity
 * can change the one that reads badly without touching the five that do not.
 */
export const EmailTemplatesPage = () => {
  const { campaignUniqueId = '' } = useParams<{ campaignUniqueId: string }>();
  const templates = useEmailTemplates(campaignUniqueId);
  const toast = useToast();

  const announce = (outcome: { ok: boolean; message: string }) =>
    toast({
      title: outcome.message,
      status: outcome.ok ? 'success' : 'error',
      duration: 5000,
      isClosable: true,
    });

  const handleSave = async (template: EmailTemplate) => announce(await templates.save(template));

  const handleSendTest = async (templateType: EmailTemplateType, emailAddress?: string) =>
    announce(await templates.sendTest(templateType, emailAddress));

  return (
    <ModerationShell
      campaignUniqueId={campaignUniqueId}
      campaignName={templates.result?.campaignName}
      heading={EMAILS_HEADING}
    >
      <Stack gap={{ base: 4, md: 5 }}>
        <Text fontSize="sm" color="secondaryGray.600">
          {EMAILS_NOTE}
        </Text>

        {templates.error && (
          <ModerationError message={templates.error} onRetry={templates.reload} />
        )}

        {!templates.error && templates.isLoading && <ModerationSkeleton rows={3} />}

        {!templates.error && !templates.isLoading && templates.result && (
          <Stack gap={{ base: 4, md: 5 }}>
            <Text fontSize="sm" color="secondaryGray.600">
              {PLACEHOLDERS_NOTE}
            </Text>
            {templates.result.templates.map((template) => (
              <EmailTemplateCard
                key={template.templateType}
                template={template}
                placeholders={templates.result!.placeholders}
                isSaving={templates.savingType === template.templateType}
                isTesting={templates.testingType === template.templateType}
                onSave={handleSave}
                onSendTest={handleSendTest}
              />
            ))}
          </Stack>
        )}
      </Stack>
    </ModerationShell>
  );
};

export default EmailTemplatesPage;
