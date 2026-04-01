/**
 * RecoveryFlow — collects real guardian approvals for a recovery request.
 */

import { useMemo, useState } from 'react';
import { recoverMessageAddress } from 'viem';
import { useVaultStore } from '../../store/vault';
import { useWallet } from '../../hooks/useWallet';

function buildRecoveryMessage({
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

/** Collect and verify guardian approvals for a recovery request. */
export function RecoveryFlow() {
  const { walletAddress } = useWallet();
  const guardians = useVaultStore((s) => s.guardians);
  const threshold = useVaultStore((s) => s.threshold);
  const recoveryId = useVaultStore((s) => s.recoveryId);
  const recoveryRequest = useVaultStore((s) => s.recoveryRequest);
  const setRecoveryRequest = useVaultStore((s) => s.setRecoveryRequest);
  const addRecoveryApproval = useVaultStore((s) => s.addRecoveryApproval);
  const clearRecoveryRequest = useVaultStore((s) => s.clearRecoveryRequest);
  const setError = useVaultStore((s) => s.setError);

  const [replacementAddress, setReplacementAddress] = useState('');
  const [signatureInput, setSignatureInput] = useState('');
  const [requestError, setRequestError] = useState('');

  const normalizedGuardians = useMemo(
    () => new Set(guardians.map((address) => address.toLowerCase())),
    [guardians]
  );

  const approvalCount = recoveryRequest?.approvals.length ?? 0;
  const isApproved = approvalCount >= threshold;

  const validateAddress = (addr: string) => /^0x[0-9a-fA-F]{40}$/.test(addr);

  const handleCreateRequest = () => {
    if (!walletAddress || !recoveryId) {
      setError('Configure recovery with a connected wallet before requesting approval.');
      return;
    }

    if (!validateAddress(replacementAddress)) {
      setRequestError('Enter a valid replacement Ethereum address.');
      return;
    }

    if (replacementAddress.toLowerCase() === walletAddress.toLowerCase()) {
      setRequestError('Replacement wallet must be different from the current wallet.');
      return;
    }

    const createdAt = Date.now();
    setRecoveryRequest({
      createdAt,
      targetAddress: replacementAddress,
      message: buildRecoveryMessage({
        ownerAddress: walletAddress,
        recoveryId,
        guardians,
        targetAddress: replacementAddress,
        threshold,
        createdAt,
      }),
      approvals: [],
    });
    setRequestError('');
    setSignatureInput('');
  };

  const handleAddApproval = async () => {
    if (!recoveryRequest || !signatureInput.trim()) {
      return;
    }

    try {
      const guardianAddress = await recoverMessageAddress({
        message: recoveryRequest.message,
        signature: signatureInput.trim() as `0x${string}`,
      });

      if (!normalizedGuardians.has(guardianAddress.toLowerCase())) {
        throw new Error('That signature was not produced by a configured guardian.');
      }

      addRecoveryApproval({
        guardianAddress,
        signature: signatureInput.trim(),
        approvedAt: Date.now(),
      });
      setSignatureInput('');
      setRequestError('');
    } catch (error) {
      setRequestError(
        error instanceof Error
          ? error.message
          : 'Unable to verify the guardian signature.'
      );
    }
  };

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800 p-6 space-y-5">
      <h3 className="text-lg font-semibold text-gray-50">Recovery Approval</h3>

      {!recoveryId && (
        <p className="text-sm text-amber-400 bg-amber-900/20 border border-amber-800 rounded-lg p-3">
          Configure recovery in the Guardian Setup panel first.
        </p>
      )}

      {recoveryId && !recoveryRequest && (
        <div className="space-y-3">
          <p className="text-sm text-gray-400">
            Create a recovery request for the replacement wallet, then collect signed
            approvals from your guardians.
          </p>
          <div>
            <label className="block text-sm text-gray-400 mb-1" htmlFor="replacement-wallet">
              Replacement Wallet
            </label>
            <input
              id="replacement-wallet"
              type="text"
              value={replacementAddress}
              onChange={(event) => {
                setReplacementAddress(event.target.value);
                setRequestError('');
              }}
              placeholder="0x..."
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 font-mono placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              aria-label="Replacement wallet address"
            />
          </div>
          <button
            onClick={handleCreateRequest}
            disabled={!recoveryId}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors"
            aria-label="Create recovery request"
          >
            Create Recovery Request
          </button>
        </div>
      )}

      {recoveryRequest && (
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-700 bg-gray-900 p-4 space-y-2">
            <p className="text-xs text-gray-400">Recovery message to sign</p>
            <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap break-all">
              {recoveryRequest.message}
            </pre>
          </div>

          <div className="rounded-lg border border-gray-700 bg-gray-900 p-4 space-y-2">
            <p className="text-xs text-gray-400">Status</p>
            <p className="text-sm text-gray-200">
              {approvalCount} of {threshold} required guardian approvals verified
            </p>
            <p className="text-xs text-gray-500">
              Replacement wallet:{' '}
              <span className="font-mono">{recoveryRequest.targetAddress}</span>
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm text-gray-400" htmlFor="guardian-signature">
              Guardian Signature
            </label>
            <div className="flex gap-2">
              <input
                id="guardian-signature"
                type="text"
                value={signatureInput}
                onChange={(event) => {
                  setSignatureInput(event.target.value);
                  setRequestError('');
                }}
                placeholder="0x..."
                className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 font-mono placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                aria-label="Guardian signature"
              />
              <button
                onClick={() => void handleAddApproval()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg px-3 py-2 text-sm transition-colors"
                aria-label="Verify guardian signature"
              >
                Verify
              </button>
            </div>
          </div>

          {recoveryRequest.approvals.length > 0 && (
            <ul className="space-y-2">
              {recoveryRequest.approvals.map((approval) => (
                <li
                  key={approval.guardianAddress}
                  className="flex items-center justify-between rounded-lg bg-gray-900 px-3 py-2"
                >
                  <span className="font-mono text-sm text-gray-300">
                    {approval.guardianAddress.substring(0, 10)}…
                    {approval.guardianAddress.substring(
                      approval.guardianAddress.length - 6
                    )}
                  </span>
                  <span className="text-xs text-emerald-400">Verified</span>
                </li>
              ))}
            </ul>
          )}

          <div className="flex gap-3">
            <button
              onClick={clearRecoveryRequest}
              className="border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white rounded-lg px-4 py-2 text-sm transition-colors"
              aria-label="Reset recovery request"
            >
              Reset Request
            </button>
          </div>
        </div>
      )}

      {requestError && (
        <p className="text-xs text-red-400" role="alert">
          {requestError}
        </p>
      )}

      {isApproved && recoveryRequest && (
        <div className="bg-emerald-900/30 border border-emerald-700 rounded-lg p-4">
          <p className="text-emerald-400 font-medium text-sm">
            Guardian threshold reached for {recoveryRequest.targetAddress}.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Keep this signed approval bundle with your recovery records. The
            signatures can be re-verified against the request message at any time.
          </p>
        </div>
      )}
    </div>
  );
}
