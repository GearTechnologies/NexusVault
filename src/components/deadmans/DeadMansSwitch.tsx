/**
 * DeadMansSwitch — configure, arm, and manage the digital inheritance switch.
 */

import { useState } from 'react';
import { useVaultStore } from '../../store/vault';
import {
  getLitClient,
  getSessionSigs,
  deployDeadMansSwitchAction,
  triggerDeadMansSwitch,
} from '../../lib/lit';

const INTERVAL_OPTIONS = [
  { days: 7, label: '7 days' },
  { days: 14, label: '14 days' },
  { days: 30, label: '30 days' },
];

function formatRelativeTime(ts: number): string {
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

/** Full dead man's switch configuration and status dashboard. */
export function DeadMansSwitch() {
  const signer = useVaultStore((s) => s.signer);
  const walletAddress = useVaultStore((s) => s.walletAddress);
  const switchArmed = useVaultStore((s) => s.switchArmed);
  const switchActionCid = useVaultStore((s) => s.switchActionCid);
  const heirAddress = useVaultStore((s) => s.heirAddress);
  const lastHeartbeat = useVaultStore((s) => s.lastHeartbeat);
  const heartbeatIntervalDays = useVaultStore((s) => s.heartbeatIntervalDays);
  const vaultIndexCid = useVaultStore((s) => s.vaultIndexCid);
  const configureSwitch = useVaultStore((s) => s.configureSwitch);
  const armSwitch = useVaultStore((s) => s.armSwitch);
  const disarmSwitch = useVaultStore((s) => s.disarmSwitch);
  const recordHeartbeat = useVaultStore((s) => s.recordHeartbeat);
  const setLoading = useVaultStore((s) => s.setLoading);
  const setError = useVaultStore((s) => s.setError);

  const [inputHeir, setInputHeir] = useState('');
  const [heirError, setHeirError] = useState('');
  const [intervalDays, setIntervalDays] = useState(7);
  const [triggerResult, setTriggerResult] = useState<string | null>(null);
  const [checkedIn, setCheckedIn] = useState(false);

  const validateAddress = (addr: string) => /^0x[0-9a-fA-F]{40}$/.test(addr);

  const handleDeploy = async () => {
    if (!validateAddress(inputHeir)) {
      setHeirError('Must be a valid 0x Ethereum address (42 chars)');
      return;
    }
    if (!signer || !walletAddress) {
      setError('Wallet not connected');
      return;
    }
    setLoading(true);
    setHeirError('');
    try {
      configureSwitch(inputHeir, intervalDays);
      const client = await getLitClient();
      const sessionSigs = await getSessionSigs(signer, client);
      const now = Math.floor(Date.now() / 1000);
      const result = await deployDeadMansSwitchAction(
        inputHeir,
        now,
        intervalDays * 86400,
        vaultIndexCid ?? 'no-vault-cid',
        client,
        sessionSigs
      );
      armSwitch(result.actionCid);
      recordHeartbeat();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deploy failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = () => {
    recordHeartbeat();
    setCheckedIn(true);
    setTimeout(() => setCheckedIn(false), 3000);
  };

  const handleTrigger = async () => {
    if (!signer || !switchActionCid) return;
    setLoading(true);
    try {
      const client = await getLitClient();
      const sessionSigs = await getSessionSigs(signer, client);
      const result = await triggerDeadMansSwitch(
        switchActionCid,
        client,
        sessionSigs
      );
      setTriggerResult(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Trigger failed');
    } finally {
      setLoading(false);
    }
  };

  const nextHeartbeatDays =
    lastHeartbeat !== null
      ? Math.max(
          0,
          Math.ceil(
            (lastHeartbeat + heartbeatIntervalDays * 86400 -
              Math.floor(Date.now() / 1000)) /
              86400
          )
        )
      : null;

  const shortAddr = (addr: string) =>
    `${addr.substring(0, 6)}…${addr.substring(addr.length - 4)}`;

  return (
    <div className="space-y-6">
      {/* Warning banner */}
      {switchArmed && (
        <div className="rounded-lg border border-amber-700 bg-amber-900/20 p-4">
          <p className="text-amber-300 text-sm">
            ⚠️ If you do not check in within{' '}
            <strong>{heartbeatIntervalDays} days</strong>, your designated heir{' '}
            <strong>{heirAddress ? shortAddr(heirAddress) : '—'}</strong> will
            receive access to the selected vault sections.
          </p>
        </div>
      )}

      {!switchArmed && (
        <div className="rounded-xl border border-gray-700 bg-gray-800 p-6 space-y-5">
          <h3 className="text-lg font-semibold text-gray-50">Configure Switch</h3>

          <div>
            <label className="block text-sm text-gray-400 mb-1" htmlFor="heir-address">
              Heir Wallet Address
            </label>
            <input
              id="heir-address"
              type="text"
              value={inputHeir}
              onChange={(e) => {
                setInputHeir(e.target.value);
                setHeirError('');
              }}
              placeholder="0x..."
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 font-mono placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              aria-label="Heir wallet address"
            />
            {heirError && (
              <p className="text-xs text-red-400 mt-1" role="alert">{heirError}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1" htmlFor="interval-select">
              Heartbeat Interval
            </label>
            <select
              id="interval-select"
              value={intervalDays}
              onChange={(e) => setIntervalDays(Number(e.target.value))}
              className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
              aria-label="Heartbeat interval"
            >
              {INTERVAL_OPTIONS.map((o) => (
                <option key={o.days} value={o.days}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-2">Vault Sections to Inherit</p>
            <div className="space-y-2">
              {['passwords', 'files', 'notes', 'contacts'].map((section) => (
                <label key={section} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded border-gray-600 bg-gray-900 text-indigo-500 focus:ring-indigo-500"
                    aria-label={`Include ${section} in inheritance`}
                  />
                  <span className="text-sm text-gray-300 capitalize">{section}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={() => void handleDeploy()}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors"
            aria-label="Deploy dead man's switch"
          >
            Deploy Switch
          </button>
        </div>
      )}

      {switchArmed && (
        <div className="rounded-xl border border-gray-700 bg-gray-800 p-6 space-y-5">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
            <h3 className="text-lg font-semibold text-gray-50">Switch Armed</h3>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400 text-xs">Last Heartbeat</p>
              <p className="text-gray-200">
                {lastHeartbeat !== null ? formatRelativeTime(lastHeartbeat) : '—'}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Next Required</p>
              <p className="text-gray-200">
                {nextHeartbeatDays !== null ? `${nextHeartbeatDays} days` : '—'}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Heir</p>
              <p className="font-mono text-gray-200">
                {heirAddress ? shortAddr(heirAddress) : '—'}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Interval</p>
              <p className="text-gray-200">{heartbeatIntervalDays} days</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleCheckIn}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors"
              aria-label="Record heartbeat check-in"
            >
              {checkedIn ? '✓ Checked In!' : 'Check In Now'}
            </button>
            <button
              onClick={() => void handleTrigger()}
              className="border border-amber-700 hover:border-amber-500 text-amber-400 hover:text-amber-300 font-medium rounded-lg px-4 py-2 text-sm transition-colors"
              aria-label="Trigger dead man's switch (demo)"
            >
              Trigger Switch (Demo)
            </button>
            <button
              onClick={disarmSwitch}
              className="border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white rounded-lg px-4 py-2 text-sm transition-colors"
              aria-label="Disarm dead man's switch"
            >
              Disarm Switch
            </button>
          </div>

          {triggerResult && (
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
              <p className="text-sm text-gray-300">{triggerResult}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
