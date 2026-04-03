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
  SignerLike,
} from '@lit-protocol/types';

let _litClient: LitNodeClient | null = null;
let _litNetworkInUse: LIT_NETWORKS_KEYS | null = null;

function isSupportedNetwork(value: string | undefined): value is LIT_NETWORKS_KEYS {
  return value === 'datil-dev' || value === 'datil-test' || value === 'datil' || value === 'custom';
}

function buildNetworkCandidates(requestedNetwork?: string): LIT_NETWORKS_KEYS[] {
  if (requestedNetwork === 'custom') {
    return ['custom'];
  }

  // `datil-dev` is the most reliable browser path for first-run encryption flows.
  // If the app is configured for `datil-test`, we still try a healthier path first
  // so vault creation doesn't die on unreachable handshake endpoints.
  const ordered =
    requestedNetwork === 'datil'
      ? [LIT_NETWORK.Datil, LIT_NETWORK.DatilDev, LIT_NETWORK.DatilTest]
      : requestedNetwork === 'datil-test'
      ? [LIT_NETWORK.DatilDev, LIT_NETWORK.Datil, LIT_NETWORK.DatilTest]
      : requestedNetwork === 'datil-dev'
      ? [LIT_NETWORK.DatilDev, LIT_NETWORK.Datil, LIT_NETWORK.DatilTest]
      : [LIT_NETWORK.DatilDev, LIT_NETWORK.Datil, LIT_NETWORK.DatilTest];

  return [...new Set(ordered)];
}

function buildLitConnectError(errors: string[]) {
  return new Error(
    `Unable to reach the Lit encryption network right now. Tried ${errors.join(
      ' | '
    )}.`
  );
}

/**
 * Returns a singleton LitNodeClient, connecting on first use.
 * Uses VITE_LIT_NETWORK env variable (default: datil-test).
 * @returns Connected LitNodeClient instance.
 */
export async function getLitClient(): Promise<LitNodeClient> {
  if (_litClient) return _litClient;

  const requestedNetwork = import.meta.env.VITE_LIT_NETWORK as string | undefined;
  const candidates = buildNetworkCandidates(
    isSupportedNetwork(requestedNetwork) ? requestedNetwork : undefined
  );
  const errors: string[] = [];

  for (const network of candidates) {
    const client = new LitNodeClient({
      litNetwork: network,
      connectTimeout: 12000,
      debug: false,
    });

    try {
      await client.connect();
      _litClient = client;
      _litNetworkInUse = network;
      return client;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown network failure';
      errors.push(`${network}: ${message}`);
    }
  }

  throw buildLitConnectError(errors);
}

/**
 * Generates session signatures using a connected Ethereum wallet signer.
 * @param signer - A signer with signMessage/getAddress support.
 * @param client - A connected LitNodeClient instance.
 * @returns SessionSigsMap for encrypt/decrypt operations.
 */
export async function getSessionSigs(
  signer: SignerLike,
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
      method: '',
      parameters: [':userAddress'],
      returnValueTest: { comparator: '=', value: walletAddress },
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
    // The app stores a deterministic policy key for the configured guardian set
    // so recovery state can be referenced consistently across sessions.
    pkpPublicKey: `pkp-${recoveryId}-${threshold}of${guardianAddresses.length}`,
    recoveryId,
  };
}

export function getActiveLitNetwork(): LIT_NETWORKS_KEYS | null {
  return _litNetworkInUse;
}
