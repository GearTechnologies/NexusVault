/**
 * W3C DID document builder for the portable social graph.
 * Uses the did:pkh:eip155:1 method derived from an Ethereum wallet address.
 */

/** A contact entry in the social graph. */
export interface ContactEntry {
  id: string;
  name: string;
  did?: string;
  email?: string;
  walletAddress?: string;
  platforms: Record<string, string>;
  addedAt: number;
}

/**
 * Builds a W3C DID document from a wallet address and contact list.
 * @param walletAddress - Ethereum wallet address of the document owner.
 * @param contacts - Array of contacts to embed in the social graph.
 * @returns W3C DID Core compliant document object.
 */
export function buildDIDDocument(
  walletAddress: string,
  contacts: ContactEntry[]
): object {
  const did = `did:pkh:eip155:1:${walletAddress.toLowerCase()}`;

  return {
    '@context': [
      'https://www.w3.org/ns/did/v1',
      'https://w3id.org/security/suites/secp256k1recovery-2020/v2',
    ],
    id: did,
    verificationMethod: [
      {
        id: `${did}#controller`,
        type: 'EcdsaSecp256k1RecoveryMethod2020',
        controller: did,
        blockchainAccountId: `eip155:1:${walletAddress.toLowerCase()}`,
      },
    ],
    authentication: [`${did}#controller`],
    assertionMethod: [`${did}#controller`],
    service: [
      {
        id: `${did}#nexusvault-social-graph`,
        type: 'nexusvault:socialGraph',
        serviceEndpoint: {
          contacts: contacts.map((c) => ({
            id: c.id,
            name: c.name,
            did: c.did,
            email: c.email,
            walletAddress: c.walletAddress,
            platforms: c.platforms,
            addedAt: c.addedAt,
          })),
        },
      },
    ],
  };
}

/**
 * Serialises a DID document to a JSON string for export or upload.
 * @param doc - The DID document object.
 * @returns Pretty-printed JSON string.
 */
export function exportDIDDocument(doc: object): string {
  return JSON.stringify(doc, null, 2);
}

/**
 * Parses an imported DID document JSON string into contacts and owner DID.
 * @param json - Raw JSON string of a DID document.
 * @returns Object with contacts array and ownerDid string.
 */
export function importDIDDocument(json: string): {
  contacts: ContactEntry[];
  ownerDid: string;
} {
  const doc = JSON.parse(json) as {
    id: string;
    service?: Array<{
      type: string;
      serviceEndpoint?: { contacts?: ContactEntry[] };
    }>;
  };

  const ownerDid = doc.id ?? '';
  const graphService = doc.service?.find(
    (s) => s.type === 'nexusvault:socialGraph'
  );
  const contacts: ContactEntry[] = (
    graphService?.serviceEndpoint?.contacts ?? []
  ).map((c) => ({
    id: c.id,
    name: c.name,
    did: c.did,
    email: c.email,
    walletAddress: c.walletAddress,
    platforms: c.platforms ?? {},
    addedAt: c.addedAt,
  }));

  return { contacts, ownerDid };
}
