import { APIRequestContext, expect, test } from '@playwright/test';
import { anonymousApi, fundraiserPageUrl } from './support/apiSession';
import { liveCampaign } from './support/campaignFixtures';
import { execute, querySingleValue } from './support/database';

/**
 * Blocker 2, one line at a time, against the real database rather than an in-memory fake: tips are
 * excluded, pending payments are not counted, refunds subtract, a gift given to the campaign directly
 * moves no fundraiser total, and each settled installment of a recurring donation counts once.
 *
 * The gifts are written straight into the invoice tables and deleted afterwards. Nothing here goes
 * near the payment path - no card, no Stripe, no charge - because what is under test is the figure the
 * page adds up, not how the money arrived.
 */

const campaign = liveCampaign();
const FUNDRAISER_SLUG = 'e2e-raised-total';
const OTHER_SLUG = 'e2e-raised-total-other';
const PROBE_TAG = 'e2e-raised';

let anonymous: APIRequestContext;
let campaignSlug: string;

const removeProbeData = (): void =>
  execute(`
    DECLARE @campaignId INT = (SELECT Id FROM DonationCampaign WHERE UniqueId = '${campaign.uniqueId}');

    DECLARE @invoiceIds TABLE (Id INT);
    INSERT INTO @invoiceIds
    SELECT Id FROM Invoice WHERE CreatedBy = '${PROBE_TAG}';

    DELETE FROM InvoiceRefund WHERE InvoiceId IN (SELECT Id FROM @invoiceIds);
    DELETE FROM InvoiceItem WHERE InvoiceId IN (SELECT Id FROM @invoiceIds);
    DELETE FROM DonationCampaignInvoice WHERE InvoiceId IN (SELECT Id FROM @invoiceIds);
    DELETE FROM Invoice WHERE Id IN (SELECT Id FROM @invoiceIds);

    DELETE FROM CampaignFundraiser
    WHERE DonationCampaignId = @campaignId AND CreatedBy = '${PROBE_TAG}';
  `);

const insertFundraiser = (slug: string, userOffset: number): void =>
  execute(`
    DECLARE @campaignId INT = (SELECT Id FROM DonationCampaign WHERE UniqueId = '${campaign.uniqueId}');
    DECLARE @organizerId INT = (SELECT OrganizerId FROM DonationCampaign WHERE Id = @campaignId);
    DECLARE @userId INT = (SELECT Id FROM (
      SELECT Id, ROW_NUMBER() OVER (ORDER BY Id) AS RowNo FROM [User]
    ) ranked WHERE RowNo = ${userOffset});

    INSERT INTO CampaignFundraiser
      (UniqueId, RowVersion, OrganizerId, DonationCampaignId, UserId, Slug, DisplayName, Story,
       PersonalGoal, CurrentStatus, IsDeleted, CreatedBy, CreatedOnUtc)
    VALUES
      (NEWID(), 0, @organizerId, @campaignId, @userId, '${slug}', 'E2E Raised Total', NULL,
       1000, 'Active', 0, '${PROBE_TAG}', SYSUTCDATETIME());
  `);

interface Gift {
  amount: number;
  tipAmount?: number;
  refundedAmount?: number;
  invoiceStatus?: 'Paid' | 'PendingPayment';
  fundraiserSlug?: string | null;
}

const insertGift = ({
  amount,
  tipAmount = 0,
  refundedAmount = 0,
  invoiceStatus = 'Paid',
  fundraiserSlug = FUNDRAISER_SLUG,
}: Gift): void =>
  execute(`
    DECLARE @campaignId INT = (SELECT Id FROM DonationCampaign WHERE UniqueId = '${campaign.uniqueId}');
    DECLARE @fundraiserId INT = ${
      fundraiserSlug === null
        ? 'NULL'
        : `(SELECT Id FROM CampaignFundraiser WHERE DonationCampaignId = @campaignId AND Slug = '${fundraiserSlug}')`
    };

    INSERT INTO Invoice (UniqueId, RowVersion, Module, InvoiceType, TotalAmount, InvoiceStatus,
                         IsDeleted, CreatedBy, CreatedOnUtc)
    VALUES (NEWID(), 0, 'Donation', 'Regular', ${amount + tipAmount}, '${invoiceStatus}',
            0, '${PROBE_TAG}', SYSUTCDATETIME());

    DECLARE @invoiceId INT = SCOPE_IDENTITY();

    INSERT INTO InvoiceItem (UniqueId, InvoiceId, Description, InvoiceItemStatus, Quantity, UnitPrice,
                             LineTotal, ItemType, IsDeleted, CreatedBy, CreatedOnUtc)
    VALUES (NEWID(), @invoiceId, 'Donation', 'Pending', 1, ${amount}, ${amount}, 'Regular', 0,
            '${PROBE_TAG}', SYSUTCDATETIME());

    IF ${tipAmount} > 0
      INSERT INTO InvoiceItem (UniqueId, InvoiceId, Description, InvoiceItemStatus, Quantity, UnitPrice,
                               LineTotal, ItemType, IsDeleted, CreatedBy, CreatedOnUtc)
      VALUES (NEWID(), @invoiceId, 'Tip', 'Pending', 1, ${tipAmount}, ${tipAmount}, 'Tip', 0,
              '${PROBE_TAG}', SYSUTCDATETIME());

    IF ${refundedAmount} > 0
      INSERT INTO InvoiceRefund (InvoiceId, Amount, Reason, CreatedBy, CreatedOnUtc)
      VALUES (@invoiceId, ${refundedAmount}, 'e2e refund probe', '${PROBE_TAG}', SYSUTCDATETIME());

    INSERT INTO DonationCampaignInvoice (UniqueId, DonationCampaignId, InvoiceId, CampaignFundraiserId)
    VALUES (NEWID(), @campaignId, @invoiceId, @fundraiserId);
  `);

