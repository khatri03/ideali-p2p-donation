import {
  ModeratedFundraiser,
  ModeratedTeam,
} from 'app/interface/donationInter/peerToPeerModerationDto';
import { STATUS_LABELS } from './moderationCopy';

/**
 * A field is quoted whenever it could otherwise change the shape of the row. A supporter chooses their
 * own page name, so a comma or a quotation mark in it must not be able to shift every later column.
 */
const escapeField = (value: string | number): string => {
  const text = String(value ?? '');

  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const toCsv = (headers: string[], rows: (string | number)[][]): string =>
  [headers, ...rows].map((row) => row.map(escapeField).join(',')).join('\r\n');

const formatDate = (isoUtc: string) => {
  const when = new Date(isoUtc);

  return Number.isNaN(when.getTime()) ? '' : when.toLocaleDateString();
};

/**
 * Hands the browser a file built from what is already on screen. Nothing private rides along: the
 * columns here are exactly the columns the table shows, so an export can never carry a field the
 * charity was not already looking at.
 */
const download = (fileName: string, csv: string) => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  link.click();

  URL.revokeObjectURL(url);
};

const safeFileName = (campaignName: string, suffix: string) => {
  const stem = campaignName.trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '');

  return `${stem || 'campaign'}-${suffix}.csv`;
};

export const exportFundraisers = (
  campaignName: string,
  fundraisers: ModeratedFundraiser[],
): void => {
  const csv = toCsv(
    ['Name', 'Address', 'Status', 'Raised', 'Donors', 'Goal', 'Team', 'Started'],
    fundraisers.map((fundraiser) => [
      fundraiser.displayName,
      fundraiser.slug,
      STATUS_LABELS[fundraiser.currentStatus],
      fundraiser.raisedAmount,
      fundraiser.donorCount,
      fundraiser.goal ?? '',
      fundraiser.teamName ?? '',
      formatDate(fundraiser.startedOnUtc),
    ]),
  );

  download(safeFileName(campaignName, 'fundraising-pages'), csv);
};

export const exportTeams = (campaignName: string, teams: ModeratedTeam[]): void => {
  const csv = toCsv(
    ['Name', 'Address', 'Captain', 'Members', 'Raised', 'Goal', 'Visibility', 'Started'],
    teams.map((team) => [
      team.name,
      team.slug,
      team.captainName,
      team.memberCount,
      team.raisedAmount,
      team.teamGoal ?? '',
      team.isHidden ? 'Hidden' : 'Showing publicly',
      formatDate(team.startedOnUtc),
    ]),
  );

  download(safeFileName(campaignName, 'teams'), csv);
};
