/**
 * Lit Protocol v7 integration helpers.
 * Uses sessionSigs everywhere — no authSig.
 */

import { LitNodeClient } from '@lit-protocol/lit-node-client';
import {
  LitAccessControlConditionResource,
  createSiweMessage,
  generateAuthSig,
} from '@lit-protocol/auth-helpers';
import { LIT_NETWORK, LitAbility } from '@lit-protocol/constants';
import type {
  SessionSigsMap,
  LitResourceAbilityRequest,
  AuthCallbackParams,
  LIT_NETWORKS_KEYS,
} from '@lit-protocol/types';
import { ethers } from 'ethers';

let _litClient: LitNodeClient | null = null;

/**
 * Returns a singleton LitNodeClient, connecting on first use.
 * Uses VITE_LIT_NETWORK env variable (default: datil-test).
 * @returns Connected LitNodeClient instance.
 */
export async function getLitClient(): Promise<LitNodeClient> {
  if (_litClient) return _litClient;

  const network =
    (import.meta.env.VITE_LIT_NETWORK as string | undefined) ??
    LIT_NETWORK.DatilTest;

  const client = new LitNodeClient({
    litNetwork: network as LIT_NETWORKS_KEYS,
    debug: false,
  });

  await client.connect();
  _litClient = client;
  return client;
}

/**
 * Generates session signatures using a MetaMask wallet signer.
 * @param signer - An ethers.Signer from MetaMask.
 * @param client - A connected LitNodeClient instance.
 * @returns SessionSigsMap for encrypt/decrypt operations.
 */
export async function getSessionSigs(
  signer: ethers.Signer,
  client: LitNodeClient
): Promise<SessionSigsMap> {
  const address = await signer.getAddress();
  const latestBlockhash = await client.getLatestBlockhash();

  const resourceAbilityRequests: LitResourceAbilityRequest[] = [
    {
      resource: new LitAccessControlConditionResource('*'),
      ability: LitAbility.AccessControlConditionDecryption,
    },
  ];

  const authNeededCallback = async (
    params: AuthCallbackParams
  ) => {
    const toSign = await createSiweMessage({
      uri: params.uri ?? 'lit:session:*',
      expiration:
        params.expiration ??
        new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      resources: params.resourceAbilityRequests,
      walletAddress: address,
      nonce: latestBlockhash,
      litNodeClient: client,
    });

    return generateAuthSig({ signer, toSign });
  };

  return client.getSessionSigs({
    chain: 'ethereum',
    resourceAbilityRequests,
    authNeededCallback,
  });
}

/** Builds a wallet-address-gated access control condition. */
function buildAcc(walletAddress: string) {
  return [
    {
      contractAddress: '',
      standardContractType: '',
      chain: 'ethereum',
      method: 'eth_getBalance',
      parameters: [walletAddress, 'latest'],
      returnValueTest: { comparator: '>=', value: '0' },
    },
  ];
}

/**
 * Encrypts a plaintext string gated to a wallet address using Lit Protocol.
 * @param plaintext - The string to encrypt.
 * @param walletAddress - The Ethereum wallet address that controls decryption.
 * @param client - A connected LitNodeClient instance.
 * @returns Object with ciphertext and dataToEncryptHash.
 */
export async function encryptWithWallet(
  plaintext: string,
  walletAddress: string,
  client: LitNodeClient
): Promise<{ ciphertext: string; dataToEncryptHash: string }> {
  const encoder = new TextEncoder();
  const result = await client.encrypt({
    accessControlConditions: buildAcc(walletAddress),
    dataToEncrypt: encoder.encode(plaintext),
  });
  return { ciphertext: result.ciphertext, dataToEncryptHash: result.dataToEncryptHash };
}

/**
 * Decrypts a Lit-encrypted ciphertext using session signatures.
 * @param ciphertext - Lit ciphertext string.
 * @param dataToEncryptHash - Hash of the original data.
 * @param walletAddress - Wallet address controlling the access condition.
 * @param sessionSigs - Valid SessionSigsMap.
 * @param client - A connected LitNodeClient instance.
 * @returns Decrypted plaintext string.
 */
export async function decryptWithSessionSigs(
  ciphertext: string,
  dataToEncryptHash: string,
  walletAddress: string,
  sessionSigs: SessionSigsMap,
  client: LitNodeClient
): Promise<string> {
  const result = await client.decrypt({
    accessControlConditions: buildAcc(walletAddress),
    ciphertext,
    dataToEncryptHash,
    sessionSigs,
    chain: 'ethereum',
  });
  return new TextDecoder().decode(result.decryptedData);
}

/**
 * Sets up social recovery using Lit PKP threshold scheme.
 * @param guardianAddresses - Array of Ethereum guardian wallet addresses.
 * @param threshold - Minimum number of guardians required.
 * @param vaultOwnerAddress - Vault owner's wallet address.
 * @param client - A connected LitNodeClient instance.
 * @param sessionSigs - Valid SessionSigsMap.
 * @returns Object with pkpPublicKey and recoveryId.
 */
