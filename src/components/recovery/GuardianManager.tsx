/**
 * GuardianManager — configure social recovery guardians and threshold.
 */

import { useState } from 'react';
import { useVaultStore } from '../../store/vault';
import { getLitClient, getSessionSigs, setupSocialRecovery } from '../../lib/lit';

/** Manages guardian addresses and the recovery threshold. */
export function GuardianManager() {
  const signer = useVaultStore((s) => s.signer);
  const walletAddress = useVaultStore((s) => s.walletAddress);
  const guardians = useVaultStore((s) => s.guardians);
  const threshold = useVaultStore((s) => s.threshold);
  const recoveryId = useVaultStore((s) => s.recoveryId);
  const pkpPublicKey = useVaultStore((s) => s.pkpPublicKey);
  const setGuardians = useVaultStore((s) => s.setGuardians);
  const setRecovery = useVaultStore((s) => s.setRecovery);
  const setLoading = useVaultStore((s) => s.setLoading);
  const setError = useVaultStore((s) => s.setError);

  const [inputAddress, setInputAddress] = useState('');
  const [addressError, setAddressError] = useState('');
  const [success, setSuccess] = useState(false);

  const validateAddress = (addr: string) => /^0x[0-9a-fA-F]{40}$/.test(addr);

  const handleAddGuardian = () => {
    if (!validateAddress(inputAddress)) {
      setAddressError('Must be a valid 0x Ethereum address (42 chars)');
      return;
    }
    if (guardians.includes(inputAddress)) {
      setAddressError('Guardian already added');
      return;
    }
    setGuardians([...guardians, inputAddress], threshold);
    setInputAddress('');
    setAddressError('');
  };

  const handleRemoveGuardian = (addr: string) => {
    const updated = guardians.filter((g) => g !== addr);
    setGuardians(updated, Math.min(threshold, Math.max(1, updated.length)));
  };

  const handleConfigureRecovery = async () => {
    if (!signer || !walletAddress) {
      setError('Wallet not connected');
      return;
    }
    if (guardians.length < 2) {
      setError('At least 2 guardians required');
      return;
    }
    setLoading(true);
    try {
      const client = await getLitClient();
      const sessionSigs = await getSessionSigs(signer, client);
      const result = await setupSocialRecovery(
        guardians,
        threshold,
        walletAddress,
        client,
        sessionSigs
      );
      setRecovery(result.recoveryId, result.pkpPublicKey);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Recovery setup failed');
    } finally {
      setLoading(false);
    }
  };

  const maxThreshold = Math.max(1, guardians.length);

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800 p-6 space-y-5">
      <h3 className="text-lg font-semibold text-gray-50">Guardian Setup</h3>

      <div className="flex items-center gap-2">
        <span
          className={`w-2.5 h-2.5 rounded-full ${recoveryId ? 'bg-emerald-400' : 'bg-gray-500'}`}
          aria-hidden="true"
        />
        <span className="text-sm text-gray-400">
          {recoveryId
            ? `Active — ${threshold} of ${guardians.length} guardians required`
            : 'Recovery not configured'}
        </span>
      </div>

      <div className="space-y-2">
        <label className="block text-sm text-gray-400" htmlFor="guardian-input">
          Add Guardian Address
        </label>
        <div className="flex gap-2">
          <input
            id="guardian-input"
            type="text"
            value={inputAddress}
            onChange={(e) => {
              setInputAddress(e.target.value);
              setAddressError('');
            }}
            placeholder="0x..."
            className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 font-mono placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            aria-label="Guardian Ethereum address"
          />
          <button
            onClick={handleAddGuardian}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors"
            aria-label="Add guardian"
          >
            Add
          </button>
        </div>
        {addressError && (
          <p className="text-xs text-red-400" role="alert">{addressError}</p>
        )}
      </div>

      {guardians.length > 0 && (
        <ul className="space-y-2">
          {guardians.map((addr) => (
            <li key={addr} className="flex items-center justify-between bg-gray-900 rounded-lg px-3 py-2">
              <span className="font-mono text-sm text-gray-300">
                {addr.substring(0, 10)}…{addr.substring(addr.length - 6)}
              </span>
              <button
                onClick={() => handleRemoveGuardian(addr)}
                className="text-red-400 hover:text-red-300 text-xs"
                aria-label={`Remove guardian ${addr}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {guardians.length > 0 && (
        <div>
          <label className="block text-sm text-gray-400 mb-1" htmlFor="threshold-select">
            Require guardians to recover
          </label>
          <select
            id="threshold-select"
            value={threshold}
            onChange={(e) => setGuardians(guardians, Number(e.target.value))}
            className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
            aria-label="Guardian threshold"
          >
            {Array.from({ length: maxThreshold }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} of {guardians.length}
              </option>
            ))}
          </select>
        </div>
      )}

      <button
        onClick={handleConfigureRecovery}
        disabled={guardians.length < 2}
        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors"
        aria-label="Configure social recovery"
      >
        Configure Recovery
      </button>

      {success && pkpPublicKey && (
        <div className="bg-emerald-900/30 border border-emerald-700 rounded-lg p-4 space-y-1">
          <p className="text-xs text-emerald-400 font-medium">Recovery configured!</p>
          <p className="text-xs text-gray-400">
            PKP: <span className="font-mono">{pkpPublicKey.substring(0, 20)}…</span>
          </p>
          <p className="text-xs text-gray-400">
            ID: <span className="font-mono">{recoveryId}</span>
          </p>
        </div>
      )}
    </div>
  );
}
