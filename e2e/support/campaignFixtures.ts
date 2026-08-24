import { SQL_COLUMN_SEPARATOR, queryColumns } from './database';
import { e2eEnv } from './e2eEnv';

export interface CampaignFixture {
  uniqueId: string;
  name: string;
  status: string;
}

const campaignsFor = (predicate: string, mostRecent = 1): CampaignFixture[] =>
  queryColumns(`
    SELECT TOP ${mostRecent}
      CAST(campaign.UniqueId AS VARCHAR(40)) + ${SQL_COLUMN_SEPARATOR} +
      campaign.Name + ${SQL_COLUMN_SEPARATOR} +
      campaign.CurrentStatus
    FROM DonationCampaign campaign
    INNER JOIN Organizer organizer ON organizer.Id = campaign.OrganizerId
    INNER JOIN [User] signedIn ON signedIn.ContactId = organizer.PrimaryContactId
    WHERE campaign.IsDeleted = 0
      AND signedIn.UserName = '${e2eEnv.organizerUsername.replace(/'/g, "''")}'
      AND ${predicate}
    ORDER BY campaign.Id DESC;
  `).map(([uniqueId, name, status]) => ({ uniqueId, name, status }));

const one = (candidates: CampaignFixture[], description: string): CampaignFixture => {
  if (!candidates.length) {
    throw new Error(
      `No ${description} exists for ${e2eEnv.organizerUsername}. Seed one before running the suite.`,
    );
  }

  return candidates[0];
};

/** A campaign with no public page - peer-to-peer must refuse it. */
export const draftCampaign = (): CampaignFixture =>
  one(campaignsFor("campaign.CurrentStatus = 'Draft'"), 'draft campaign');

/** A live campaign - peer-to-peer settings must open and save against it. */
export const liveCampaign = (): CampaignFixture =>
  one(campaignsFor("campaign.CurrentStatus <> 'Draft'"), 'non-draft campaign');

/**
 * A second non-draft campaign, so a fundraiser being in a team on one campaign can be shown to leave
 * their fundraising on another campaign alone.
 */
export const secondLiveCampaign = (): CampaignFixture => {
  const candidates = campaignsFor("campaign.CurrentStatus <> 'Draft'", 2);

  if (candidates.length < 2) {
    throw new Error(
      `Fewer than two non-draft campaigns exist for ${e2eEnv.organizerUsername}. Seed a second one.`,
    );
  }

  return candidates[1];
};

/** A campaign that has finished - its team page must say so rather than take money. */
export const endedCampaign = (): CampaignFixture =>
  one(campaignsFor("campaign.CurrentStatus = 'Ended'"), 'ended campaign');

/** Someone else's campaign - the API must refuse it without confirming it exists. */
export const foreignCampaignUniqueId = (): string => {
  const rows = queryColumns(`
    SELECT TOP 1 CAST(campaign.UniqueId AS VARCHAR(40))
    FROM DonationCampaign campaign
    WHERE campaign.IsDeleted = 0
      AND campaign.OrganizerId NOT IN (
        SELECT organizer.Id
        FROM Organizer organizer
        INNER JOIN [User] signedIn ON signedIn.ContactId = organizer.PrimaryContactId
        WHERE signedIn.UserName = '${e2eEnv.organizerUsername.replace(/'/g, "''")}'
      )
    ORDER BY campaign.Id DESC;
  `);

  if (!rows.length) {
    throw new Error('No campaign belonging to another organizer exists to test cross-tenant refusal.');
  }

  return rows[0][0];
};
