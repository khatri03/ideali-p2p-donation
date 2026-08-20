import { describe, expect, it } from 'vitest';
import { switchOffMessage } from './peerToPeerCopy';

describe('switchOffMessage', () => {
  it('SwitchOffMessage_NoLivePages_SaysNothingIsDeleted', () => {
    const message = switchOffMessage(0);

    expect(message).toContain('Nothing is deleted');
    expect(message).not.toContain('will stop being reachable');
  });

  it('SwitchOffMessage_OneLivePage_UsesSingular', () => {
    expect(switchOffMessage(1)).toContain('1 supporter page will stop being reachable');
  });

  it('SwitchOffMessage_ManyLivePages_UsesPluralWithCount', () => {
    expect(switchOffMessage(7)).toContain('7 supporter pages will stop being reachable');
  });

  it('SwitchOffMessage_AnyLivePages_PromisesRestoreOnTurningBackOn', () => {
    expect(switchOffMessage(3)).toContain('turning this back on restores them');
  });
});
