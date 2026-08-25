import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { exportFundraisers, exportTeams } from './moderationExport';
import { buildFundraiser, buildTeam } from './moderationTestFactory';

let csv = '';
let captured: { download: string } | null = null;

class CapturingBlob {
  constructor(parts: string[]) {
    csv = parts.join('');
  }
}

beforeEach(() => {
  csv = '';
  captured = null;

  vi.stubGlobal('Blob', CapturingBlob);
  vi.stubGlobal('URL', {
    createObjectURL: () => 'blob:captured',
    revokeObjectURL: (): void => undefined,
  });

  vi.spyOn(document, 'createElement').mockImplementation(() => {
    // The caller sets download before it clicks, so the name is read off the link afterwards.
    const link = { href: '', download: '', click: (): void => undefined };

    captured = link;

    return link as unknown as HTMLElement;
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const rowsOf = () => csv.split('\r\n');

describe('exportFundraisers', () => {
  it('Export_Rows_CarriesOnlyTheColumnsTheTableShows', () => {
    exportFundraisers('Winter Appeal', [buildFundraiser()]);

    const [header, row] = rowsOf();

    expect(header).toBe('Name,Address,Status,Raised,Donors,Goal,Team,Started');
    expect(row).toContain('Sara Malik,sara-malik,Live,170,2,500,,');
  });

  it('Export_Rows_CarriesNoDonorNameOrIdentifier', () => {
    exportFundraisers('Winter Appeal', [buildFundraiser()]);

    expect(csv).not.toContain(buildFundraiser().uniqueId);
    expect(csv.toLowerCase()).not.toContain('email');
  });

  it('Export_NameWithACommaInIt_IsQuotedSoTheColumnsDoNotShift', () => {
    exportFundraisers('Winter Appeal', [buildFundraiser({ displayName: 'Malik, Sara' })]);

    expect(rowsOf()[1].startsWith('"Malik, Sara"')).toBe(true);
  });

  it('Export_NameWithAQuotationMarkInIt_IsDoubledRatherThanBreakingTheRow', () => {
    exportFundraisers('Winter Appeal', [buildFundraiser({ displayName: 'Sara "Runner" Malik' })]);

    expect(rowsOf()[1].startsWith('"Sara ""Runner"" Malik"')).toBe(true);
  });

  it('Export_PageWithNoGoal_LeavesTheColumnEmptyRatherThanWritingNull', () => {
    exportFundraisers('Winter Appeal', [buildFundraiser({ goal: null })]);

    expect(rowsOf()[1]).toContain('Sara Malik,sara-malik,Live,170,2,,');
  });

  it('Export_Called_NamesTheFileAfterTheCampaign', () => {
    exportFundraisers('Winter Appeal', [buildFundraiser()]);

    expect(captured?.download).toBe('Winter-Appeal-fundraising-pages.csv');
  });

  it('Export_CampaignNamedOnlyWithPunctuation_StillProducesAUsableFileName', () => {
    exportFundraisers('***', [buildFundraiser()]);

    expect(captured?.download).toBe('campaign-fundraising-pages.csv');
  });
});

describe('exportTeams', () => {
  it('Export_Teams_CarriesTheVisibilityTheScreenShows', () => {
    exportTeams('Winter Appeal', [buildTeam({ isHidden: true })]);

    const [header, row] = rowsOf();

    expect(header).toBe('Name,Address,Captain,Members,Raised,Goal,Visibility,Started');
    expect(row).toContain('Hidden');
  });

  it('Export_Teams_NamesTheFileAfterTheCampaign', () => {
    exportTeams('Winter Appeal', [buildTeam()]);

    expect(captured?.download).toBe('Winter-Appeal-teams.csv');
  });
});
