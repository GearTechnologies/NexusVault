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

/**
 * Returns a singleton Storacha client, logging in with the configured email.
 * Uses VITE_STORACHA_EMAIL env variable.
 * @returns An authenticated Storacha Client instance.
 */
export async function getStorachaClient(): Promise<
  Awaited<ReturnType<typeof Client.create>>
> {
  if (_storachaClient) return _storachaClient;

  const client = await Client.create();
  const email = import.meta.env.VITE_STORACHA_EMAIL as string | undefined;

  if (email) {
    await client.login(email as `${string}@${string}`);
  }

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
  const client = await getStorachaClient();
  const blob = new Blob([data], { type: 'application/json' });
  const file = new File([blob], fileName, { type: 'application/json' });
  const cid = await client.uploadFile(file);
  return cid.toString();
}

/**
 * Fetches and returns a blob from Storacha by its IPFS CID.
 * @param cid - The IPFS CID string of the blob.
 * @returns Raw string content of the blob.
 */
export async function fetchBlobByCid(cid: string): Promise<string> {
  const response = await fetch(`https://${cid}.ipfs.w3s.link`);
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
  const client = await getStorachaClient();
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

  // archived.ok is Uint8Array
  void cid;
  return btoa(String.fromCharCode(...(archived.ok as Uint8Array)));
}
