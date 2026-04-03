# NexusVault

NexusVault is a sovereign collaboration vault for humans and autonomous agents.
It combines Lit-enforced encryption and policy logic with Storacha-backed
persistent memory, UCAN delegation, portable trust graphs, social recovery, and
continuity automation.

This submission is designed for the PL Genesis: Frontier of Collaboration
Hackathon 2026, with explicit alignment to the Storacha and Lit Protocol tracks.

Live deployment: https://nexus-vaultx.vercel.app/
GitHub repository: https://github.com/GearTechnologies/NexusVault

## Why NexusVault

Most agent products are stateless, brittle, and custodial:

- restart the app and context disappears
- switch devices and preferences vanish
- collaborate with other agents and sharing becomes ad hoc
- lose a wallet and the whole system becomes inaccessible
- grant access and it is often all-or-nothing instead of policy-based

NexusVault fixes that by treating encrypted memory, coordination state, and
continuity rules as first-class primitives.

## Track Alignment

### Storacha Track Alignment

NexusVault directly maps to three Storacha challenge themes:

1. Persistent Agent Memory

- Agent profiles, knowledge packs, vault indexes, and workspace manifests are
  published to Storacha.
- The coordination state is content-addressed, portable, and reconstructable on
  any device.

2. Multi-Agent Coordination

- NexusVault includes an agent registry, shared task queue, activity feed, and
  UCAN-based delegation controls.
- Agent A can prepare memory, Agent B can receive delegated access, and both can
  operate from the same Storacha-backed coordination snapshot.

3. Decentralized RAG Knowledge Base

- Encrypted vault entries can be promoted into reusable knowledge packs.
- Public manifests and content-addressed CIDs make the knowledge layer durable
  and verifiable.

### Lit Protocol Track Alignment

NexusVault uses Lit for decentralized cryptographic control across the product:

1. Encrypted data access

- Vault payloads are encrypted client-side and only decryptable through Lit
  access control conditions tied to the authorized wallet.

2. Programmable policy execution

- Lit Actions are used for social recovery orchestration and a resilience policy
  simulation that scores operational readiness before handoff.

3. Key continuity and automation

- Guardian thresholds and the dead man’s switch create programmable, policy-led
  continuity around high-value secrets and collaboration state.

## Core Product Capabilities

- Encrypted Vault
  Store passwords, notes, files, and API keys with Lit-enforced decryption.
- Storacha Memory Mesh
  Publish workspace manifests, vault indexes, and social graph state to
  Storacha.
- UCAN Delegation
  Mark assets as shareable and issue time-bound delegations to downstream DIDs.
- Agent Coordination Board
  Register agent identities, queue tasks, publish knowledge packs, and track
  activity in one place.
- Social Recovery
  Configure a guardian quorum and verify recovery approvals.
- Trust Graph Export
  Export collaborators as a DID-linked social graph.
- Dead Man’s Switch
  Arm heartbeat-based continuity logic for inheritance or failover.
- Crash Containment + Safer Deploy
  Error boundary protection, SPA rewrites for Vercel, and lazy route loading.

## Architecture

```text
┌────────────────────────────────────────────────────────────────────┐
│                            Browser UI                             │
│                 React 18 + Vite + Zustand + Tailwind             │
├────────────────────────────────────────────────────────────────────┤
│ Command Center │ Coordination Mesh │ Vault │ Sharing │ Recovery  │
├────────────────────────────────────────────────────────────────────┤
│ Lit Protocol                                                   │
│ - access-controlled encryption                                 │
│ - session-based decryption                                     │
│ - Lit Action policy execution                                  │
│ - guardian / continuity logic                                  │
├────────────────────────────────────────────────────────────────────┤
│ Storacha                                                       │
│ - encrypted blob uploads                                       │
│ - vault index persistence                                      │
│ - workspace manifest publishing                                │
│ - UCAN delegation                                              │
├────────────────────────────────────────────────────────────────────┤
│ Wallet Layer                                                   │
│ - RainbowKit + wagmi                                           │
│ - signer-backed Lit sessions                                   │
│ - DID-linked operator identity                                 │
└────────────────────────────────────────────────────────────────────┘
```

## What Makes This Competitive

### Technical Execution

- Client-side encryption before decentralized storage
- Route-level lazy loading to avoid shipping every flow on first paint
- Dedicated coordination model for agents, tasks, knowledge packs, and manifests
- Unified state model with persisted migrations
- Vercel SPA rewrite support so nested routes do not break on refresh
- Error boundary to prevent whole-app failure during demos

### Impact / Usefulness

- Useful for individuals, families, and teams managing sensitive digital assets
- Gives AI agents durable memory without central backend lock-in
- Enables safer collaboration through selective, time-bound delegation
- Solves continuity problems around wallet loss, operator absence, and recovery

### Completeness / Functionality

- Deployed frontend
- End-to-end flows for encrypt, decrypt, delegate, recover, export, publish
- Hackathon demo path built directly into the Command Center and Coordination UI

