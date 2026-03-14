/**
 * DelegationManager — list, grant, and revoke UCAN delegations.
 */

import { useState } from 'react';
import { useVaultStore } from '../../store/vault';
import { useVault } from '../../hooks/useVault';
import type { DelegationRecord } from '../../lib/storacha';

interface DelegationRowProps {
  entryLabel: string;
  entryId: string;
  record: DelegationRecord;
  onRevoke: (entryId: string, recipientDid: string) => void;
}

function DelegationRow({ entryLabel, entryId, record, onRevoke }: DelegationRowProps) {
  const now = Math.floor(Date.now() / 1000);
  const secondsLeft = record.expiresAt - now;
  const expired = secondsLeft <= 0;

  const formatTimeLeft = () => {
    if (expired) return 'Expired';
    const hours = Math.floor(secondsLeft / 3600);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d left`;
    if (hours > 0) return `${hours}h left`;
    return `${Math.floor(secondsLeft / 60)}m left`;
  };

  return (
    <li className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
      <div className="space-y-0.5 min-w-0">
        <p className="text-sm font-medium text-gray-200 truncate">{entryLabel}</p>
        <p className="text-xs text-gray-500 font-mono truncate">
          {record.recipientDid.substring(0, 20)}…
        </p>
      </div>
      <div className="flex items-center gap-3 ml-3 shrink-0">
        <span
          className={`text-xs px-2 py-0.5 rounded ${
            expired
              ? 'bg-red-900/40 text-red-400'
              : 'bg-gray-700 text-gray-400'
          }`}
        >
          {formatTimeLeft()}
        </span>
        <button
          onClick={() => onRevoke(entryId, record.recipientDid)}
          className="text-xs text-red-400 hover:text-red-300 transition-colors"
          aria-label={`Revoke delegation to ${record.recipientDid}`}
        >
          Revoke
        </button>
      </div>
    </li>
  );
}

/** Manages all delegations across vault entries. */
export function DelegationManager() {
  const entries = useVaultStore((s) => s.entries);
  const updateEntry = useVaultStore((s) => s.updateEntry);
  const { delegateAccess, saveVaultIndex } = useVault();

  const [selectedEntryId, setSelectedEntryId] = useState('');
  const [recipientDid, setRecipientDid] = useState('');
  const [expiry, setExpiry] = useState('24');
  const [grantedToken, setGrantedToken] = useState<string | null>(null);

  const allDelegations = entries.flatMap((e) =>
    (e.delegations ?? []).map((d) => ({ entry: e, record: d }))
  );

  const handleRevoke = async (entryId: string, recipientDid: string) => {
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) return;
    const updated = entry.delegations.filter((d) => d.recipientDid !== recipientDid);
    updateEntry(entryId, { delegations: updated });
    await saveVaultIndex();
  };

  const handleGrant = async () => {
    if (!selectedEntryId || !recipientDid) return;
    const token = await delegateAccess(selectedEntryId, recipientDid, Number(expiry));
    setGrantedToken(token);
  };

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800 p-6 space-y-6">
      <h3 className="text-lg font-semibold text-gray-50">Delegation Manager</h3>

      {allDelegations.length === 0 ? (
        <p className="text-sm text-gray-500">No active delegations.</p>
      ) : (
        <ul className="space-y-2">
          {allDelegations.map(({ entry, record }) => (
            <DelegationRow
              key={`${entry.id}-${record.recipientDid}`}
              entryLabel={entry.label}
              entryId={entry.id}
              record={record}
              onRevoke={(id, did) => void handleRevoke(id, did)}
            />
          ))}
        </ul>
      )}

      <div className="border-t border-gray-700 pt-5 space-y-4">
        <h4 className="text-sm font-medium text-gray-300">Grant New Delegation</h4>

        <div>
          <label className="block text-xs text-gray-400 mb-1" htmlFor="grant-entry">
            Vault Entry
          </label>
          <select
            id="grant-entry"
            value={selectedEntryId}
            onChange={(e) => setSelectedEntryId(e.target.value)}
            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
            aria-label="Select vault entry to delegate"
          >
            <option value="">Select entry…</option>
            {entries
              .filter((e) => e.consentEnabled)
              .map((e) => (
                <option key={e.id} value={e.id}>{e.label}</option>
              ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1" htmlFor="grant-did">
            Recipient DID
          </label>
          <input
            id="grant-did"
            type="text"
            value={recipientDid}
            onChange={(e) => setRecipientDid(e.target.value)}
            placeholder="did:key:z6Mk..."
            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 font-mono placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            aria-label="Recipient DID"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1" htmlFor="grant-expiry">
            Expiry
          </label>
          <select
            id="grant-expiry"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
            aria-label="Delegation expiry duration"
          >
            <option value="1">1 hour</option>
            <option value="24">24 hours</option>
            <option value="168">7 days</option>
            <option value="720">30 days</option>
          </select>
        </div>

        <button
          onClick={() => void handleGrant()}
          disabled={!selectedEntryId || !recipientDid}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors"
          aria-label="Grant delegation"
        >
          Delegate
        </button>

        {grantedToken && (
          <div>
            <p className="text-xs text-gray-400 mb-1">UCAN Token (copy and share)</p>
            <pre className="bg-gray-900 rounded-lg p-3 text-xs text-gray-300 font-mono overflow-auto max-h-28 break-all whitespace-pre-wrap">
              {grantedToken}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
