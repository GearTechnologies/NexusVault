# NexusVault

NexusVault is a sovereign personal data layer that unifies encrypted file/credential storage, social recovery, a portable social graph, consent-based data sharing, and a cryptographic dead man's switch. The entire stack runs without any central server, using Lit Protocol for decentralised encryption and Storacha for UCAN-based IPFS storage. You own your data — no backend, no custodian.

---

## Architecture

```
┌───────────────────────────────────────────────────────┐
│                    Browser (React 18)                  │
│                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │  Zustand     │  │ Lit Protocol │  │ Storacha   │  │
│  │  (persist)   │  │  v7 (Datil)  │  │  (UCAN)    │  │
│  └──────────────┘  └──────────────┘  └────────────┘  │
│         │                │                 │          │
│         └────────────────┴─────────────────┘          │
│                          │                             │
│              MetaMask / ethers v6                     │
│                (wallet signer)                        │
└───────────────────────────────────────────────────────┘
          │                         │
  Lit Node Network           IPFS / Storacha
  (threshold decrypt)        (encrypted blobs)
```

---

## Prerequisites

- **Node.js 20+**
- **MetaMask** browser extension
- **Storacha account** — sign up at [storacha.network](https://storacha.network)

---

## Environment Setup

```bash
cp .env.example .env
```

Fill in your values:

```
VITE_LIT_NETWORK=datil-test          # or datil for mainnet
VITE_STORACHA_EMAIL=your@email.com   # Storacha account email
VITE_HEARTBEAT_INTERVAL_DAYS=7       # default dead man's interval
```

---

## Installation

```bash
npm install
```

---

## Dev Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Production Build

```bash
npm run build
npm run preview
```

---

## Workflow Guide

### Step 1 — Connect wallet + create a password vault entry

1. Click **Connect Wallet** — approve MetaMask connection.
2. Navigate to **Vault** → **Add Entry**.
3. Select type **Password**, enter a label, username, and password.
4. Click **Save Entry** — Lit Protocol encrypts the payload and Storacha pins the ciphertext to IPFS.
5. Your entry appears as a card with a masked value (`••••••••`).
6. Click **Decrypt** to retrieve the plaintext via Lit session signatures.

### Step 2 — Configure social recovery with 2-of-3 guardians

1. Navigate to **Recovery**.
2. Add three guardian Ethereum addresses (use test accounts).
3. Set threshold to **2 of 3**.
4. Click **Configure Recovery** — the guardian policy is written and a recovery ID is stored locally.
5. Create a recovery approval request for a replacement wallet, then collect and verify guardian signatures until the configured threshold is reached.

### Step 3 — Export social graph as DID document

1. Navigate to **Social Graph**.
2. Add contacts with name, wallet address, and platform handles (Twitter, Farcaster, Lens).
3. Click **Export Graph** — a W3C DID document is built and uploaded to IPFS via Storacha.
4. Copy the CID or open the IPFS gateway link.
5. Click **Preview DID Doc** to inspect the raw JSON.

### Step 4 — Grant consent + delegate UCAN read access

1. Navigate to **Data Sharing**.
2. Toggle **Shareable** on a vault entry using the consent switch.
3. In **Delegation Manager** → **Grant New Delegation**, select the entry, paste a recipient DID (e.g. `did:key:z6Mk…`), choose an expiry, and click **Delegate**.
4. Copy the base64 UCAN token from the code block — this is a bearer token for read access.

### Step 5 — Configure and arm the dead man's switch

1. Navigate to **Dead Man's Switch**.
2. Enter an heir wallet address, select a heartbeat interval (7/14/30 days).
3. Ensure you have already saved at least one vault entry so the vault index exists.
4. Click **Arm Switch** — the heartbeat policy is armed against your saved vault index.
5. The status dashboard shows last heartbeat, next required check-in, and heir address.
6. Click **Check In Now** to reset the heartbeat timer.
7. Click **Evaluate Eligibility** to check whether the heartbeat window has expired.

---

## Sponsor Integrations

### Lit Protocol

- **Wallet-gated encryption** (`encryptWithWallet`): AES-GCM key is sealed to the user's Ethereum address using Lit's threshold network. No single node ever holds the full key.
- **Session signatures** (`getSessionSigs`): EIP-4361 (SIWE) session capabilities are generated via MetaMask for every decrypt operation. No `authSig` — fully v7-compliant.
- **Social recovery** (`setupSocialRecovery`): A Lit Action enforces M-of-N guardian threshold before releasing the recovery key.
- **Dead man's switch** (`deployDeadMansSwitchAction`): A Lit Action checks `block.timestamp` vs `lastHeartbeat + interval` and conditionally re-encrypts vault access to the heir.

### Storacha (w3up / UCAN)

- **Encrypted blob storage** (`uploadEncryptedBlob`): Lit ciphertexts are uploaded to IPFS via `@storacha/client`. The raw plaintext never leaves the browser.
- **Vault index** (`uploadVaultIndex`): Entry metadata (CIDs, access hashes, consent flags) is serialised to a JSON index file pinned to IPFS. The CID is stored in Zustand and persisted locally.
- **UCAN delegations** (`delegateReadAccess`): Time-limited `space/blob/*` read delegations are issued to recipient DIDs. Token is serialised via `@ucanto/core/delegation` and returned as a base64 string.

---

## Project Scope

A personal data layer that unifies encrypted file/credential storage, social recovery, a portable social graph, consent-based data sharing, and a cryptographic dead man's switch.
