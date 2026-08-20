import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PeerToPeerSettingsDetail } from 'app/interface/donationInter/peerToPeerDto';
import { buildSettings } from './peerToPeerTestFactory';
import { usePeerToPeerSettingsForm } from './usePeerToPeerSettingsForm';

interface FormProps {
  current: PeerToPeerSettingsDetail;
  saving: boolean;
}

const renderForm = (settings = buildSettings(), isSaving = false) =>
  renderHook(({ current, saving }: FormProps) => usePeerToPeerSettingsForm(current, saving), {
    initialProps: { current: settings, saving: isSaving },
  });

describe('usePeerToPeerSettingsForm', () => {
  it('Form_GoalBlank_ValidatesAndSendsNull', () => {
    const { result } = renderForm(buildSettings({ defaultPersonalGoal: 250 }));

    act(() => result.current.setGoalInput(''));

    let isValid = false;
    act(() => {
      isValid = result.current.validate();
    });

    expect(isValid).toBe(true);
    expect(result.current.goalError).toBeNull();
    expect(result.current.buildValues().defaultPersonalGoal).toBeNull();
  });

  it('Form_GoalZero_FailsValidationWithMessage', () => {
    const { result } = renderForm();

    act(() => result.current.setGoalInput('0'));

    let isValid = true;
    act(() => {
      isValid = result.current.validate();
    });

    expect(isValid).toBe(false);
    expect(result.current.goalError).toBe('Enter an amount greater than zero, or leave this blank.');
  });

  it('Form_GoalNegative_FailsValidation', () => {
    const { result } = renderForm();

    act(() => result.current.setGoalInput('-40'));
    act(() => {
      result.current.validate();
    });

    expect(result.current.goalError).not.toBeNull();
  });

  it('Form_GoalNotANumber_FailsValidation', () => {
    const { result } = renderForm();

    act(() => result.current.setGoalInput('ten pounds'));
    act(() => {
      result.current.validate();
    });

    expect(result.current.goalError).not.toBeNull();
  });

  it('Form_GoalValid_BuildsNumericValue', () => {
    const { result } = renderForm();

    act(() => result.current.setGoalInput('  500  '));
    act(() => {
      result.current.validate();
    });

    expect(result.current.goalError).toBeNull();
    expect(result.current.buildValues().defaultPersonalGoal).toBe(500);
  });

  it('Form_CampaignCannotEnableAndIsOff_LocksTheSwitch', () => {
    const { result } = renderForm(buildSettings({ canEnable: false, isPeerToPeerEnabled: false }));

    expect(result.current.isSwitchLocked).toBe(true);
  });

  it('Form_AlreadyEnabledButNoLongerEligible_LeavesSwitchUnlockedSoItCanBeTurnedOff', () => {
    const { result } = renderForm(buildSettings({ canEnable: false, isPeerToPeerEnabled: true }));

    expect(result.current.isSwitchLocked).toBe(false);
  });

  it('Form_Disabled_LocksTheDetailFields', () => {
    const { result } = renderForm(buildSettings({ isPeerToPeerEnabled: false }));

    expect(result.current.areDetailsLocked).toBe(true);
  });

  it('Form_Saving_LocksTheDetailFields', () => {
    const { result } = renderForm(buildSettings({ isPeerToPeerEnabled: true }), true);

    expect(result.current.areDetailsLocked).toBe(true);
  });

  it('Form_EnabledThenTurnedOff_ReportsSwitchingOff', () => {
    const { result } = renderForm(buildSettings({ isPeerToPeerEnabled: true }));

    expect(result.current.isSwitchingOff()).toBe(false);

    act(() => result.current.setIsEnabled(false));

    expect(result.current.isSwitchingOff()).toBe(true);
  });

  it('Form_DisabledThenTurnedOn_DoesNotReportSwitchingOff', () => {
    const { result } = renderForm(buildSettings({ isPeerToPeerEnabled: false }));

    act(() => result.current.setIsEnabled(true));

    expect(result.current.isSwitchingOff()).toBe(false);
  });

  it('Form_SettingsReplacedAfterSave_ResetsEditsAndClearsError', () => {
    const { result, rerender } = renderForm();

    act(() => result.current.setGoalInput('0'));
    act(() => {
      result.current.validate();
    });
    expect(result.current.goalError).not.toBeNull();

    rerender({
      current: buildSettings({
        isPeerToPeerEnabled: true,
        defaultPersonalGoal: 120,
        allowTeams: true,
      }),
      saving: false,
    });

    expect(result.current.goalError).toBeNull();
    expect(result.current.goalInput).toBe('120');
    expect(result.current.isEnabled).toBe(true);
    expect(result.current.allowTeams).toBe(true);
  });
});
