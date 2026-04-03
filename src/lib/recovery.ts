import type { RecoveryApproval } from '../types/workspace';

export function buildRecoveryMessage({
  ownerAddress,
  recoveryId,
  guardians,
  targetAddress,
  threshold,
  createdAt,
}: {
  ownerAddress: string;
  recoveryId: string;
  guardians: string[];
  targetAddress: string;
  threshold: number;
  createdAt: number;
}) {
  return [
    'NexusVault Recovery Approval',
    `Recovery ID: ${recoveryId}`,
    `Owner Wallet: ${ownerAddress}`,
    `Replacement Wallet: ${targetAddress}`,
    `Threshold: ${threshold} of ${guardians.length}`,
    `Issued At: ${new Date(createdAt).toISOString()}`,
  ].join('\n');
}

export function isThresholdSatisfied(
  approvals: RecoveryApproval[],
  threshold: number
) {
  const uniqueGuardians = new Set(
    approvals.map((approval) => approval.guardianAddress.toLowerCase())
  );

  return uniqueGuardians.size >= threshold;
}
