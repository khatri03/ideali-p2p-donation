import { expect, test } from '@playwright/test';
import { liveCampaign } from './support/campaignFixtures';

/**
 * The charity's own view of the standings, signed in, at desktop, tablet and 375px.
 *
 * The rule this suite protects is the one the screen was built for: reading the board must not cost
 * the charity the navigation it arrived through. Everything else on the page is the same board the
 * public suite already proves, so it is not re-asserted here.
 */

const campaign = liveCampaign();
const settingsPath = `/organizer/donation/campaign/${campaign.uniqueId}/peer-to-peer`;
const boardPath = `${settingsPath}/leaderboard`;

test.describe('Organizer leaderboard screen', () => {
  test('Board_ReachedFromTheOversightTabs_StaysInsideTheOrganizerFrame', async ({ page }) => {
    await page.goto(settingsPath);
    await expect(page.getByRole('heading', { name: 'P2P fundraising' })).toBeVisible();

    await page.getByRole('link', { name: 'Leaderboard' }).click();

    await expect(page).toHaveURL(new RegExp(`${boardPath}$`));
    await expect(page.getByRole('heading', { name: 'Leaderboard', level: 1 })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Supporter fundraising sections' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Fundraising pages' })).toBeVisible();
  });

  test('Board_Opened_NamesTheCampaignTheStandingsBelongTo', async ({ page }) => {
    await page.goto(boardPath);

    await expect(page.getByText(`Campaign: ${campaign.name}`)).toBeVisible();
  });

  /** The oversight frame owns the h1, so the board underneath must not announce a second one. */
  test('Board_Opened_AnnouncesOnlyOneFirstLevelHeading', async ({ page }) => {
    await page.goto(boardPath);
    await expect(page.getByRole('heading', { name: 'Leaderboard', level: 1 })).toBeVisible();

    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  });

  /** Wide standings scroll inside their own container; the page itself never scrolls sideways. */
  test('Board_AtEveryWidth_HasNoHorizontalPageScroll', async ({ page }) => {
    await page.goto(boardPath);
    await expect(page.getByRole('heading', { name: 'Leaderboard', level: 1 })).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );

    expect(overflow).toBeLessThanOrEqual(1);
  });

  /** Every way out of this screen has to be operable by thumb, not only by mouse. */
  test('Board_AtEveryWidth_KeepsEveryNavigationTargetAtLeast44pxTall', async ({ page }) => {
    await page.goto(boardPath);
    const tabs = page.getByRole('navigation', { name: 'Supporter fundraising sections' }).getByRole('link');

    await expect(tabs.first()).toBeVisible();

    for (const tab of await tabs.all()) {
      const box = await tab.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    }
  });
});
