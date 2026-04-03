/**
 * DeadMansSwitch — configure, arm, and monitor a live heartbeat policy.
 */

import { useMemo, useState } from 'react';
import { useVaultStore } from '../../store/vault';
import { useWallet } from '../../hooks/useWallet';

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

/** Heartbeat-based inheritance policy dashboard. */
export function DeadMansSwitch() {
  const { walletAddress } = useWallet();
  const switchArmed = useVaultStore((s) => s.switchArmed);
  const heirAddress = useVaultStore((s) => s.heirAddress);
  const lastHeartbeat = useVaultStore((s) => s.lastHeartbeat);
  const heartbeatIntervalDays = useVaultStore((s) => s.heartbeatIntervalDays);
  const vaultIndexCid = useVaultStore((s) => s.vaultIndexCid);
  const configureSwitch = useVaultStore((s) => s.configureSwitch);
  const armSwitch = useVaultStore((s) => s.armSwitch);
  const disarmSwitch = useVaultStore((s) => s.disarmSwitch);
  const recordHeartbeat = useVaultStore((s) => s.recordHeartbeat);
  const setError = useVaultStore((s) => s.setError);

  const [inputHeir, setInputHeir] = useState('');
  const [heirError, setHeirError] = useState('');
  const [intervalDays, setIntervalDays] = useState(7);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [checkedIn, setCheckedIn] = useState(false);

  const validateAddress = (addr: string) => /^0x[0-9a-fA-F]{40}$/.test(addr);

  const releaseEligible = useMemo(() => {
    if (!lastHeartbeat) return false;
    return (
      Math.floor(Date.now() / 1000) >=
      lastHeartbeat + heartbeatIntervalDays * 86400
    );
  }, [heartbeatIntervalDays, lastHeartbeat]);

  const handleArmSwitch = () => {
    if (!walletAddress) {
      setError('Connect an Ethereum wallet before arming the switch.');
      return;
    }
    if (!vaultIndexCid) {
      setError('Create and save at least one vault entry before arming the switch.');
      return;
    }
    if (!validateAddress(inputHeir)) {
      setHeirError('Must be a valid 0x Ethereum address (42 chars)');
      return;
    }

    configureSwitch(inputHeir, intervalDays);
    armSwitch();
    recordHeartbeat();
    setHeirError('');
    setStatusMessage(
      'Heartbeat policy armed. Eligibility will update automatically if check-ins are missed.'
    );
  };

  const handleCheckIn = () => {
    recordHeartbeat();
    setCheckedIn(true);
    setStatusMessage('Heartbeat recorded successfully.');
    setTimeout(() => setCheckedIn(false), 3000);
  };

  const handleEvaluateRelease = () => {
    if (!switchArmed || !lastHeartbeat || !heirAddress) {
      return;
    }

    if (releaseEligible) {
      setStatusMessage(
        `Release window is open for heir ${heirAddress}. The heartbeat interval has expired.`
      );
      return;
    }

    setStatusMessage('Heartbeat is still valid. Release conditions have not been met.');
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
      {switchArmed && (
        <div
          className={`rounded-lg p-4 ${
            releaseEligible
              ? 'border border-red-700 bg-red-900/20'
              : 'border border-amber-700 bg-amber-900/20'
          }`}
        >
          <p
            className={`text-sm ${
              releaseEligible ? 'text-red-200' : 'text-amber-300'
            }`}
          >
            {releaseEligible
              ? `Heartbeat expired. The configured release window for ${heirAddress ? shortAddr(heirAddress) : 'your heir'} is now open.`
              : `If you do not check in within ${heartbeatIntervalDays} days, ${heirAddress ? shortAddr(heirAddress) : 'your heir'} becomes eligible under this policy.`}
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
              <p className="text-xs text-red-400 mt-1" role="alert">
                {heirError}
              </p>
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
              {INTERVAL_OPTIONS.map((option) => (
                <option key={option.days} value={option.days}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-lg border border-gray-700 bg-gray-900 p-4">
            <p className="text-sm text-gray-300">
              The switch arms a live heartbeat policy for your saved vault index
              (`{vaultIndexCid ?? 'not saved yet'}`).
            </p>
          </div>

          <button
            onClick={handleArmSwitch}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors"
            aria-label="Arm dead man's switch"
          >
            Arm Switch
          </button>
        </div>
      )}

      {switchArmed && (
        <div className="rounded-xl border border-gray-700 bg-gray-800 p-6 space-y-5">
          <div className="flex items-center gap-3">
            <span
              className={`w-3 h-3 rounded-full ${releaseEligible ? 'bg-red-400' : 'bg-emerald-400 animate-pulse'}`}
              aria-hidden="true"
            />
            <h3 className="text-lg font-semibold text-gray-50">Switch Armed</h3>
          </div>

          <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
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
              {checkedIn ? 'Checked In' : 'Check In Now'}
            </button>
            <button
              onClick={handleEvaluateRelease}
              className="border border-amber-700 hover:border-amber-500 text-amber-400 hover:text-amber-300 font-medium rounded-lg px-4 py-2 text-sm transition-colors"
              aria-label="Evaluate release eligibility"
            >
              Evaluate Eligibility
            </button>
            <button
              onClick={disarmSwitch}
              className="border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white rounded-lg px-4 py-2 text-sm transition-colors"
              aria-label="Disarm dead man's switch"
            >
              Disarm Switch
            </button>
          </div>

          {statusMessage && (
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
              <p className="text-sm text-gray-300">{statusMessage}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
