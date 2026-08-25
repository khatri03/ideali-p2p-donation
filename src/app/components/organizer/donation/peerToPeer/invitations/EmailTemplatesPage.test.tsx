import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CAMPAIGN_UNIQUE_ID, buildTemplate, buildTemplateList } from './invitationTestFactory';

const getEmailTemplates = vi.fn();
const updateEmailTemplate = vi.fn();
const sendEmailTemplateTest = vi.fn();

vi.mock('app/service/organizer/donation/peerToPeerEmailTemplateService', () => ({
  getEmailTemplates: (...args: unknown[]) => getEmailTemplates(...args),
  updateEmailTemplate: (...args: unknown[]) => updateEmailTemplate(...args),
  sendEmailTemplateTest: (...args: unknown[]) => sendEmailTemplateTest(...args),
}));

const { default: EmailTemplatesScreen } = await import('./EmailTemplatesPage');

const renderPage = () =>
  render(
    <ChakraProvider>
      <MemoryRouter
        initialEntries={[
          `/organizer/donation/campaign/${CAMPAIGN_UNIQUE_ID}/peer-to-peer/email-templates`,
        ]}
      >
        <Routes>
          <Route
            path="/organizer/donation/campaign/:campaignUniqueId/peer-to-peer/email-templates"
            element={<EmailTemplatesScreen />}
          />
        </Routes>
      </MemoryRouter>
    </ChakraProvider>,
  );

beforeEach(() => {
  getEmailTemplates.mockReset();
  updateEmailTemplate.mockReset();
  sendEmailTemplateTest.mockReset();
});

describe('EmailTemplatesPage', () => {
  it('Templates_Loaded_ShowsEachOneWithWhenItSends', async () => {
    getEmailTemplates.mockResolvedValue(buildTemplateList());

    renderPage();

    expect(await screen.findByText('Welcome')).toBeInTheDocument();
    expect(screen.getByText('As soon as a page goes live.')).toBeInTheDocument();
  });

  it('Templates_ReadFails_ShowsTheServersSentenceAndOffersAnotherAttempt', async () => {
    getEmailTemplates.mockRejectedValue(new Error('Campaign not found.'));

    renderPage();

    expect(await screen.findByText('Campaign not found.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('Templates_Placeholders_AreShownSoTheOrganiserKnowsWhatTheyCanUse', async () => {
    getEmailTemplates.mockResolvedValue(buildTemplateList());

    renderPage();

    expect(await screen.findByText('{{CampaignName}}')).toBeInTheDocument();
  });

  it('Save_EmptySubject_IsRefusedBeforeARequestIsSpent', async () => {
    getEmailTemplates.mockResolvedValue(buildTemplateList());

    renderPage();
    await screen.findByText('Welcome');

    await userEvent.clear(screen.getByLabelText('Subject line'));
    await userEvent.click(screen.getByRole('button', { name: 'Save template' }));

    expect(await screen.findByText('Write a subject line before saving.')).toBeInTheDocument();
    expect(updateEmailTemplate).not.toHaveBeenCalled();
  });

  it('Save_EditedSubject_SendsTheWholeTemplateBack', async () => {
    getEmailTemplates.mockResolvedValue(buildTemplateList());
    updateEmailTemplate.mockResolvedValue('Template saved.');

    renderPage();
    await screen.findByText('Welcome');

    await userEvent.clear(screen.getByLabelText('Subject line'));
    await userEvent.type(screen.getByLabelText('Subject line'), 'Our own welcome');
    await userEvent.click(screen.getByRole('button', { name: 'Save template' }));

    await waitFor(() =>
      expect(updateEmailTemplate).toHaveBeenCalledWith(
        CAMPAIGN_UNIQUE_ID,
        expect.objectContaining({ templateType: 'Welcome', subject: 'Our own welcome' }),
      ),
    );
  });

  it('Save_SwitchedOff_SendsTheTemplateAsDisabled', async () => {
    getEmailTemplates.mockResolvedValue(buildTemplateList());
    updateEmailTemplate.mockResolvedValue('Template saved.');

    renderPage();
    await screen.findByText('Welcome');

    await userEvent.click(screen.getByLabelText('Welcome enabled'));
    await userEvent.click(screen.getByRole('button', { name: 'Save template' }));

    await waitFor(() =>
      expect(updateEmailTemplate).toHaveBeenCalledWith(
        CAMPAIGN_UNIQUE_ID,
        expect.objectContaining({ isEnabled: false }),
      ),
    );
  });

  it('Save_Refused_TellsTheOrganiserRatherThanClaimingItSaved', async () => {
    getEmailTemplates.mockResolvedValue(buildTemplateList());
    updateEmailTemplate.mockRejectedValue(new Error('Write the email body before saving.'));

    renderPage();
    await screen.findByText('Welcome');

    await userEvent.click(screen.getByRole('button', { name: 'Save template' }));

    expect(await screen.findByText('Write the email body before saving.')).toBeInTheDocument();
  });

  it('Test_NoAddressTyped_SendsWithoutOneSoItGoesToTheSignedInAccount', async () => {
    getEmailTemplates.mockResolvedValue(buildTemplateList());
    sendEmailTemplateTest.mockResolvedValue('Test sent.');

    renderPage();
    await screen.findByText('Welcome');

    await userEvent.click(screen.getByRole('button', { name: 'Send a test' }));

    await waitFor(() =>
      expect(sendEmailTemplateTest).toHaveBeenCalledWith(CAMPAIGN_UNIQUE_ID, {
        templateType: 'Welcome',
        emailAddress: undefined,
      }),
    );
  });

  it('Test_AddressTyped_SendsToThatAddress', async () => {
    getEmailTemplates.mockResolvedValue(buildTemplateList());
    sendEmailTemplateTest.mockResolvedValue('Test sent.');

    renderPage();
    await screen.findByText('Welcome');

    await userEvent.type(screen.getByLabelText('Send the test to'), 'me@example.test');
    await userEvent.click(screen.getByRole('button', { name: 'Send a test' }));

    await waitFor(() =>
      expect(sendEmailTemplateTest).toHaveBeenCalledWith(CAMPAIGN_UNIQUE_ID, {
        templateType: 'Welcome',
        emailAddress: 'me@example.test',
      }),
    );
  });

  it('Test_Refused_TellsTheOrganiserRatherThanClaimingItWentOut', async () => {
    getEmailTemplates.mockResolvedValue(buildTemplateList());
    sendEmailTemplateTest.mockRejectedValue(
      new Error('That address has asked not to be emailed.'),
    );

    renderPage();
    await screen.findByText('Welcome');

    await userEvent.click(screen.getByRole('button', { name: 'Send a test' }));

    expect(
      await screen.findByText('That address has asked not to be emailed.'),
    ).toBeInTheDocument();
  });

  it('Templates_SwitchedOffOne_ReadsAsOffRatherThanLookingIdenticalToTheRest', async () => {
    getEmailTemplates.mockResolvedValue(
      buildTemplateList([buildTemplate({ isEnabled: false })]),
    );

    renderPage();

    expect(await screen.findByText('Off')).toBeInTheDocument();
  });
});
