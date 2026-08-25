import { useCallback, useEffect, useState } from 'react';
import {
  EmailTemplate,
  EmailTemplateListResult,
  EmailTemplateType,
} from 'app/interface/donationInter/peerToPeerEmailTemplateDto';
import {
  getEmailTemplates,
  sendEmailTemplateTest,
  updateEmailTemplate,
} from 'app/service/organizer/donation/peerToPeerEmailTemplateService';

export interface TemplateOutcome {
  ok: boolean;
  message: string;
}

interface EmailTemplateState {
  result: EmailTemplateListResult | null;
  isLoading: boolean;
  error: string | null;
  savingType: EmailTemplateType | null;
  testingType: EmailTemplateType | null;
  reload: () => void;
  save: (template: EmailTemplate) => Promise<TemplateOutcome>;
  sendTest: (templateType: EmailTemplateType, emailAddress?: string) => Promise<TemplateOutcome>;
}

/**
 * The six lifecycle emails for one campaign. Saving and testing hand their outcome straight back to the
 * caller rather than parking it in state: the caller needs it in the same turn it acted, and reading it
 * out of state would show whatever the previous attempt left behind.
 */
export const useEmailTemplates = (campaignUniqueId: string): EmailTemplateState => {
  const [result, setResult] = useState<EmailTemplateListResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingType, setSavingType] = useState<EmailTemplateType | null>(null);
  const [testingType, setTestingType] = useState<EmailTemplateType | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    if (!campaignUniqueId) {
      setIsLoading(false);
      return undefined;
    }

    let isActive = true;

    setIsLoading(true);

    getEmailTemplates(campaignUniqueId)
      .then((next) => {
        if (isActive) {
          setResult(next);
          setError(null);
        }
      })
      .catch((failure: unknown) => {
        if (isActive) {
          setError(
            failure instanceof Error
              ? failure.message
              : 'The lifecycle emails could not be read.',
          );
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [campaignUniqueId, reloadToken]);

  const save = useCallback(
    async (template: EmailTemplate): Promise<TemplateOutcome> => {
      setSavingType(template.templateType);

      try {
        const message = await updateEmailTemplate(campaignUniqueId, {
          templateType: template.templateType,
          subject: template.subject,
          bodyHtml: template.bodyHtml,
          isEnabled: template.isEnabled,
        });

        reload();

        return { ok: true, message };
      } catch (failure) {
        return {
          ok: false,
          message:
            failure instanceof Error ? failure.message : 'That template could not be saved.',
        };
      } finally {
        setSavingType(null);
      }
    },
    [campaignUniqueId, reload],
  );

  const sendTest = useCallback(
    async (templateType: EmailTemplateType, emailAddress?: string): Promise<TemplateOutcome> => {
      setTestingType(templateType);

      try {
        return {
          ok: true,
          message: await sendEmailTemplateTest(campaignUniqueId, { templateType, emailAddress }),
        };
      } catch (failure) {
        return {
          ok: false,
          message: failure instanceof Error ? failure.message : 'That test could not be sent.',
        };
      } finally {
        setTestingType(null);
      }
    },
    [campaignUniqueId],
  );

  return {
    result,
    isLoading,
    error,
    savingType,
    testingType,
    reload,
    save,
    sendTest,
  };
};

export default useEmailTemplates;
