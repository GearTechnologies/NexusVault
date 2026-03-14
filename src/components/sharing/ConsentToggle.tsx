/**
 * ConsentToggle — per-entry toggle to enable or disable data sharing consent.
 */

import { useVaultStore } from '../../store/vault';
import { useVault } from '../../hooks/useVault';
import type { VaultEntryMeta } from '../../lib/storacha';

interface ConsentToggleProps {
  entry: VaultEntryMeta;
}

/** Toggle switch for a single vault entry's consent status. */
export function ConsentToggle({ entry }: ConsentToggleProps) {
  const { toggleConsent } = useVault();
  const isLoading = useVaultStore((s) => s.isLoading);

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-gray-900 border border-gray-700">
      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-200">{entry.label}</p>
        <p className="text-xs text-gray-500 uppercase tracking-wide">{entry.type}</p>
        <p className="text-xs text-gray-400">
          Apps you authorise can read this entry's data via UCAN delegation
        </p>
      </div>
      <div className="flex flex-col items-end gap-2 ml-4">
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            entry.consentEnabled
              ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-700'
              : 'bg-gray-700 text-gray-400'
          }`}
        >
          {entry.consentEnabled ? 'Shareable' : 'Private'}
        </span>
        <button
          role="switch"
          aria-checked={entry.consentEnabled}
          aria-label={`Toggle consent for ${entry.label}`}
          disabled={isLoading}
          onClick={() => void toggleConsent(entry.id, !entry.consentEnabled)}
          className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
            entry.consentEnabled ? 'bg-indigo-600' : 'bg-gray-600'
          } disabled:opacity-50`}
        >
          <span
            className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
              entry.consentEnabled ? 'translate-x-5' : 'translate-x-0'
            }`}
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  );
}
