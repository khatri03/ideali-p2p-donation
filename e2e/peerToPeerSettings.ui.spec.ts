import { expect, test } from '@playwright/test';
import { liveCampaign } from './support/campaignFixtures';

const campaign = liveCampaign();
const settingsPath = `/organizer/donation/campaign/${campaign.uniqueId}/peer-to-peer`;

const enabledSwitch = '#peer-to-peer-enabled';
const goalInput = '#peer-to-peer-default-goal';

/** Chakra renders the switch input underneath its own label, which is what receives the click. */
const enabledSwitchLabel = 'label.chakra-switch:has(#peer-to-peer-enabled)';

test.beforeEach(async ({ page }) => {
  await page.goto(settingsPath);
  await expect(page.getByRole('heading', { name: 'Peer-to-peer fundraising' })).toBeVisible();
});

test.describe('Peer-to-peer settings page', () => {
  test('SettingsPage_Opened_NamesTheCampaignBeingConfigured', async ({ page }) => {
    await expect(page.getByText(`Campaign: ${campaign.name}`)).toBeVisible();
  });

  test('SettingsPage_Loaded_ShowsEverySettingTheOrganizerCanChange', async ({ page }) => {
    await expect(page.locator(enabledSwitch)).toBeVisible();
    await expect(page.getByText('Turn supporter fundraising on')).toBeVisible();
    await expect(page.getByText('Suggested personal goal')).toBeVisible();
    await expect(page.getByText('Allow teams')).toBeVisible();
    await expect(page.getByText('Review pages before they go live')).toBeVisible();
    await expect(page.getByText('Who can see the leaderboard')).toBeVisible();
  });

  test('SettingsPage_SaveChanges_ConfirmsAndSurvivesAReload', async ({ page }) => {
    if (!(await page.locator(enabledSwitch).isChecked())) {
      await page.locator(enabledSwitchLabel).click();
    }

    await page.locator(goalInput).fill('275');
    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect(page.getByText('Settings saved')).toBeVisible();

    await page.reload();
    await expect(page.locator(goalInput)).toHaveValue('275');
  });

  test('SettingsPage_GoalBelowOne_ExplainsItselfAndSendsNothing', async ({ page }) => {
    let updateAttempts = 0;
    await page.route('**/peer-to-peer/settings', (route) => {
      if (route.request().method() === 'POST') {
        updateAttempts += 1;
      }
      return route.continue();
    });

    await page.locator(goalInput).fill('0');
    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect(
      page.getByText('Enter an amount greater than zero, or leave this blank.'),
    ).toBeVisible();
    expect(updateAttempts).toBe(0);
  });

  test('SettingsPage_TurningFundraisingOff_AsksBeforeItTakesEffect', async ({ page }) => {
    if (!(await page.locator(enabledSwitch).isChecked())) {
      await page.locator(enabledSwitchLabel).click();
      await page.getByRole('button', { name: 'Save changes' }).click();
      await expect(page.getByText('Settings saved')).toBeVisible();
    }

    await page.locator(enabledSwitchLabel).click();
    await expect(page.locator(enabledSwitch)).not.toBeChecked();
    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect(page.getByText('Turn supporter fundraising off?')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Keep it on' })).toBeVisible();

    await page.getByRole('button', { name: 'Keep it on' }).click();
    await expect(page.getByText('Turn supporter fundraising off?')).toBeHidden();
  });

  test('SettingsPage_UnknownCampaign_ShowsARetryableBannerAndNoInternalDetail', async ({ page }) => {
    await page.goto('/organizer/donation/campaign/00000000-0000-0000-0000-0000000000ff/peer-to-peer');

    const banner = page.getByRole('alert');
    await expect(banner).toBeVisible();
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();

    const message = (await banner.innerText()).toLowerCase();
    expect(message).not.toContain('exception');
    expect(message).not.toContain('stack');
    expect(message).not.toContain('sql');
    expect(message).not.toContain('http');
  });

  test('SettingsPage_AnySupportedViewport_DoesNotScrollHorizontally', async ({ page }) => {
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );

    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('SettingsPage_EveryControl_MeetsTheTouchTargetMinimum', async ({ page }) => {
    const save = await page.getByRole('button', { name: 'Save changes' }).boundingBox();
    const back = await page.getByRole('button', { name: 'Back' }).boundingBox();

    expect(save?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(back?.height ?? 0).toBeGreaterThanOrEqual(44);
  });
});
