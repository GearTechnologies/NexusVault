/**
 * SharingPage — consent and delegation management.
 */

import { useVaultStore } from '../store/vault';
import { ConsentToggle } from '../components/sharing/ConsentToggle';
import { DelegationManager } from '../components/sharing/DelegationManager';

/** Consent and UCAN delegation management page. */
export function SharingPage() {
  const entries = useVaultStore((s) => s.entries);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-50">Data Sharing</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-gray-700 bg-gray-800 p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-50">Consent Controls</h3>
          {entries.length === 0 ? (
            <p className="text-sm text-gray-500">
              Add vault entries to manage their sharing consent.
            </p>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => (
                <ConsentToggle key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </div>

        <DelegationManager />
      </div>
    </div>
  );
}
