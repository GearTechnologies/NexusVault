/**
 * Zustand store for NexusVault.
 * Persists serialisable application state to localStorage.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { VaultEntryMeta } from '../lib/storacha';
import type { ContactEntry } from '../lib/did';

interface RecoveryApproval {
  guardianAddress: string;
  signature: string;
  approvedAt: number;
}

interface RecoveryRequest {
  createdAt: number;
  targetAddress: string;
  message: string;
  approvals: RecoveryApproval[];
}

interface VaultState {
  entries: VaultEntryMeta[];
  vaultIndexCid: string | null;
  guardians: string[];
  threshold: number;
  recoveryId: string | null;
  pkpPublicKey: string | null;
  recoveryRequest: RecoveryRequest | null;
  contacts: ContactEntry[];
  socialGraphCid: string | null;
  lastHeartbeat: number | null;
  heartbeatIntervalDays: number;
  heirAddress: string | null;
  switchArmed: boolean;
  isLoading: boolean;
  error: string | null;
}

interface VaultActions {
  addEntry: (entry: VaultEntryMeta) => void;
  removeEntry: (id: string) => void;
  updateEntry: (id: string, patch: Partial<VaultEntryMeta>) => void;
  setVaultIndexCid: (cid: string) => void;
  setGuardians: (addresses: string[], threshold: number) => void;
  setRecovery: (recoveryId: string, pkpPublicKey: string) => void;
  setRecoveryRequest: (request: RecoveryRequest | null) => void;
  addRecoveryApproval: (approval: RecoveryApproval) => void;
  clearRecoveryRequest: () => void;
  addContact: (contact: ContactEntry) => void;
  removeContact: (id: string) => void;
  setSocialGraphCid: (cid: string) => void;
  recordHeartbeat: () => void;
  configureSwitch: (heirAddress: string, intervalDays: number) => void;
  armSwitch: () => void;
  disarmSwitch: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const DEFAULT_INTERVAL_DAYS = Number(
  import.meta.env.VITE_HEARTBEAT_INTERVAL_DAYS ?? 7
);

export const useVaultStore = create<VaultState & VaultActions>()(
  persist(
    (set) => ({
      // State
      entries: [],
      vaultIndexCid: null,
      guardians: [],
      threshold: 2,
      recoveryId: null,
      pkpPublicKey: null,
      recoveryRequest: null,
      contacts: [],
      socialGraphCid: null,
      lastHeartbeat: null,
      heartbeatIntervalDays: DEFAULT_INTERVAL_DAYS,
      heirAddress: null,
      switchArmed: false,
      isLoading: false,
      error: null,

      // Actions
      addEntry: (entry) =>
        set((s) => ({ entries: [...s.entries, entry] })),
      removeEntry: (id) =>
        set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
      updateEntry: (id, patch) =>
        set((s) => ({
          entries: s.entries.map((e) =>
            e.id === id ? { ...e, ...patch } : e
          ),
        })),
      setVaultIndexCid: (cid) => set({ vaultIndexCid: cid }),
      setGuardians: (addresses, threshold) =>
        set({ guardians: addresses, threshold }),
      setRecovery: (recoveryId, pkpPublicKey) =>
        set({ recoveryId, pkpPublicKey }),
      setRecoveryRequest: (request) => set({ recoveryRequest: request }),
      addRecoveryApproval: (approval) =>
        set((s) => {
          if (!s.recoveryRequest) {
            return s;
          }

          const existing = new Set(
            s.recoveryRequest.approvals.map((item) =>
              item.guardianAddress.toLowerCase()
            )
          );

          if (existing.has(approval.guardianAddress.toLowerCase())) {
            return s;
          }

          return {
            recoveryRequest: {
              ...s.recoveryRequest,
              approvals: [...s.recoveryRequest.approvals, approval],
            },
          };
        }),
      clearRecoveryRequest: () => set({ recoveryRequest: null }),
      addContact: (contact) =>
        set((s) => ({ contacts: [...s.contacts, contact] })),
      removeContact: (id) =>
        set((s) => ({ contacts: s.contacts.filter((c) => c.id !== id) })),
      setSocialGraphCid: (cid) => set({ socialGraphCid: cid }),
      recordHeartbeat: () =>
        set({ lastHeartbeat: Math.floor(Date.now() / 1000) }),
      configureSwitch: (heirAddress, intervalDays) =>
        set({ heirAddress, heartbeatIntervalDays: intervalDays }),
      armSwitch: () => set({ switchArmed: true }),
      disarmSwitch: () => set({ switchArmed: false }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'nexusvault-store',
    }
  )
);
