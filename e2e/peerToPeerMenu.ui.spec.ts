import { Locator, Page, expect, test } from '@playwright/test';
import { liveCampaign } from './support/campaignFixtures';

const CAMPAIGNS_PATH = '/organizer/donation/manage-donation-module';
const MENU_LABEL = 'P2P Fundraising';
const DRAFT_HINT = 'Publish this campaign before setting up P2P fundraising.';

const live = liveCampaign();

/**
 * Opens the menu on one campaign card, matched by its exact name, so the assertions cannot
 * accidentally read a different campaign's menu when the list order changes.
 */
/**
 * The list pages at six cards and the charity has more than that, so the card is paged to rather
 * than assumed to be on the first page. The title search is deliberately not used: it answers with
 * live campaigns only, and one of these assertions is about a draft.
 */
const openMenuOn = async (page: Page, card: Locator) => {
  await page.getByRole('combobox').selectOption('15');

  const next = page.getByRole('button', { name: 'Next' });
  while ((await card.count()) === 0 && (await next.isEnabled())) {
    await next.click();
  }

  await expect(card).toBeVisible();
  await card.getByRole('button', { name: 'More options' }).click();

  return page.getByRole('menuitem', { name: MENU_LABEL });
};

/** Matched by exact name so the assertions cannot read a different campaign's menu. */
const openMenuFor = (page: Page, campaignName: string) =>
  openMenuOn(
    page,
    page
      .locator('.chakra-card')
      .filter({ has: page.getByText(campaignName, { exact: true }) })
      .first(),
  );

/**
 * Any campaign the list itself marks as a draft. The rule under test is about the state, not about
 * one seeded row, and the newest draft in the database is not always one this list offers.
 */
const openMenuForADraft = (page: Page) =>
  openMenuOn(
    page,
    page
      .locator('.chakra-card')
      .filter({ has: page.getByText('Draft', { exact: true }) })
      .first(),
  );

test.beforeEach(async ({ page }) => {
  await page.goto(CAMPAIGNS_PATH);
});

test.describe('Peer-to-peer entry point in the campaign menu', () => {
  test('CampaignMenu_DraftCampaign_OffersPeerToPeerAsBlockedAndSaysWhy', async ({ page }) => {
    const item = await openMenuForADraft(page);

    await expect(item).toBeVisible();
    await expect(item).toBeDisabled();
    await expect(item).toHaveAttribute('title', DRAFT_HINT);
  });

  test('CampaignMenu_DraftCampaign_ClickingBlockedItemDoesNotNavigate', async ({ page }) => {
    const item = await openMenuForADraft(page);

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
