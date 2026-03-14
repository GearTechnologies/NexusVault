/**
 * RecoveryFlow — simulated recovery flow for the hackathon demo.
 */

import { useState } from 'react';
import { useVaultStore } from '../../store/vault';

type Step = 'idle' | 'lost' | 'collect' | 'reassembled';

/** Step-by-step recovery simulation UI. */
export function RecoveryFlow() {
  const recoveryId = useVaultStore((s) => s.recoveryId);
  const guardians = useVaultStore((s) => s.guardians);
  const threshold = useVaultStore((s) => s.threshold);
  const clearWallet = useVaultStore((s) => s.clearWallet);
  const setError = useVaultStore((s) => s.setError);

  const [step, setStep] = useState<Step>('idle');
  const [signatures, setSignatures] = useState<string[]>([]);
  const [sigInput, setSigInput] = useState('');

  const handleSimulateLoss = () => {
    clearWallet();
    setStep('lost');
  };

  const handleAddSig = () => {
    if (!sigInput) return;
    setSignatures((prev) => [...prev, sigInput]);
    setSigInput('');
  };

  const handleReassemble = () => {
    if (signatures.length < threshold) {
      setError(`Need ${threshold} guardian signatures (have ${signatures.length})`);
      return;
    }
    setStep('reassembled');
  };

  const STEPS = [
    { key: 'idle', label: 'Connected', done: step !== 'idle' },
    { key: 'lost', label: 'Device Lost', done: step === 'collect' || step === 'reassembled' },
    { key: 'collect', label: 'Collect Sigs', done: step === 'reassembled' },
    { key: 'reassembled', label: 'Access Restored', done: step === 'reassembled' },
  ];

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800 p-6 space-y-5">
      <h3 className="text-lg font-semibold text-gray-50">Recovery Flow</h3>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, idx) => (
          <div key={s.key} className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                s.done
                  ? 'bg-emerald-500 text-white'
                  : step === s.key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-400'
              }`}
              aria-label={`Step ${idx + 1}: ${s.label}`}
            >
              {s.done ? '✓' : idx + 1}
            </div>
            <span className="text-xs text-gray-400 hidden sm:inline">{s.label}</span>
            {idx < STEPS.length - 1 && (
              <div className="w-4 h-px bg-gray-600 mx-1" aria-hidden="true" />
            )}
          </div>
        ))}
      </div>

      {!recoveryId && (
        <p className="text-sm text-amber-400 bg-amber-900/20 border border-amber-800 rounded-lg p-3">
          Configure recovery in the Guardian Setup panel first.
        </p>
      )}

      {step === 'idle' && recoveryId && (
        <button
          onClick={handleSimulateLoss}
          className="w-full border border-red-700 hover:border-red-500 text-red-400 hover:text-red-300 font-medium rounded-lg px-4 py-2 text-sm transition-colors"
          aria-label="Simulate device loss"
        >
          Simulate Device Loss
        </button>
      )}

      {step === 'lost' && (
        <div className="space-y-3">
          <p className="text-sm text-red-300 bg-red-900/20 border border-red-800 rounded-lg p-3">
            Wallet cleared — collecting guardian signatures to restore access.
          </p>
          <button
            onClick={() => setStep('collect')}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors"
            aria-label="Start collecting guardian signatures"
          >
            Recover Access
          </button>
        </div>
      )}

      {step === 'collect' && (
        <div className="space-y-3">
          <p className="text-xs text-gray-400">
            Collect {threshold} of {guardians.length} guardian signatures to reassemble access.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={sigInput}
              onChange={(e) => setSigInput(e.target.value)}
              placeholder="Paste guardian signature..."
              className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 font-mono placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              aria-label="Guardian signature input"
            />
            <button
              onClick={handleAddSig}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg px-3 py-2 text-sm transition-colors"
              aria-label="Add signature"
            >
              Add
            </button>
          </div>
          <p className="text-xs text-gray-500">
            {signatures.length} of {threshold} collected
          </p>
          <button
            onClick={handleReassemble}
            disabled={signatures.length < threshold}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors"
            aria-label="Reassemble vault key"
          >
            Reassemble Key
          </button>
        </div>
      )}

      {step === 'reassembled' && (
        <div className="bg-emerald-900/30 border border-emerald-700 rounded-lg p-4">
          <p className="text-emerald-400 font-medium text-sm">
            ✓ Access restored! Reconnect your wallet to continue.
          </p>
        </div>
      )}
    </div>
  );
}
