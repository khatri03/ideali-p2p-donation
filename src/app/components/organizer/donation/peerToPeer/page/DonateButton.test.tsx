import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import DonateButton from './DonateButton';
import { DONATE_CTA, DONATE_CTA_WITHOUT_NAME } from './pageCopy';

const LONG_NAME = 'Raise fund for Osama to test PAD';

describe('DonateButton', () => {
  /**
   * A supporter may name their page anything up to eighty characters. The button that takes a donor to
   * the payment screen must stay inside its panel whatever they chose, because a label cut off at both
   * edges leaves a donor unsure what the button does.
   */
  it('Donate_LabelLongerThanTheButton_WrapsRatherThanRunningOutOfThePanel', () => {
    render(<DonateButton label={`Donate to ${LONG_NAME}`} onClick={vi.fn()} />);

    const style = getComputedStyle(screen.getByRole('button'));
    expect(style.whiteSpace).toBe('normal');
    expect(style.wordBreak).toBe('break-word');
  });

  /**
   * Wrapping is only safe if the button may grow. A fixed height would move the overflow from the sides
   * to the bottom, where the second line sits outside the coloured area instead.
   */
  it('Donate_LabelWrapsToASecondLine_ButtonGrowsInsteadOfClipping', () => {
    render(<DonateButton label={`Donate to ${LONG_NAME}`} onClick={vi.fn()} />);

    expect(getComputedStyle(screen.getByRole('button')).height).toBe('auto');
  });

  /** The one action the page exists for reaches the caller that opens the payment screen. */
  it('Donate_Pressed_TellsTheCaller', async () => {
    const onDonate = vi.fn();
    render(<DonateButton label={DONATE_CTA('Sarah Khan')} onClick={onDonate} />);

    await userEvent.click(screen.getByRole('button', { name: 'Donate to Sarah Khan' }));

    expect(onDonate).toHaveBeenCalledTimes(1);
  });

  /**
   * A team with nobody on it has nobody to pass a donation to, so the button refuses the press rather
   * than opening a payment screen that cannot complete.
   */
  it('Donate_NothingToDonateTo_RefusesThePress', async () => {
    const onDonate = vi.fn();
    render(<DonateButton label={DONATE_CTA_WITHOUT_NAME} onClick={onDonate} isDisabled />);

    const button = screen.getByRole('button', { name: DONATE_CTA_WITHOUT_NAME });
    expect(button).toBeDisabled();
    expect(getComputedStyle(button).cursor).toBe('not-allowed');

    await userEvent.click(button);
    expect(onDonate).not.toHaveBeenCalled();
  });
});
