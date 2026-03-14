/**
 * VaultEntryCard — displays a single vault entry with decrypt and delegate actions.
 */

import { useState } from 'react';
import { EntryTypeIcon } from './EntryTypeIcon';
import { useVault } from '../../hooks/useVault';
import type { VaultEntryMeta } from '../../lib/storacha';

interface VaultEntryCardProps {
  entry: VaultEntryMeta;
  onDelete: (id: string) => void;
}

function DecryptedModal({
  value,
  onClose,
}: {
  value: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-gray-950/80 flex items-center justify-center z-50 p-4">
      <div className="rounded-xl border border-gray-700 bg-gray-800 p-6 w-full max-w-md space-y-4">
        <h3 className="text-lg font-semibold text-gray-50">Decrypted Value</h3>
        <pre className="bg-gray-900 rounded-lg p-4 text-sm text-gray-300 font-mono overflow-auto max-h-48 whitespace-pre-wrap break-all">
          {value}
        </pre>
        <div className="flex gap-3">
          <button
            onClick={handleCopy}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg px-4 py-2 transition-colors text-sm"
            aria-label="Copy decrypted value"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={onClose}
            className="border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white rounded-lg px-4 py-2 transition-colors text-sm"
            aria-label="Close modal"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DelegateModal({
  entryId,
  onClose,
}: {
  entryId: string;
  onClose: () => void;
}) {
  const { delegateAccess } = useVault();
  const [did, setDid] = useState('');
  const [expiry, setExpiry] = useState('24');
  const [token, setToken] = useState<string | null>(null);

  const handleDelegate = async () => {
    const result = await delegateAccess(entryId, did, Number(expiry));
    setToken(result);
  };

  return (
    <div className="fixed inset-0 bg-gray-950/80 flex items-center justify-center z-50 p-4">
      <div className="rounded-xl border border-gray-700 bg-gray-800 p-6 w-full max-w-md space-y-4">
        <h3 className="text-lg font-semibold text-gray-50">Delegate Access</h3>
        <div>
          <label className="block text-sm text-gray-400 mb-1" htmlFor="delegate-did">
            Recipient DID
          </label>
          <input
            id="delegate-did"
            type="text"
            value={did}
            onChange={(e) => setDid(e.target.value)}
            placeholder="did:key:z6Mk..."
            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            aria-label="Recipient DID"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1" htmlFor="delegate-expiry">
            Expiry
          </label>
          <select
            id="delegate-expiry"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
            aria-label="Delegation expiry"
          >
            <option value="1">1 hour</option>
            <option value="24">24 hours</option>
            <option value="168">7 days</option>
            <option value="720">30 days</option>
          </select>
        </div>
        {token && (
          <div>
            <p className="text-xs text-gray-400 mb-1">UCAN Token</p>
            <pre className="bg-gray-900 rounded p-2 text-xs text-gray-300 font-mono overflow-auto max-h-24 break-all">
              {token}
            </pre>
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={handleDelegate}
            disabled={!did}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 transition-colors text-sm"
            aria-label="Submit delegation"
          >
            Delegate
          </button>
          <button
            onClick={onClose}
            className="border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white rounded-lg px-4 py-2 transition-colors text-sm"
            aria-label="Close delegate modal"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/** Card displaying a single vault entry with actions. */
export function VaultEntryCard({ entry, onDelete }: VaultEntryCardProps) {
  const { decryptEntry } = useVault();
  const [decryptedValue, setDecryptedValue] = useState<string | null>(null);
  const [showDelegate, setShowDelegate] = useState(false);

  const handleDecrypt = async () => {
    const value = await decryptEntry(entry.id);
    setDecryptedValue(value);
  };

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800 p-6 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <EntryTypeIcon type={entry.type} />
          <div>
            <p className="font-medium text-gray-100">{entry.label}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wide">{entry.type}</p>
          </div>
        </div>
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${
            entry.consentEnabled
              ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-700'
              : 'bg-gray-700 text-gray-400'
          }`}
        >
          {entry.consentEnabled ? 'Shared' : 'Private'}
        </span>
      </div>

      <p className="font-mono text-sm text-gray-500 tracking-widest">••••••••</p>
      <p className="text-xs text-gray-600">{new Date(entry.createdAt).toLocaleDateString()}</p>

      <div className="flex gap-2 pt-1">
        <button
          onClick={handleDecrypt}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg px-3 py-1.5 text-xs transition-colors"
          aria-label={`Decrypt ${entry.label}`}
        >
          Decrypt
        </button>
        <button
          onClick={() => setShowDelegate(true)}
          className="border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white rounded-lg px-3 py-1.5 text-xs transition-colors"
          aria-label={`Share ${entry.label}`}
        >
          Share
        </button>
        <button
          onClick={() => onDelete(entry.id)}
          className="border border-red-800 hover:border-red-600 text-red-400 hover:text-red-300 rounded-lg px-3 py-1.5 text-xs transition-colors"
          aria-label={`Delete ${entry.label}`}
        >
          Delete
        </button>
      </div>

      {decryptedValue !== null && (
        <DecryptedModal value={decryptedValue} onClose={() => setDecryptedValue(null)} />
      )}
      {showDelegate && (
        <DelegateModal entryId={entry.id} onClose={() => setShowDelegate(false)} />
      )}
    </div>
  );
}
