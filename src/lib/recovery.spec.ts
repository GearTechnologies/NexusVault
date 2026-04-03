import { describe, expect, it } from 'vitest';
import { buildRecoveryMessage, isThresholdSatisfied } from './recovery';

describe('buildRecoveryMessage', () => {
  it('creates a stable recovery message', () => {
    const message = buildRecoveryMessage({
      ownerAddress: '0x1234',
      recoveryId: 'rec-1',
      guardians: ['0xa', '0xb'],
      targetAddress: '0x9999',
      threshold: 2,
      createdAt: Date.UTC(2025, 0, 1),
    });

    expect(message).toContain('Recovery ID: rec-1');
    expect(message).toContain('Replacement Wallet: 0x9999');
    expect(message).toContain('Threshold: 2 of 2');
  });
});

describe('isThresholdSatisfied', () => {
  it('counts unique guardian approvals only once', () => {
    expect(
      isThresholdSatisfied(
        [
          {
            guardianAddress: '0xabc',
            signature: '0x1',
            approvedAt: 1,
          },
          {
            guardianAddress: '0xAbC',
            signature: '0x2',
            approvedAt: 2,
          },
          {
            guardianAddress: '0xdef',
            signature: '0x3',
            approvedAt: 3,
          },
        ],
        2
      )
    ).toBe(true);
  });
});
