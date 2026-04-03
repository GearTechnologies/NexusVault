import { describe, expect, it } from 'vitest';
import { evaluateContinuity } from './continuity';

describe('evaluateContinuity', () => {
  it('returns waiting status when no heartbeat exists', () => {
    expect(evaluateContinuity(null, 7, 1_700_000_000)).toEqual({
      eligible: false,
      daysRemaining: null,
      expiresAt: null,
      label: 'Awaiting first heartbeat',
    });
  });

  it('returns heartbeat valid before expiry', () => {
    const lastHeartbeat = 1_700_000_000;
    const result = evaluateContinuity(lastHeartbeat, 7, lastHeartbeat + 60 * 60 * 24 * 3);

    expect(result.eligible).toBe(false);
    expect(result.label).toBe('Heartbeat valid');
    expect(result.daysRemaining).toBe(4);
  });

  it('opens release window after expiry', () => {
    const lastHeartbeat = 1_700_000_000;
    const result = evaluateContinuity(lastHeartbeat, 7, lastHeartbeat + 60 * 60 * 24 * 8);

    expect(result.eligible).toBe(true);
    expect(result.daysRemaining).toBe(0);
    expect(result.label).toBe('Release window open');
  });
});