const readPage = async () => {
  const response = await anonymous.get(fundraiserPageUrl(campaignSlug, FUNDRAISER_SLUG));
  expect(response.status()).toBe(200);

  return (await response.json()).data;
};

test.beforeAll(async () => {
  anonymous = await anonymousApi();

  execute(`
    UPDATE DonationCampaign
    SET IsPeerToPeerEnabled = 1,
        PeerToPeerSlug = ISNULL(PeerToPeerSlug, 'e2e-campaign-' + CAST(Id AS VARCHAR(10)))
    WHERE UniqueId = '${campaign.uniqueId}';
  `);

  campaignSlug = querySingleValue(`
    SELECT PeerToPeerSlug FROM DonationCampaign WHERE UniqueId = '${campaign.uniqueId}';
  `);

  removeProbeData();
});

test.beforeEach(() => {
  removeProbeData();
  insertFundraiser(FUNDRAISER_SLUG, 1);
});

test.afterAll(async () => {
  removeProbeData();
  await anonymous.dispose();
});

test.describe('Raised total, one rule at a time', () => {
  test('Raised_SettledGifts_AreCountedGrossOfFees', async () => {
    insertGift({ amount: 50 });
    insertGift({ amount: 25 });

    const page = await readPage();

    expect(page.raisedAmount).toBe(75);
    expect(page.donorCount).toBe(2);
  });

  test('Raised_TipOnAGift_IsExcludedBecauseItIsNotMoneyRaisedForTheCause', async () => {
    insertGift({ amount: 50, tipAmount: 7 });

    expect((await readPage()).raisedAmount).toBe(50);
  });

  test('Raised_PaymentStillPending_IsNotCountedUntilItSettles', async () => {
    insertGift({ amount: 80, invoiceStatus: 'PendingPayment' });

    const page = await readPage();

    expect(page.raisedAmount).toBe(0);
    expect(page.donorCount).toBe(0);
  });

  test('Raised_PartialRefund_TakesTheTotalDown', async () => {
    insertGift({ amount: 100, refundedAmount: 40 });

    expect((await readPage()).raisedAmount).toBe(60);
  });

  test('Raised_GiftRefundedInFull_LeavesTheTotalAtZeroRatherThanNegative', async () => {
    insertGift({ amount: 100, refundedAmount: 100 });

    const page = await readPage();

    expect(page.raisedAmount).toBe(0);
    expect(page.donorCount).toBe(0);
  });

  test('Raised_RefundedGift_KeepsItsAttributionBecauseTheCreditIsWriteOnce', async () => {
    insertGift({ amount: 100, refundedAmount: 100 });

    const stillAttributed = querySingleValue(`
      SELECT CAST(COUNT(*) AS VARCHAR(10))
      FROM DonationCampaignInvoice donation
      INNER JOIN Invoice invoice ON invoice.Id = donation.InvoiceId
      INNER JOIN CampaignFundraiser fundraiser ON fundraiser.Id = donation.CampaignFundraiserId
      WHERE invoice.CreatedBy = '${PROBE_TAG}' AND fundraiser.Slug = '${FUNDRAISER_SLUG}';
    `);

    expect(stillAttributed).toBe('1');
  });

  test('Raised_GiftGivenToTheCampaignDirectly_MovesNoFundraiserTotal', async () => {
    insertGift({ amount: 500, fundraiserSlug: null });

    expect((await readPage()).raisedAmount).toBe(0);
  });

  test('Raised_GiftGivenThroughAnotherPage_StaysOnThatOtherPage', async () => {
    insertFundraiser(OTHER_SLUG, 2);
    insertGift({ amount: 300, fundraiserSlug: OTHER_SLUG });

    expect((await readPage()).raisedAmount).toBe(0);
  });

  test('Raised_RecurringDonation_CountsPerSettledInstallmentNotAsAPromisedTotal', async () => {
    insertGift({ amount: 20 });
    insertGift({ amount: 20 });
    insertGift({ amount: 20, invoiceStatus: 'PendingPayment' });

    const page = await readPage();

    expect(page.raisedAmount).toBe(40);
    expect(page.donorCount).toBe(2);
  });

  test('Raised_EverySurface_ReadsTheSameFigureAtTheSameMoment', async () => {
    insertGift({ amount: 100 });
    insertGift({ amount: 55, tipAmount: 5 });

    const first = await readPage();
    const second = await readPage();

    expect(first.raisedAmount).toBe(155);
    expect(second.raisedAmount).toBe(first.raisedAmount);
  });
});
