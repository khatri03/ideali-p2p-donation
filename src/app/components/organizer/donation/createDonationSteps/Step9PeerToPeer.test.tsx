import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PeerToPeerSettingsDetail } from 'app/interface/donationInter/peerToPeerDto';
import { buildSettings } from '../peerToPeer/peerToPeerTestFactory';

const getPeerToPeerSettings = vi.fn();
const updatePeerToPeerSettings = vi.fn();

vi.mock('app/service/organizer/donation/peerToPeerService', () => ({
  getPeerToPeerSettings: (...args: unknown[]) => getPeerToPeerSettings(...args),
  updatePeerToPeerSettings: (...args: unknown[]) => updatePeerToPeerSettings(...args),
}));

const { default: Step9PeerToPeer } = await import('./Step9PeerToPeer');

const CAMPAIGN_ID = '3f2b19c4-0f6e-4a55-9a1d-52f0b7c9e881';

const handlers = () => ({
  onSaveAndNext: vi.fn(),
  onSkip: vi.fn(),
  onPrevStep: vi.fn(),
  onExit: vi.fn(),
  onStepComplete: vi.fn(),
});

type Handlers = ReturnType<typeof handlers>;

const renderStep = (overrides: Partial<Handlers> = {}) => {
  const props = { ...handlers(), ...overrides };

  render(
    <ChakraProvider>
      <Step9PeerToPeer campaignUniqueId={CAMPAIGN_ID} isSubmitting={false} {...props} />
    </ChakraProvider>,
  );

  return props;
};

const settingsResolve = (settings: PeerToPeerSettingsDetail) =>
  getPeerToPeerSettings.mockResolvedValue(settings);

const enabledSwitch = () => screen.getByRole('checkbox', { name: /Turn supporter fundraising on/i });
const saveAndNext = () => screen.getByRole('button', { name: /Save & Next/i });
const goalField = () => screen.getByLabelText(/Suggested personal goal/i);

const waitForFields = async () =>
  waitFor(() => expect(screen.getByText('Turn supporter fundraising on')).toBeInTheDocument());

beforeEach(() => {
  getPeerToPeerSettings.mockReset();
  updatePeerToPeerSettings.mockReset();
});

