import { Page, expect, test } from '@playwright/test';
import { draftCampaign, liveCampaign } from './support/campaignFixtures';

const CAMPAIGNS_PATH = '/organizer/donation/manage-donation-module';
const MENU_LABEL = 'P2P Fundraising';
const DRAFT_HINT = 'Publish this campaign before setting up P2P fundraising.';

const draft = draftCampaign();
const live = liveCampaign();

/**
 * Opens the menu on one campaign card, matched by its exact name, so the assertions cannot
 * accidentally read a different campaign's menu when the list order changes.
 */
const openMenuFor = async (page: Page, campaignName: string) => {
  const card = page
    .locator('.chakra-card')
    .filter({ has: page.getByText(campaignName, { exact: true }) })
    .first();

  await expect(card).toBeVisible();
  await card.getByRole('button', { name: 'More options' }).click();

  return page.getByRole('menuitem', { name: MENU_LABEL });
};

test.beforeEach(async ({ page }) => {
  await page.goto(CAMPAIGNS_PATH);
});

test.describe('Peer-to-peer entry point in the campaign menu', () => {
  test('CampaignMenu_DraftCampaign_OffersPeerToPeerAsBlockedAndSaysWhy', async ({ page }) => {
    const item = await openMenuFor(page, draft.name);

    await expect(item).toBeVisible();
    await expect(item).toBeDisabled();
    await expect(item).toHaveAttribute('title', DRAFT_HINT);
  });

  test('CampaignMenu_DraftCampaign_ClickingBlockedItemDoesNotNavigate', async ({ page }) => {
    const item = await openMenuFor(page, draft.name);

    await item.click({ force: true });

    await expect(page).toHaveURL(new RegExp(`${CAMPAIGNS_PATH}$`));
  });

  test('CampaignMenu_LiveCampaign_OpensTheSettingsPageForThatCampaign', async ({ page }) => {
    const item = await openMenuFor(page, live.name);

    await expect(item).toBeEnabled();
    await item.click();

    await expect(page).toHaveURL(
      new RegExp(`/donation/campaign/${live.uniqueId}/peer-to-peer$`, 'i'),
    );
    await expect(page.getByRole('heading', { name: 'P2P fundraising' })).toBeVisible();
  });

  test('CampaignsList_AnySupportedViewport_DoesNotScrollHorizontally', async ({ page }) => {
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );

    expect(overflow).toBeLessThanOrEqual(1);
  });
});
