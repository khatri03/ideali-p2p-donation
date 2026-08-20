import { renderHook, waitFor } from '@testing-library/react';
import { AxiosError } from 'axios';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildSettings } from './peerToPeerTestFactory';

const getPeerToPeerSettings = vi.fn();
const updatePeerToPeerSettings = vi.fn();

vi.mock('app/service/organizer/donation/peerToPeerService', () => ({
  getPeerToPeerSettings: (...args: unknown[]) => getPeerToPeerSettings(...args),
  updatePeerToPeerSettings: (...args: unknown[]) => updatePeerToPeerSettings(...args),
}));

const { usePeerToPeerSettings } = await import('./usePeerToPeerSettings');

const CAMPAIGN_ID = 'a7f3c2d1';
const settings = buildSettings({ isPeerToPeerEnabled: true, liveFundraiserCount: 2 });

const axiosErrorWith = (message: string): AxiosError => {
  const error = new Error('Request failed with status code 403') as AxiosError;
  error.isAxiosError = true;
  error.response = { data: { message }, status: 403, statusText: '', headers: {}, config: {} } as never;
  return error;
};

beforeEach(() => {
  getPeerToPeerSettings.mockReset();
  updatePeerToPeerSettings.mockReset();
});

describe('usePeerToPeerSettings', () => {
  it('Load_NoCampaignId_ReportsMissingCampaignWithoutCallingTheApi', async () => {
    const { result } = renderHook(() => usePeerToPeerSettings(''));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.loadError).toBe('No campaign was selected.');
    expect(getPeerToPeerSettings).not.toHaveBeenCalled();
  });

  it('Load_ApiSucceeds_ExposesSettingsAndClearsError', async () => {
    getPeerToPeerSettings.mockResolvedValue(settings);

    const { result } = renderHook(() => usePeerToPeerSettings(CAMPAIGN_ID));

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.settings).toEqual(settings);
    expect(result.current.loadError).toBeNull();
    expect(getPeerToPeerSettings).toHaveBeenCalledWith(CAMPAIGN_ID);
  });

  it('Load_ApiFails_ShowsServerSentenceNotTransportDetail', async () => {
    getPeerToPeerSettings.mockRejectedValue(axiosErrorWith('You cannot manage this campaign.'));

    const { result } = renderHook(() => usePeerToPeerSettings(CAMPAIGN_ID));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.loadError).toBe('You cannot manage this campaign.');
    expect(result.current.loadError).not.toContain('status code');
    expect(result.current.settings).toBeNull();
  });

  it('Load_ApiFailsWithNoBody_ShowsOwnFallback', async () => {
    getPeerToPeerSettings.mockRejectedValue(new Error('The campaign settings could not be read.'));

    const { result } = renderHook(() => usePeerToPeerSettings(CAMPAIGN_ID));

    await waitFor(() => expect(result.current.loadError).not.toBeNull());
    expect(result.current.loadError).toBe('The campaign settings could not be read.');
  });

  it('Reload_AfterFailure_RefetchesAndRecovers', async () => {
    getPeerToPeerSettings
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockResolvedValueOnce(settings);

    const { result } = renderHook(() => usePeerToPeerSettings(CAMPAIGN_ID));

    await waitFor(() => expect(result.current.loadError).not.toBeNull());

    act(() => result.current.reload());

    await waitFor(() => expect(result.current.settings).toEqual(settings));
    expect(result.current.loadError).toBeNull();
    expect(getPeerToPeerSettings).toHaveBeenCalledTimes(2);
  });

  it('Save_Succeeds_ReturnsNoFailureAndRefreshesFromTheServer', async () => {
    const saved = buildSettings({ isPeerToPeerEnabled: true, allowTeams: true });
    getPeerToPeerSettings.mockResolvedValueOnce(settings).mockResolvedValueOnce(saved);
    updatePeerToPeerSettings.mockResolvedValue(undefined);

    const { result } = renderHook(() => usePeerToPeerSettings(CAMPAIGN_ID));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let failure: string | null = 'unset';
    await act(async () => {
      failure = await result.current.save(saved);
    });

    expect(failure).toBeNull();
    expect(updatePeerToPeerSettings).toHaveBeenCalledWith(CAMPAIGN_ID, saved);
    expect(result.current.settings).toEqual(saved);
    expect(result.current.isSaving).toBe(false);
  });

  it('Save_Fails_ReturnsMessageAndKeepsPreviousSettings', async () => {
    getPeerToPeerSettings.mockResolvedValue(settings);
    updatePeerToPeerSettings.mockRejectedValue(axiosErrorWith('This campaign has ended.'));

    const { result } = renderHook(() => usePeerToPeerSettings(CAMPAIGN_ID));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let failure: string | null = null;
    await act(async () => {
      failure = await result.current.save(buildSettings());
    });

    expect(failure).toBe('This campaign has ended.');
    expect(result.current.settings).toEqual(settings);
    expect(result.current.isSaving).toBe(false);
  });

  it('Load_UnmountedBeforeResponse_DoesNotSetState', async () => {
    let resolveLoad: (value: unknown) => void = () => undefined;
    getPeerToPeerSettings.mockReturnValue(
      new Promise((resolve) => {
        resolveLoad = resolve;
      }),
    );
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const { unmount } = renderHook(() => usePeerToPeerSettings(CAMPAIGN_ID));
    unmount();

    await act(async () => {
      resolveLoad(settings);
    });

    expect(consoleError).not.toHaveBeenCalled();
  });
});