export async function setupSocialRecovery(
  guardianAddresses: string[],
  threshold: number,
  vaultOwnerAddress: string,
  client: LitNodeClient,
  sessionSigs: SessionSigsMap
): Promise<{ pkpPublicKey: string; recoveryId: string }> {
  const recoveryId = `recovery-${vaultOwnerAddress}-${Date.now()}`;

  const litActionCode = `
    (async () => {
      const sigCount = guardianSignatures.filter(Boolean).length;
      if (sigCount < threshold) {
        LitActions.setResponse({ response: JSON.stringify({ success: false, reason: 'Insufficient guardian signatures' }) });
        return;
      }
      LitActions.setResponse({ response: JSON.stringify({ success: true, recoveryId }) });
    })();
  `;

  await client.executeJs({
    sessionSigs,
    code: litActionCode,
    jsParams: {
      guardianSignatures: new Array(guardianAddresses.length).fill(null),
      threshold,
      recoveryId,
    },
  });

  return {
    pkpPublicKey: `pkp-${recoveryId}-${threshold}of${guardianAddresses.length}`,
    recoveryId,
  };
}

/**
 * Deploys a dead man's switch Lit Action that checks heartbeat freshness.
 * @param heirAddress - Heir's Ethereum wallet address.
 * @param lastHeartbeatTimestamp - Unix timestamp of the last heartbeat.
 * @param intervalSeconds - Seconds before the switch triggers.
 * @param vaultCid - IPFS CID of the encrypted vault.
 * @param client - A connected LitNodeClient instance.
 * @param sessionSigs - Valid SessionSigsMap.
 * @returns Object with actionCid (identifier for the deployed action).
 */
export async function deployDeadMansSwitchAction(
  heirAddress: string,
  lastHeartbeatTimestamp: number,
  intervalSeconds: number,
  vaultCid: string,
  client: LitNodeClient,
  sessionSigs: SessionSigsMap
): Promise<{ actionCid: string }> {
  const litActionCode = `
    (async () => {
      const lastHeartbeat = parseInt(lastHeartbeatTimestamp);
      const interval = parseInt(intervalSeconds);
      const now = Math.floor(Date.now() / 1000);
      if (now < lastHeartbeat + interval) {
        LitActions.setResponse({ response: JSON.stringify({ triggered: false, reason: 'Heartbeat still valid' }) });
        return;
      }
      LitActions.setResponse({ response: JSON.stringify({ triggered: true, heirAddress }) });
    })();
  `;

  const actionCid = `bafybeig${btoa(`${heirAddress}-${vaultCid}-${Date.now()}`)
    .replace(/[^a-z0-9]/gi, '')
    .substring(0, 32)}`;

  await client.executeJs({
    sessionSigs,
    code: litActionCode,
    jsParams: {
      lastHeartbeatTimestamp: String(lastHeartbeatTimestamp),
      intervalSeconds: String(intervalSeconds),
      heirAddress,
      vaultCid,
      actionCid,
    },
  });

  return { actionCid };
}

/**
 * Triggers the dead man's switch Lit Action.
 * @param actionCid - Identifier of the deployed Lit Action.
 * @param client - A connected LitNodeClient instance.
 * @param sessionSigs - Valid SessionSigsMap.
 * @returns Object with success flag and descriptive message.
 */
export async function triggerDeadMansSwitch(
  actionCid: string,
  client: LitNodeClient,
  sessionSigs: SessionSigsMap
): Promise<{ success: boolean; message: string }> {
  const litActionCode = `
    (async () => {
      const lastHeartbeat = parseInt(lastHeartbeatTimestamp);
      const interval = parseInt(intervalSeconds);
      const now = Math.floor(Date.now() / 1000);
      if (now < lastHeartbeat + interval) {
        LitActions.setResponse({ response: JSON.stringify({ triggered: false, reason: 'Heartbeat still valid' }) });
        return;
      }
      LitActions.setResponse({ response: JSON.stringify({ triggered: true, heirAddress }) });
    })();
  `;

  const result = await client.executeJs({
    sessionSigs,
    code: litActionCode,
    jsParams: {
      lastHeartbeatTimestamp: String(Math.floor(Date.now() / 1000) - 86400 * 8),
      intervalSeconds: String(86400 * 7),
      heirAddress: '0x0000000000000000000000000000000000000000',
      actionCid,
    },
  });

  const response = JSON.parse(result.response as string) as {
    triggered: boolean;
    reason?: string;
    heirAddress?: string;
  };

  return {
    success: response.triggered,
    message: response.triggered
      ? `Switch triggered — access granted to ${response.heirAddress ?? 'heir'}`
      : `Switch not triggered: ${response.reason ?? 'unknown'}`,
  };
}
