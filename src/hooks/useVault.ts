/**
 * useVault — vault CRUD operations, Lit encryption, and Storacha upload.
 */

import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useVaultStore } from '../store/vault';
import {
  getLitClient,
  getSessionSigs,
  encryptWithWallet,
  decryptWithSessionSigs,
} from '../lib/lit';
import {
  uploadEncryptedBlob,
  uploadVaultIndex,
  fetchVaultIndex,
  delegateReadAccess,
  type VaultEntryMeta,
  type DelegationRecord,
} from '../lib/storacha';
import type { ContactEntry } from '../lib/did';

/**
 * Provides vault operations: add, decrypt, delete entries, manage the vault
 * index on Storacha, toggle consent, and handle UCAN delegations.
 */
export function useVault() {
  const signer = useVaultStore((s) => s.signer);
  const walletAddress = useVaultStore((s) => s.walletAddress);
  const entries = useVaultStore((s) => s.entries);
  const addEntry = useVaultStore((s) => s.addEntry);
  const removeEntry = useVaultStore((s) => s.removeEntry);
  const updateEntry = useVaultStore((s) => s.updateEntry);
  const setVaultIndexCid = useVaultStore((s) => s.setVaultIndexCid);
  const addContact = useVaultStore((s) => s.addContact);
  const setLoading = useVaultStore((s) => s.setLoading);
  const setError = useVaultStore((s) => s.setError);

  /** Serialises entries to Storacha and updates vaultIndexCid. */
  const saveVaultIndex = useCallback(async () => {
    const current = useVaultStore.getState().entries;
    const cid = await uploadVaultIndex(current);
    setVaultIndexCid(cid);
  }, [setVaultIndexCid]);

  /** Encrypts payload via Lit and uploads blob to Storacha. */
  const encryptAndUpload = useCallback(
    async (
      payload: string,
      label: string,
      type: VaultEntryMeta['type']
    ): Promise<
      Omit<VaultEntryMeta, 'id' | 'createdAt' | 'consentEnabled' | 'delegations'>
    > => {
      if (!signer || !walletAddress) throw new Error('Wallet not connected');

      const client = await getLitClient();
      const { ciphertext, dataToEncryptHash } = await encryptWithWallet(
        payload,
        walletAddress,
        client
      );
      const cid = await uploadEncryptedBlob(
        JSON.stringify({ ciphertext, dataToEncryptHash }),
        `${type}-${Date.now()}.json`
      );
      return { type, label, cid, ciphertext, dataToEncryptHash };
    },
    [signer, walletAddress]
  );

  /**
   * Adds a password vault entry (label, username, password).
   */
  const addPasswordEntry = useCallback(
    async (label: string, username: string, password: string) => {
      setLoading(true);
      try {
        const meta = await encryptAndUpload(
          JSON.stringify({ username, password }),
          label,
          'password'
        );
        addEntry({ ...meta, id: uuidv4(), createdAt: Date.now(), consentEnabled: false, delegations: [] });
        await saveVaultIndex();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add password entry');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [encryptAndUpload, addEntry, saveVaultIndex, setLoading, setError]
  );

  /**
   * Adds a file vault entry by reading the file and encrypting its contents.
   */
  const addFileEntry = useCallback(
    async (label: string, file: File) => {
      setLoading(true);
      try {
        const buffer = await file.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
        const meta = await encryptAndUpload(
          JSON.stringify({ fileName: file.name, mimeType: file.type, data: base64 }),
          label,
          'file'
        );
        addEntry({ ...meta, id: uuidv4(), createdAt: Date.now(), consentEnabled: false, delegations: [] });
        await saveVaultIndex();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add file entry');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [encryptAndUpload, addEntry, saveVaultIndex, setLoading, setError]
  );

  /**
   * Adds a note vault entry.
   */
  const addNoteEntry = useCallback(
    async (label: string, content: string) => {
      setLoading(true);
      try {
        const meta = await encryptAndUpload(content, label, 'note');
        addEntry({ ...meta, id: uuidv4(), createdAt: Date.now(), consentEnabled: false, delegations: [] });
        await saveVaultIndex();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add note entry');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [encryptAndUpload, addEntry, saveVaultIndex, setLoading, setError]
  );

  /**
   * Adds an API key vault entry.
   */
  const addApiKeyEntry = useCallback(
    async (label: string, key: string, service: string) => {
      setLoading(true);
      try {
        const meta = await encryptAndUpload(
          JSON.stringify({ key, service }),
          label,
          'api_key'
        );
        addEntry({ ...meta, id: uuidv4(), createdAt: Date.now(), consentEnabled: false, delegations: [] });
        await saveVaultIndex();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add API key entry');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [encryptAndUpload, addEntry, saveVaultIndex, setLoading, setError]
  );

  /**
   * Adds a contact entry to the social graph.
   */
  const addContactEntry = useCallback(
    (contact: ContactEntry) => {
      addContact(contact);
    },
    [addContact]
  );

  /**
   * Decrypts a vault entry by id using Lit sessionSigs.
   * @param id - The vault entry id.
   * @returns Decrypted plaintext string.
   */
  const decryptEntry = useCallback(
    async (id: string): Promise<string> => {
      if (!signer || !walletAddress) throw new Error('Wallet not connected');
      setLoading(true);
      try {
        const entry = entries.find((e) => e.id === id);
        if (!entry) throw new Error(`Entry ${id} not found`);
        const client = await getLitClient();
        const sessionSigs = await getSessionSigs(signer, client);
        return await decryptWithSessionSigs(
          entry.ciphertext,
          entry.dataToEncryptHash,
          walletAddress,
          sessionSigs,
          client
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to decrypt entry');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [signer, walletAddress, entries, setLoading, setError]
  );

  /**
   * Deletes a vault entry and updates the vault index.
   */
  const deleteEntry = useCallback(
    async (id: string) => {
      setLoading(true);
      try {
        removeEntry(id);
        await saveVaultIndex();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete entry');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [removeEntry, saveVaultIndex, setLoading, setError]
  );

  /**
   * Fetches a vault index from Storacha by CID and populates the store.
   */
  const loadVaultIndex = useCallback(
    async (cid: string) => {
      setLoading(true);
      try {
        const loaded = await fetchVaultIndex(cid);
        loaded.forEach((e) => addEntry(e));
        setVaultIndexCid(cid);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load vault index');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [addEntry, setVaultIndexCid, setLoading, setError]
  );

  /**
   * Toggles consent on a vault entry and saves the updated index.
   */
  const toggleConsent = useCallback(
    async (id: string, enabled: boolean) => {
      setLoading(true);
      try {
        updateEntry(id, { consentEnabled: enabled });
        await saveVaultIndex();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to toggle consent');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [updateEntry, saveVaultIndex, setLoading, setError]
  );

  /**
   * Delegates read access to a vault entry to another DID.
   * @param id - The vault entry id.
   * @param recipientDid - The recipient's W3C DID string.
   * @param expirationHours - Hours until the delegation expires.
   * @returns The base64 UCAN delegation token.
   */
  const delegateAccess = useCallback(
    async (
      id: string,
      recipientDid: string,
      expirationHours: number
    ): Promise<string> => {
      setLoading(true);
      try {
        const entry = entries.find((e) => e.id === id);
        if (!entry) throw new Error(`Entry ${id} not found`);
        const expirationSeconds = expirationHours * 3600;
        const token = await delegateReadAccess(
          entry.cid,
          recipientDid,
          expirationSeconds
        );
        const record: DelegationRecord = {
          recipientDid,
          expiresAt: Math.floor(Date.now() / 1000) + expirationSeconds,
          token,
          capability: 'space/blob/*',
        };
        updateEntry(id, { delegations: [...(entry.delegations ?? []), record] });
        await saveVaultIndex();
        return token;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delegate access');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [entries, updateEntry, saveVaultIndex, setLoading, setError]
  );

  return {
    addPasswordEntry,
    addFileEntry,
    addNoteEntry,
    addApiKeyEntry,
    addContactEntry,
    decryptEntry,
    deleteEntry,
    saveVaultIndex,
    loadVaultIndex,
    toggleConsent,
    delegateAccess,
  };
}
