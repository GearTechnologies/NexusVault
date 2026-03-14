/**
 * VaultPage — list all vault entries and manage via AddEntryModal.
 */

import { useState } from 'react';
import { useVaultStore } from '../store/vault';
import { useVault } from '../hooks/useVault';
import { VaultEntryCard } from '../components/vault/VaultEntryCard';
import { AddEntryModal } from '../components/vault/AddEntryModal';

/** Full vault management page with grid of entry cards. */
export function VaultPage() {
  const entries = useVaultStore((s) => s.entries);
  const { deleteEntry } = useVault();
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-50">Vault</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors"
          aria-label="Add new vault entry"
        >
          + Add Entry
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-700 p-12 text-center">
          <p className="text-gray-500 mb-4">Your vault is empty.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors"
            aria-label="Add first vault entry"
          >
            Add your first secret
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {entries.map((entry) => (
            <VaultEntryCard
              key={entry.id}
              entry={entry}
              onDelete={(id) => void deleteEntry(id)}
            />
          ))}
        </div>
      )}

      {showAddModal && (
        <AddEntryModal onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
}
