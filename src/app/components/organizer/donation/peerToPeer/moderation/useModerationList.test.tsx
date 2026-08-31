import { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ModerationListResult, ModerationQuery } from 'app/interface/donationInter/peerToPeerModerationDto';
import { useModerationList } from './useModerationList';

const CAMPAIGN = '9176ec7b-661b-4da6-b970-90076f3e60ca';

const emptyResult = (): ModerationListResult<unknown> =>
  ({
    page: { pageData: [], pageNo: 1, pageSize: 20, totalRecordsCount: 0 },
  }) as unknown as ModerationListResult<unknown>;

const renderList = (address: string) => {
  const read = vi.fn(async (_campaignUniqueId: string, _query: ModerationQuery) => emptyResult());

  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[address]}>{children}</MemoryRouter>
  );

  const view = renderHook(() => useModerationList(CAMPAIGN, read), { wrapper });

  return { read, view };
};

describe('useModerationList', () => {
  /**
   * A link that promises the pages waiting for approval must deliver exactly those. Landing on the
   * whole list and leaving the charity to filter again defeats the point of the link.
   */
  it('List_AddressAsksForOneStatus_ReadsOnlyThatStatus', async () => {
    const { read } = renderList(`/campaign/${CAMPAIGN}/fundraisers?status=PendingApproval`);

    await waitFor(() => expect(read).toHaveBeenCalled());
    expect(read.mock.calls[0][1]).toMatchObject({ status: 'PendingApproval' });
  });

  /**
   * The status travels in the address bar, so anyone can type anything into it. An unrecognised value
   * is dropped rather than passed to the server as written.
   */
  it('List_AddressCarriesAnUnknownStatus_IgnoresItRatherThanPassingItOn', async () => {
    const { read } = renderList(`/campaign/${CAMPAIGN}/fundraisers?status=Whatever`);

    await waitFor(() => expect(read).toHaveBeenCalled());
    expect(read.mock.calls[0][1].status).toBeUndefined();
  });

  /** Opening the screen with no status in the address reads every page, as it always has. */
  it('List_AddressAsksForNoStatus_ReadsEveryPage', async () => {
    const { read } = renderList(`/campaign/${CAMPAIGN}/fundraisers`);

    await waitFor(() => expect(read).toHaveBeenCalled());
    expect(read.mock.calls[0][1].status).toBeUndefined();
  });

  /**
   * Arriving through the link counts as a filter being applied, so the screen offers a way to clear it
   * and its empty state explains that something is filtered rather than that nobody is fundraising.
   */
  it('List_ArrivedThroughAFilteredLink_ReportsItselfAsFiltered', async () => {
    const { view } = renderList(`/campaign/${CAMPAIGN}/fundraisers?status=PendingApproval`);

    await waitFor(() => expect(view.result.current.isFiltered).toBe(true));
  });
});
