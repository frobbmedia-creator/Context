import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getTrialStatus, checkProAccess } from '../src/trial.js';

describe('trial', () => {
  it('checkProAccess returns allowed object with status', async () => {
    const result = await checkProAccess('watch');
    assert.ok(typeof result.allowed === 'boolean');
    assert.ok(result.status);
    // On first run in a clean env it starts the trial
    assert.ok(['trial-started', 'trial-active', 'licensed', 'trial-expired'].includes(result.status));
  });

  it('getTrialStatus returns a known status shape', async () => {
    const status = await getTrialStatus();
    assert.ok(status.status);
    assert.ok(['none', 'active', 'expired', 'started'].includes(status.status) || status.status === 'active');
  });
});