describe('Step9PeerToPeer', () => {
  it('Step_WhileSettingsLoad_ShowsSkeletonInsteadOfAnEmptyForm', () => {
    getPeerToPeerSettings.mockReturnValue(new Promise(() => undefined));

    renderStep();

    expect(screen.queryByText('Turn supporter fundraising on')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Save & Next/i })).not.toBeInTheDocument();
  });

  it('Step_SettingsFailToLoad_OffersRetryAndRecoversWhenItSucceeds', async () => {
    getPeerToPeerSettings.mockRejectedValue(new Error('network down'));

    const props = renderStep();

    const retry = await screen.findByRole('button', { name: 'Try again' });
    expect(screen.queryByRole('button', { name: /Save & Exit/i })).not.toBeInTheDocument();

    settingsResolve(buildSettings());
    await userEvent.click(retry);

    await waitForFields();
    expect(props.onStepComplete).not.toHaveBeenCalled();
  });

  it('Step_LoadFailed_SkipForNowLeavesTheStepWithoutSaving', async () => {
    getPeerToPeerSettings.mockRejectedValue(new Error('network down'));

    const props = renderStep();

    await userEvent.click(await screen.findByRole('button', { name: /Skip For Now/i }));

    expect(props.onSkip).toHaveBeenCalledTimes(1);
    expect(updatePeerToPeerSettings).not.toHaveBeenCalled();
  });

  it('Step_CampaignAlreadyOptedIn_MarksTheStepCompleteWithoutAnyEdit', async () => {
    settingsResolve(buildSettings({ isPeerToPeerEnabled: true }));

    const props = renderStep();

    await waitFor(() => expect(props.onStepComplete).toHaveBeenCalledTimes(1));
  });

  it('Step_CampaignNotOptedIn_DoesNotMarkTheStepComplete', async () => {
    settingsResolve(buildSettings());

    const props = renderStep();

    await waitForFields();
    expect(props.onStepComplete).not.toHaveBeenCalled();
  });

  it('Step_SaveAndNext_SendsTheEditedSettingsThenAdvances', async () => {
    settingsResolve(buildSettings());
    updatePeerToPeerSettings.mockResolvedValue(undefined);

    const props = renderStep();
    await waitForFields();

    await userEvent.click(enabledSwitch());
    await userEvent.type(goalField(), '250');
    await userEvent.click(saveAndNext());

    await waitFor(() =>
      expect(updatePeerToPeerSettings).toHaveBeenCalledWith(CAMPAIGN_ID, {
        isPeerToPeerEnabled: true,
        defaultPersonalGoal: 250,
        allowTeams: false,
        requiresApproval: false,
        leaderboardVisibility: 'Hidden',
      }),
    );
    await waitFor(() => expect(props.onSaveAndNext).toHaveBeenCalledTimes(1));
    expect(props.onExit).not.toHaveBeenCalled();
  });

  it('Step_SaveAndExit_SavesThenLeavesTheWizardInsteadOfAdvancing', async () => {
    settingsResolve(buildSettings());
    updatePeerToPeerSettings.mockResolvedValue(undefined);

    const props = renderStep();
    await waitForFields();

    await userEvent.click(enabledSwitch());
    await userEvent.click(screen.getByRole('button', { name: /Save & Exit/i }));

    await waitFor(() => expect(props.onExit).toHaveBeenCalledTimes(1));
    expect(props.onSaveAndNext).not.toHaveBeenCalled();
  });

  it('Step_SaveRejected_ReportsItAndKeepsTheOrganizerOnTheStep', async () => {
    settingsResolve(buildSettings());
    updatePeerToPeerSettings.mockRejectedValue(new Error('rejected'));

    const props = renderStep();
    await waitForFields();

    await userEvent.click(enabledSwitch());
    await userEvent.click(saveAndNext());

    expect(await screen.findByText('Not saved')).toBeInTheDocument();
    expect(props.onSaveAndNext).not.toHaveBeenCalled();
    expect(props.onStepComplete).not.toHaveBeenCalled();
  });

  it('Step_GoalBelowOne_ExplainsItselfAndSendsNothing', async () => {
    settingsResolve(buildSettings());

    renderStep();
    await waitForFields();

    await userEvent.click(enabledSwitch());
    await userEvent.type(goalField(), '0');
    await userEvent.click(saveAndNext());

    expect(
      await screen.findByText('Enter an amount greater than zero, or leave this blank.'),
    ).toBeInTheDocument();
    expect(updatePeerToPeerSettings).not.toHaveBeenCalled();
  });

  it('Step_TurningFundraisingOff_AsksBeforeAnythingIsSent', async () => {
    settingsResolve(buildSettings({ isPeerToPeerEnabled: true, liveFundraiserCount: 2 }));

    renderStep();
    await waitForFields();

    await userEvent.click(enabledSwitch());
    await userEvent.click(saveAndNext());

    expect(await screen.findByText('Turn supporter fundraising off?')).toBeInTheDocument();
    expect(screen.getByText(/2 supporter pages will stop being reachable/)).toBeInTheDocument();
    expect(updatePeerToPeerSettings).not.toHaveBeenCalled();
  });

  it('Step_KeepingFundraisingOn_CancelsTheSaveEntirely', async () => {
    settingsResolve(buildSettings({ isPeerToPeerEnabled: true }));

    const props = renderStep();
    await waitForFields();

    await userEvent.click(enabledSwitch());
    await userEvent.click(saveAndNext());
    await userEvent.click(await screen.findByRole('button', { name: 'Keep it on' }));

    await waitFor(() =>
      expect(screen.queryByText('Turn supporter fundraising off?')).not.toBeInTheDocument(),
    );
    expect(updatePeerToPeerSettings).not.toHaveBeenCalled();
    expect(props.onSaveAndNext).not.toHaveBeenCalled();
  });

  it('Step_ConfirmingSwitchOff_SendsTheDisabledSettingsAndAdvances', async () => {
    settingsResolve(buildSettings({ isPeerToPeerEnabled: true, allowTeams: true }));
    updatePeerToPeerSettings.mockResolvedValue(undefined);

    const props = renderStep();
    await waitForFields();

    await userEvent.click(enabledSwitch());
    await userEvent.click(saveAndNext());
    await userEvent.click(await screen.findByRole('button', { name: 'Turn it off' }));

    await waitFor(() =>
      expect(updatePeerToPeerSettings).toHaveBeenCalledWith(
        CAMPAIGN_ID,
        expect.objectContaining({ isPeerToPeerEnabled: false }),
      ),
    );
    await waitFor(() => expect(props.onSaveAndNext).toHaveBeenCalledTimes(1));
  });

  it('Step_CampaignCannotEnableYet_LocksTheSwitchAndBlocksAdvancing', async () => {
    settingsResolve(
      buildSettings({
        canEnable: false,
        blockedReason: 'Publish this campaign before setting up P2P fundraising.',
      }),
    );

    renderStep();
    await waitForFields();

    expect(enabledSwitch()).toBeDisabled();
    expect(saveAndNext()).toBeDisabled();
    expect(
      screen.getByText('Publish this campaign before setting up P2P fundraising.'),
    ).toBeInTheDocument();
  });

  it('Step_CampaignCannotEnableYet_StillLetsTheOrganizerSkipOrGoBack', async () => {
    settingsResolve(buildSettings({ canEnable: false, blockedReason: 'Publish it first.' }));

    const props = renderStep();
    await waitForFields();

    await userEvent.click(screen.getByRole('button', { name: /^Skip$/i }));
    await userEvent.click(screen.getByRole('button', { name: /Back One Step/i }));

    expect(props.onSkip).toHaveBeenCalledTimes(1);
    expect(props.onPrevStep).toHaveBeenCalledTimes(1);
    expect(updatePeerToPeerSettings).not.toHaveBeenCalled();
  });

  /**
   * The order of these settings is the order a charity decides them in: the master switch, then the
   * one decision that carries real risk — whether a supporter's page reaches the public before anyone
   * on the charity has read it — then what supporters may do, then presentation. Reordering them puts
   * the approval gate below the fold of the reader's attention, which is how it gets left off.
   */
  it('Step_SettingsShown_PutsTheApprovalGateDirectlyUnderTheMasterSwitch', async () => {
    settingsResolve(buildSettings());

    renderStep();
    await waitForFields();

    const settingLabels = Array.from(
      document.querySelectorAll('label[for^="peer-to-peer-"]'),
    ).map((label) => label.textContent);

    expect(settingLabels).toEqual([
      'Turn supporter fundraising on',
      'Review pages before they go live',
      'Allow teams',
      'Suggested personal goal',
      'Who can see the leaderboard',
    ]);
  });
});
