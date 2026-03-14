/**
 * Zustand store for NexusVault.
 * Persists all serialisable state to localStorage (excludes signer).
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ethers } from 'ethers';
import type { VaultEntryMeta } from '../lib/storacha';
import type { ContactEntry } from '../lib/did';

interface VaultState {
  walletAddress: string | null;
  signer: ethers.Signer | null;
  entries: VaultEntryMeta[];
  vaultIndexCid: string | null;
  guardians: string[];
  threshold: number;
  recoveryId: string | null;
  pkpPublicKey: string | null;
  contacts: ContactEntry[];
  socialGraphCid: string | null;
  lastHeartbeat: number | null;
  heartbeatIntervalDays: number;
  heirAddress: string | null;
  switchActionCid: string | null;
  switchArmed: boolean;
  isLoading: boolean;
  error: string | null;
}

interface VaultActions {
  setWallet: (address: string, signer: ethers.Signer) => void;
  clearWallet: () => void;
  addEntry: (entry: VaultEntryMeta) => void;
  removeEntry: (id: string) => void;
  updateEntry: (id: string, patch: Partial<VaultEntryMeta>) => void;
  setVaultIndexCid: (cid: string) => void;
  setGuardians: (addresses: string[], threshold: number) => void;
  setRecovery: (recoveryId: string, pkpPublicKey: string) => void;
  addContact: (contact: ContactEntry) => void;
  removeContact: (id: string) => void;
  setSocialGraphCid: (cid: string) => void;
  recordHeartbeat: () => void;
  configureSwitch: (heirAddress: string, intervalDays: number) => void;
  armSwitch: (actionCid: string) => void;
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
      walletAddress: null,
      signer: null,
      entries: [],
      vaultIndexCid: null,
      guardians: [],
      threshold: 2,
      recoveryId: null,
      pkpPublicKey: null,
      contacts: [],
      socialGraphCid: null,
      lastHeartbeat: null,
      heartbeatIntervalDays: DEFAULT_INTERVAL_DAYS,
      heirAddress: null,
      switchActionCid: null,
      switchArmed: false,
      isLoading: false,
      error: null,

      // Actions
      setWallet: (address, signer) => set({ walletAddress: address, signer }),
      clearWallet: () => set({ walletAddress: null, signer: null }),
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
      addContact: (contact) =>
        set((s) => ({ contacts: [...s.contacts, contact] })),
      removeContact: (id) =>
        set((s) => ({ contacts: s.contacts.filter((c) => c.id !== id) })),
      setSocialGraphCid: (cid) => set({ socialGraphCid: cid }),
      recordHeartbeat: () =>
        set({ lastHeartbeat: Math.floor(Date.now() / 1000) }),
      configureSwitch: (heirAddress, intervalDays) =>
        set({ heirAddress, heartbeatIntervalDays: intervalDays }),
      armSwitch: (actionCid) =>
        set({ switchArmed: true, switchActionCid: actionCid }),
      disarmSwitch: () => set({ switchArmed: false }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'nexusvault-store',
      partialize: (state) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { signer: _s, ...rest } = state;
        return rest;
      },
    }
  )
);
