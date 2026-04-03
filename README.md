# NexusVault

NexusVault is a wallet-first sovereign vault for humans and AI agents. It combines Lit-enforced encryption, Storacha-backed persistence, guarded handoffs, recovery orchestration, and continuity automation in one deployable command deck.

Live app: https://nexus-vaultx.vercel.app/
Repository: https://github.com/GearTechnologies/NexusVault

## What it does

NexusVault protects high-value secrets and collaboration state while making that state portable across devices and operator contexts.

The app is organized into five surfaces:

- `Dashboard`: readiness score, publish/restore controls, demo dataset, steward status
- `Vault`: encrypted passwords, files, notes, and API keys
- `Memory`: persistent knowledge chunks and memory packs published to Storacha
- `Handoffs`: collaborators, agent roster, task queue, delegations, audit trail
- `Recovery`: guardian quorum, Lit policy checks, continuity heartbeat, steward action

## Problem

Modern agent systems are usually weak in one or more of these areas:

- they forget state when a session ends
- they rely on centralized storage and mutable trust assumptions
- they share data poorly across agents and collaborators
- they lack recovery and continuity when wallets or operators disappear
- they treat security and usability as separate products

NexusVault addresses that by treating encrypted memory, publishable manifests, recovery bundles, and agent handoffs as one integrated system.

## Hackathon Track Alignment

### Storacha

NexusVault maps directly to three Storacha challenge themes:

1. Persistent Agent Memory
- Vault metadata, memory packs, audit records, and workspace manifests are published to Storacha.
- A wallet owner can publish a workspace head and later restore it from a different session.

2. Multi-Agent Coordination
- The Handoffs surface manages agent identities, shared tasks, delegations, and audit events.
- UCAN-based delegation is used for controlled handoffs of shareable vault items.

3. Decentralized Knowledge Base
- Vault items can be promoted into knowledge chunks and memory packs.
- These artifacts are published as content-addressed Storacha payloads for durable retrieval.

### Lit Protocol

NexusVault’s primary Lit proof is the Lit Protocol v1-style encrypted and programmable policy flow:

1. Lit-enforced encryption
- Vault payloads are encrypted client-side before leaving the browser.
- Decryption requires an authenticated wallet-backed Lit session.

2. Lit Actions for policy evaluation
- The app runs Lit policy actions for:
  - `share_item`
  - `publish_memory_snapshot`
  - `evaluate_continuity`
  - `verify_recovery_threshold`

3. Recovery and continuity
- Guardian approvals are collected and verified.
- Continuity state is evaluated against a heartbeat policy.
- Recovery and continuity checks are logged into the workspace audit trail.

### Vincent / Steward Surface

The project includes an env-gated steward surface and API routes for production wallet-automation flows:

- `GET /api/vincent/status`
- `POST /api/vincent/action`

When Vincent credentials and steward env vars are configured, the Recovery surface exposes a guarded snapshot action for a steward agent wallet. If those vars are absent, the UI degrades safely instead of breaking the app.

## Why this can score well

### Technical Execution

- Client-side Lit encryption before decentralized storage
- Explicit Storacha browser space bootstrap and publish/restore workflow
- Vercel API routes for workspace head, restore, health, steward status, and continuity cron
- Persisted versioned workspace store with migration from the previous app state
- Code-split runtime so Lit and Storacha ship as lazy chunks rather than on first paint
- Unit-tested continuity, recovery, env validation, and workspace serialization logic

### Impact / Usefulness

- Useful for individuals protecting sensitive credentials and personal digital continuity
- Useful for teams or agent operators who need portable memory and shared task state
- Reduces lock-in by keeping the durable layer decentralized and content-addressed

### Completeness / Functionality

- Working frontend with five real surfaces
- Working vault CRUD, encryption, decryption, consent, delegation, and memory-pack promotion
- Working workspace publish and restore path
- Working recovery and continuity dashboards
- Working health, steward-status, and cron endpoints

### Scalability / Future Potential

- Workspace head is mutable while manifests are immutable
- Knowledge packs can grow into larger decentralized RAG catalogs
- Handoff tasks and agent identities can scale into broader agent-orchestration systems
- Vercel-managed mutable state is supported through KV, with Blob or in-memory fallback paths when KV is not attached, while Storacha remains the source of truth for immutable artifacts

### Innovation / Creativity

- Blends vault security, decentralized memory, continuity, and agent handoffs into one workflow
- Connects Lit policy logic with Storacha persistence rather than treating them as separate demos
- Turns recovery and continuity into part of collaboration infrastructure

## Architecture

```text
Browser UI
  React 18 + Vite + Zustand + React Router + RainbowKit/Wagmi

Secure Runtime
  Lit encryption + Lit session decryption + Lit Action policy calls

Persistence Layer
  Storacha browser client for encrypted blobs and manifests
  Vercel KV preferred for mutable workspace head and steward status
  Vercel Blob fallback for deployments that have Blob attached before KV

Operational APIs
  /api/workspace/publish
  /api/workspace/head
  /api/workspace/restore
  /api/vincent/status
  /api/vincent/action
  /api/health
  /api/cron/continuity
```

## Public Interfaces

### `POST /api/workspace/publish`

Input:

```json
{
  "walletAddress": "0x...",
  "workspaceDraft": {
    "manifest": {},
    "manifestCid": "bafy...",
    "auditCid": "bafy...",
    "continuityCid": "bafy...",
    "publishedAt": 1712100000000
  },
  "clientSignature": "0x..."
}
```

Output:

```json
{
  "headCid": "bafy...",
  "manifestCid": "bafy...",
  "auditCid": "bafy...",
  "updatedAt": 1712100000000
}
```

### `GET /api/workspace/head?wallet=0x...`

Output:

```json
{
  "headCid": "bafy...",
  "manifestCid": "bafy...",
  "auditCid": "bafy...",
  "updatedAt": 1712100000000
}
```

### `POST /api/workspace/restore`

Input:

```json
{
  "headCid": "bafy..."
}
```

Output:

```json
{
  "workspace": {},
  "headCid": "bafy..."
}
```

### `GET /api/vincent/status?wallet=0x...`

Output:

```json
{
  "enabled": true,
  "installed": true,
  "agentWalletAddress": "0x...",
  "abilities": ["publish_snapshot"],
  "latestReceiptId": "vincent-..."
}
```

### `POST /api/vincent/action`

Input:

```json
{
  "walletAddress": "0x...",
  "action": "publish_snapshot",
  "payload": {
    "headCid": "bafy...",
    "manifestCid": "bafy..."
  }
}
```

Output:

```json
{
  "receiptId": "vincent-...",
  "auditEvent": {
    "status": "success",
    "summary": "Vincent steward published a guarded workspace snapshot."
  }
}
```

### `GET /api/health`

Output:

```json
{
  "ok": true,
  "storacha": "configured",
  "lit": "client-runtime",
  "vincent": "configured",
  "kv": "configured"
}
```

## Local Development

### Requirements

- Node.js 20+ recommended
- npm 10+ recommended
- an EVM wallet extension for live encryption/decryption flows

### Install

```bash
npm install
```

### Configure environment

```bash
cp .env.example .env
```

Browser/runtime vars:

- `VITE_LIT_NETWORK`
- `VITE_LIT_PKP_PUBLIC_KEY`
- `VITE_LIT_PERMITTED_ACTIONS`
- `VITE_LIT_PERMITTED_ADDRESSES`
- `VITE_STORACHA_EMAIL`
- `VITE_STORACHA_APP_NAME`
- `VITE_STORACHA_SPACE_NAME`
- `VITE_STORACHA_SPACE_DID`
- `VITE_STORACHA_AUTO_CREATE_SPACE`
- `VITE_STORACHA_GATEWAY_BASE`
- `VITE_HEARTBEAT_INTERVAL_DAYS`
- `VITE_VINCENT_ENABLED`

Server/runtime vars:

- `LIT_API_KEY`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `BLOB_READ_WRITE_TOKEN`
- `STORACHA_AGENT_KEY`
- `STORACHA_AGENT_PROOF`
- `STORACHA_SPACE_DID`
- `STORACHA_GATEWAY_BASE`
- `VINCENT_API_KEY`
- `VINCENT_AGENT_WALLET_ADDRESS`

### Run

```bash
npm run dev
```

### Test

```bash
npm run test
```

### Typecheck

```bash
npm run typecheck
```

### Full verification

```bash
npm run check
```

## Deployment

The frontend is deployed on Vercel and linked to:

- project: `kiwi-protocols-projects/nexus-vault`
- production alias: `https://nexus-vaultx.vercel.app`

Deployment files included in this repo:

- `vercel.json` with security headers, SPA rewrite, and continuity cron
- `.github/workflows/ci.yml` for install, test, typecheck, and build
- `.env.example` for browser and server config

Recommended release flow:

1. `npm run check`
2. `vercel pull --yes`
3. `vercel deploy`
4. validate preview
5. `vercel deploy --prod`

## Demo Flow

Suggested 2-5 minute demo:

1. Connect wallet.
2. Click `Load Demo Dataset`.
3. Open `Vault` and show encrypted records.
4. Decrypt one item live with Lit.
5. Mark an item shareable and delegate it.
6. Promote an item to a memory pack on `Memory`.
7. Publish the workspace head from `Dashboard`.
8. Open `Handoffs` and show agents, tasks, and audit trail.
9. Open `Recovery` and show guardian quorum plus continuity evaluation.
10. Trigger the steward snapshot action if Vincent env vars are configured.

## Tests Included

Unit tests cover:

- continuity expiry evaluation
- recovery message construction
- guardian threshold validation
- env validation warnings
- public workspace manifest generation
- readiness scoring

## Current Notes

- The app degrades safely when server-side Storacha or steward credentials are not configured.
- Workspace publish/restore still works in browser-assisted mode, with local fallback for the mutable head if the API is unavailable.
- The heaviest SDKs are lazy-loaded to keep the first route interactive faster during demos.

## References

- Storacha quickstart: https://docs.storacha.network/quickstart/
- Storacha upload guide: https://docs.storacha.network/how-to/upload/
- Storacha retrieve guide: https://docs.storacha.network/how-to/retrieve/
- Lit documentation: https://developer.litprotocol.com/
- Lit Naga documentation: https://naga.developer.litprotocol.com/
- Vincent docs: https://docs.heyvincent.ai/