### Scalability / Future Potential

- Content-addressed manifests can grow into multi-device sync and long-lived
  memory replay
- Knowledge packs can evolve into a fully decentralized RAG layer
- Task queue + agent registry can back larger multi-agent orchestration systems

### Innovation / Creativity

- Blends vault security, inheritance, trust graphs, and agent memory into one
  product
- Treats continuity as part of collaboration, not a separate “backup” feature
- Uses Storacha and Lit together as infrastructure for resilient coordination

## Demo Walkthrough

Recommended judge flow:

1. Connect a wallet.
2. Click `Load Demo Workspace` on the Command Center.
3. Open `Coordination` and inspect:
   agent registry, shared tasks, knowledge packs, and Lit policy scoring.
4. Open `Vault` and add an encrypted secret.
5. Open `UCAN Sharing` and mark the secret shareable.
6. Issue a delegation to a recipient DID.
7. Return to `Coordination` and publish a Storacha snapshot.
8. Open `Recovery` and configure guardians.
9. Open `Continuity` and arm the dead man’s switch.
10. Open `Trust Graph` and export the social graph manifest.

## Repository Structure

```text
src/
  components/
    coordination/     # agent registry, tasks, knowledge publishing
    deadmans/         # heartbeat continuity controls
    graph/            # trust graph export/import
    recovery/         # guardian setup + recovery approvals
    sharing/          # consent toggles + UCAN delegation UI
    vault/            # encrypted asset creation and viewing
  hooks/
    useVault.ts       # encrypted vault CRUD and Storacha/Lit flows
    useWorkspace.ts   # agent coordination, policy scoring, manifest publishing
  lib/
    lit.ts            # Lit client, sessions, encryption, Lit Actions
    storacha.ts       # Storacha client, space readiness, upload, delegation
    did.ts            # DID document export/import helpers
  store/
    vault.ts          # persisted app state
  types/
    nexus.ts          # shared types for agents, tasks, knowledge packs
```

## Environment Variables

Copy `.env.example` to `.env` and fill in the values you want to use:

```bash
cp .env.example .env
```

| Variable | Purpose |
| --- | --- |
| `VITE_LIT_NETWORK` | Lit network name. The current browser demo defaults to `datil-test`. |
| `VITE_STORACHA_EMAIL` | Email used for the Storacha browser login flow. |
| `VITE_STORACHA_APP_NAME` | App name shown during Storacha auth. |
| `VITE_STORACHA_SPACE_NAME` | Auto-created Storacha space name when no active space exists. |
| `VITE_STORACHA_SPACE_DID` | Optional explicit space DID to use instead of auto-selection. |
| `VITE_STORACHA_AUTO_CREATE_SPACE` | Set to `false` if you want to manage spaces manually. |
| `VITE_HEARTBEAT_INTERVAL_DAYS` | Default continuity interval for the dead man’s switch. |
| `LIT_API_KEY` | Reserved for extended Lit integrations and hosted flows. |

## Local Development

Install dependencies:

```bash
npm install
```

Start the app:

```bash
npm run dev
```

Typecheck:

```bash
npm run typecheck
```

Build for production:

```bash
npm run build
```

## Storacha Notes

- Storacha is public, so NexusVault only uploads encrypted vault payloads or
  non-secret coordination manifests.
- On first use, the browser client may trigger the Storacha email login flow.
- If no active space is selected, NexusVault can automatically create one using
  `VITE_STORACHA_SPACE_NAME`.

## Security Model

- Secrets are encrypted before upload.
- Decryption requires a Lit session generated from the connected wallet.
- Delegations are time-bound and scoped through UCANs.
- Recovery requires guardian approvals.
- Continuity logic is separated from raw ciphertext storage.

## Deployment

NexusVault is a Vite SPA and includes `vercel.json` rewrites so deep links work
correctly on Vercel.

Recommended deployment path:

```bash
npm run build
vercel --prod
```

Current public deployment:

- https://nexus-vaultx.vercel.app/

## Submission Assets Checklist

- [x] Working frontend prototype
- [x] Public source repository
- [x] README with setup, architecture, and demo flow
- [x] Storacha integration proof
- [x] Lit integration proof
- [ ] Demo video (record separately)

## Future Roadmap

- Upgrade the agent mesh into a fully replayable decentralized memory timeline
- Add richer knowledge indexing for decentralized RAG retrieval
- Expand continuity policies into conditional asset release and DAO workflows
- Add server-sponsored delegation flows for broader non-technical onboarding

## References

- Storacha docs: https://docs.storacha.network/
- Storacha AI quickstart: https://docs.storacha.network/ai/quickstart/
- Storacha upload guide: https://docs.storacha.network/how-to/upload/
- Lit Protocol docs: https://developer.litprotocol.com/
- Lit SDK intro: https://developer.litprotocol.com/sdk/introduction
