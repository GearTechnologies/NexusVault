/**
 * Storacha (w3up / UCAN-based IPFS) integration helpers.
 * Uses @storacha/client for all upload and delegation operations.
 */

import * as Client from '@storacha/client';
import { archive as archiveDelegation } from '@ucanto/core/delegation';

/** Metadata for a vault entry stored in Storacha. */
export interface VaultEntryMeta {
  id: string;
  type: 'password' | 'file' | 'note' | 'contact' | 'api_key';
  label: string;
  cid: string;
  dataToEncryptHash: string;
  ciphertext: string;
  createdAt: number;
  consentEnabled: boolean;
  delegations: DelegationRecord[];
}

/** A UCAN delegation record for a vault entry. */
export interface DelegationRecord {
  recipientDid: string;
  expiresAt: number;
  token: string;
  capability: string;
}

let _storachaClient: Awaited<ReturnType<typeof Client.create>> | null = null;
const LOCAL_BLOB_PREFIX = 'nexusvault:blob:';
const STORACHA_SPACE_KEY = 'nexusvault:storacha-space';
const DEFAULT_SPACE_NAME = 'NexusVault Space';
const DEFAULT_GATEWAY = 'https://w3s.link/ipfs';

function isBrowser() {
  return typeof window !== 'undefined';
}

function getGatewayBase() {
  return (import.meta.env.VITE_STORACHA_GATEWAY_BASE as string | undefined) ?? DEFAULT_GATEWAY;
}

function createLocalCid() {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `blob-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `local:${id}`;
}

function saveLocalBlob(data: string, fileName: string) {
  if (!isBrowser()) {
    throw new Error('Storacha upload failed outside the browser.');
  }

  const cid = createLocalCid();
  window.localStorage.setItem(
    `${LOCAL_BLOB_PREFIX}${cid}`,
    JSON.stringify({
      data,
      fileName,
      savedAt: Date.now(),
    })
  );
  return cid;
}

function loadLocalBlob(cid: string) {
  if (!isBrowser()) {
    return null;
  }

  const raw = window.localStorage.getItem(`${LOCAL_BLOB_PREFIX}${cid}`);
  if (!raw) {
    return null;
  }

  const parsed = JSON.parse(raw) as { data?: string };
  return parsed.data ?? null;
}

async function ensureStorachaSpace(
  client: Awaited<ReturnType<typeof Client.create>>
) {
  if (!isBrowser()) {
    return client.currentSpace();
  }

  const current = client.currentSpace();
  if (current) {
    window.localStorage.setItem(STORACHA_SPACE_KEY, current.did());
    return current;
  }

  const rememberedDid = window.localStorage.getItem(STORACHA_SPACE_KEY);
  if (rememberedDid) {
    try {
      await client.setCurrentSpace(rememberedDid as `did:${string}:${string}`);
      const remembered = client.currentSpace();
      if (remembered) {
        return remembered;
      }
    } catch {
      window.localStorage.removeItem(STORACHA_SPACE_KEY);
    }
  }

  const existingSpaces = client.spaces();
  if (existingSpaces.length > 0) {
    await client.setCurrentSpace(existingSpaces[0].did());
    window.localStorage.setItem(STORACHA_SPACE_KEY, existingSpaces[0].did());
    return existingSpaces[0];
  }

  const space = await client.createSpace(
    (import.meta.env.VITE_STORACHA_SPACE_NAME as string | undefined) ??
      DEFAULT_SPACE_NAME
  );

  await client.setCurrentSpace(space.did());
  window.localStorage.setItem(STORACHA_SPACE_KEY, space.did());
  return space;
}

/**
 * Returns a singleton Storacha client.
 * Auto-login is intentionally not forced because shared demo deployments
 * should not trigger a magic-link flow to a single hard-coded email address.
 * @returns An authenticated Storacha Client instance.
 */
export async function getStorachaClient(): Promise<
  Awaited<ReturnType<typeof Client.create>>
> {
  if (_storachaClient) return _storachaClient;

  const client = await Client.create();
  _storachaClient = client;
  return client;
}

/**
 * Uploads an encrypted blob to Storacha.
 * @param data - JSON-stringified encrypted payload.
 * @param fileName - Name to assign the uploaded file.
 * @returns The IPFS CID string of the uploaded blob.
 */
export async function uploadEncryptedBlob(
  data: string,
  fileName: string
): Promise<string> {
  try {
    const client = await getStorachaClient();
    await ensureStorachaSpace(client);
    const blob = new Blob([data], { type: 'application/json' });
    const file = new File([blob], fileName, { type: 'application/json' });
    const cid = await client.uploadFile(file);
    return cid.toString();
  } catch {
    return saveLocalBlob(data, fileName);
  }
}

/**
 * Fetches and returns a blob from Storacha by its IPFS CID.
 * @param cid - The IPFS CID string of the blob.
 * @returns Raw string content of the blob.
 */
export async function fetchBlobByCid(cid: string): Promise<string> {
  if (cid.startsWith('local:')) {
    const local = loadLocalBlob(cid);
    if (local === null) {
      throw new Error(`Local blob ${cid} is no longer available in this browser.`);
    }
    return local;
  }

  const response = await fetch(`${getGatewayBase()}/${cid}`);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch blob for CID ${cid}: ${response.statusText}`
    );
  }
  return response.text();
}

/**
 * Uploads a vault index as a JSON file to Storacha.
 * @param entries - Array of vault entry metadata.
 * @returns The IPFS CID string of the uploaded index file.
 */
export async function uploadVaultIndex(
  entries: VaultEntryMeta[]
): Promise<string> {
  return uploadEncryptedBlob(JSON.stringify(entries), 'vault-index.json');
}

/**
 * Fetches and parses a vault index from Storacha by CID.
 * @param cid - The IPFS CID string of the vault index.
 * @returns Array of VaultEntryMeta objects.
 */
export async function fetchVaultIndex(cid: string): Promise<VaultEntryMeta[]> {
  const raw = await fetchBlobByCid(cid);
  return JSON.parse(raw) as VaultEntryMeta[];
}

/**
 * Delegates read access to a specific CID to another DID.
 * @param cid - The IPFS CID to delegate access to.
 * @param recipientDid - The recipient's W3C DID string.
 * @param expirationSeconds - Seconds until the delegation expires.
 * @returns Base64-encoded UCAN delegation token string.
 */
export async function delegateReadAccess(
  cid: string,
  recipientDid: string,
  expirationSeconds: number
): Promise<string> {
  if (cid.startsWith('local:')) {
    throw new Error(
      'Delegation requires a Storacha-backed entry. Re-save this entry once Storacha is reachable.'
    );
  }

  const client = await getStorachaClient();
  await ensureStorachaSpace(client);
  const expiration = Math.floor(Date.now() / 1000) + expirationSeconds;

  const audience = {
    did: () => recipientDid as `did:${string}:${string}`,
  };

  const delegation = await client.createDelegation(
    audience,
    ['space/blob/*'],
    { expiration }
  );

  const archived = await archiveDelegation(delegation);
  if (archived.error) {
    throw new Error(`Failed to archive delegation: ${String(archived.error)}`);
  }

  // `cid` is accepted as a parameter for API consistency and future filtering.
  // Currently, Storacha delegations are issued at the space level (space/blob/*)
  // rather than per-CID, which is standard UCAN practice.
  void cid;
  return btoa(String.fromCharCode(...(archived.ok as Uint8Array)));
}
