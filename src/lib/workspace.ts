import { v4 as uuidv4 } from 'uuid';
import type {
  AgentProfile,
  AuditEvent,
  ContinuityPolicy,
  HandoffTask,
  KnowledgeChunk,
  MemoryPack,
  RecoveryPolicy,
  VaultItemManifest,
  VaultWorkspace,
} from '../types/workspace';
import type { ContactEntry } from './did';
import { evaluateContinuity } from './continuity';

export const WORKSPACE_VERSION = 2;

export function createEmptyRecoveryPolicy(): RecoveryPolicy {
  return {
    guardians: [],
    threshold: 2,
    recoveryId: null,
    policyPkpPublicKey: null,
    permittedAddresses: [],
    permittedActions: [
      'share_item',
      'publish_memory_snapshot',
      'evaluate_continuity',
      'verify_recovery_threshold',
    ],
    recoveryRequest: null,
    lastVerificationAt: null,
  };
}

export function createEmptyContinuityPolicy(intervalDays = 7): ContinuityPolicy {
  return {
    heirAddress: null,
    intervalDays,
    switchArmed: false,
    lastHeartbeat: null,
    lastEvaluationAt: null,
  };
}

export function createEmptyWorkspace(intervalDays = 7): VaultWorkspace {
  return {
    version: WORKSPACE_VERSION,
    walletAddress: null,
    items: [],
    knowledgeChunks: [],
    memoryPacks: [],
    agents: [],
    handoffTasks: [],
    contacts: [],
    auditTrail: [],
    recovery: createEmptyRecoveryPolicy(),
    continuity: createEmptyContinuityPolicy(intervalDays),
    workspaceHead: null,
    storacha: {
      spaceDid: null,
      currentManifestCid: null,
      currentAuditCid: null,
      lastPublishedAt: null,
      lastRestoreCid: null,
    },
    vincent: {
      enabled: false,
      installed: false,
      agentWalletAddress: null,
      abilities: [],
      latestReceiptId: null,
      lastActionAt: null,
    },
  };
}

export function buildPublicWorkspaceManifest(workspace: VaultWorkspace) {
  return {
    version: workspace.version,
    walletAddress: workspace.walletAddress,
    workspaceHead: workspace.workspaceHead,
    storacha: workspace.storacha,
    vincent: workspace.vincent,
    items: workspace.items.map((item) => ({
      id: item.id,
      type: item.type,
      label: item.label,
      cid: item.cid,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      consentEnabled: item.consentEnabled,
      tags: item.tags,
      knowledgeChunkIds: item.knowledgeChunkIds,
      delegations: item.delegations.map((delegation) => ({
        id: delegation.id,
        recipientDid: delegation.recipientDid,
        expiresAt: delegation.expiresAt,
        capability: delegation.capability,
        createdAt: delegation.createdAt,
      })),
    })),
    knowledgeChunks: workspace.knowledgeChunks,
    memoryPacks: workspace.memoryPacks,
    agents: workspace.agents,
    handoffTasks: workspace.handoffTasks,
    contacts: workspace.contacts,
    recovery: {
      guardians: workspace.recovery.guardians,
      threshold: workspace.recovery.threshold,
      recoveryId: workspace.recovery.recoveryId,
      policyPkpPublicKey: workspace.recovery.policyPkpPublicKey,
      permittedAddresses: workspace.recovery.permittedAddresses,
      permittedActions: workspace.recovery.permittedActions,
      lastVerificationAt: workspace.recovery.lastVerificationAt,
      approvalCount: workspace.recovery.recoveryRequest?.approvals.length ?? 0,
    },
    continuity: workspace.continuity,
    auditTrail: workspace.auditTrail,
  };
}

export function createAuditEvent(
  input: Omit<AuditEvent, 'id' | 'createdAt'>
): AuditEvent {
  return {
    id: uuidv4(),
    createdAt: Date.now(),
    ...input,
  };
}

export function computeWorkspaceReadiness(workspace: VaultWorkspace) {
  const checks = [
    {
      id: 'vault',
      label: 'Encrypted vault data',
      complete: workspace.items.length > 0,
    },
    {
      id: 'memory',
      label: 'Memory packs prepared',
      complete: workspace.memoryPacks.length > 0,
    },
    {
      id: 'publish',
      label: 'Workspace head published',
      complete: Boolean(workspace.workspaceHead?.headCid),
    },
    {
      id: 'recovery',
      label: 'Recovery guardians configured',
      complete: workspace.recovery.guardians.length >= workspace.recovery.threshold,
    },
    {
      id: 'continuity',
      label: 'Continuity policy armed',
      complete: workspace.continuity.switchArmed,
    },
    {
      id: 'agents',
      label: 'Agent coordination ready',
      complete: workspace.agents.length > 0 && workspace.handoffTasks.length > 0,
    },
  ];

  const completeCount = checks.filter((check) => check.complete).length;

  return {
    score: Math.round((completeCount / checks.length) * 100),
    checks,
    continuity: evaluateContinuity(
      workspace.continuity.lastHeartbeat,
      workspace.continuity.intervalDays
    ),
  };
}

export function createKnowledgeChunkFromItem(
  item: VaultItemManifest,
  summary: string
): KnowledgeChunk {
  const now = Date.now();

  return {
    id: uuidv4(),
    label: `${item.label} knowledge chunk`,
    summary,
    sourceItemIds: [item.id],
    cid: item.cid,
    createdAt: now,
    updatedAt: now,
    tags: item.tags,
  };
}

export function createMemoryPackFromChunk(
  chunk: KnowledgeChunk,
  title: string,
  summary: string
): MemoryPack {
  const now = Date.now();

  return {
    id: uuidv4(),
    title,
    summary,
    scope: 'shared',
    sourceItemIds: chunk.sourceItemIds,
    chunkIds: [chunk.id],
    manifestCid: null,
    createdAt: now,
    updatedAt: now,
    tags: chunk.tags,
  };
}

export function createDemoWorkspace(walletAddress: string | null): Partial<VaultWorkspace> {
  const now = Date.now();

  const agents: AgentProfile[] = [
    {
      id: uuidv4(),
      name: 'Steward',
      did: 'did:key:z6Mksteward',
      role: 'Memory publisher',
      status: 'ready',
      lastSeenAt: now,
      capabilities: ['publish_memory_snapshot', 'append_audit_log'],
      summary: 'Keeps encrypted workspace state synchronized across devices.',
      walletAddress: undefined,
    },
    {
      id: uuidv4(),
      name: 'Sentinel',
      did: 'did:key:z6Mksentinel',
      role: 'Recovery verifier',
      status: 'busy',
      lastSeenAt: now - 1000 * 60 * 17,
      capabilities: ['verify_recovery_threshold', 'evaluate_continuity'],
      summary: 'Validates guardian quorum and continuity release conditions.',
      walletAddress: undefined,
    },
  ];

  const contacts: ContactEntry[] = [
    {
      id: uuidv4(),
      name: 'Ada Ops',
      did: 'did:key:z6Mkadaops',
      email: 'ada@example.com',
      walletAddress: '0x11c44d7D99f5B37c8C4FecA540ec4B7796dE0001',
      platforms: {
        farcaster: '@adaops',
        twitter: '@adaops',
      },
      addedAt: now,
    },
    {
      id: uuidv4(),
      name: 'Neo Guardian',
      did: 'did:key:z6Mkguardian',
      email: 'neo@example.com',
      walletAddress: '0x11c44d7D99f5B37c8C4FecA540ec4B7796dE0002',
      platforms: {
        lens: '@neo.guardian',
      },
      addedAt: now,
    },
  ];

  const tasks: HandoffTask[] = [
    {
      id: uuidv4(),
      title: 'Publish investor update knowledge pack',
      description: 'Turn the latest investor note into a shared memory pack for downstream agents.',
      priority: 'high',
      status: 'active',
      ownerAgentId: agents[0].id,
      assigneeAgentId: agents[1].id,
      relatedItemIds: [],
      createdAt: now - 1000 * 60 * 45,
      updatedAt: now - 1000 * 60 * 5,
    },
    {
      id: uuidv4(),
      title: 'Verify guardian quorum before release',
      description: 'Confirm that the recovery bundle can be executed if the owner misses heartbeat.',
      priority: 'medium',
      status: 'queued',
      ownerAgentId: agents[1].id,
      assigneeAgentId: agents[0].id,
      relatedItemIds: [],
      createdAt: now - 1000 * 60 * 25,
      updatedAt: now - 1000 * 60 * 25,
    },
  ];

  return {
    walletAddress,
    agents,
    contacts,
    handoffTasks: tasks,
    recovery: {
      ...createEmptyRecoveryPolicy(),
      guardians: contacts
        .map((contact) => contact.walletAddress)
        .filter((wallet): wallet is string => Boolean(wallet)),
      threshold: 2,
      recoveryId: `demo-recovery-${now}`,
      policyPkpPublicKey: 'pkp-demo-policy-public-key',
      permittedAddresses: walletAddress ? [walletAddress] : [],
    },
    continuity: {
      heirAddress: contacts[0].walletAddress ?? null,
      intervalDays: 7,
      switchArmed: true,
      lastHeartbeat: Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 2,
      lastEvaluationAt: null,
    },
    vincent: {
      enabled: true,
      installed: true,
      agentWalletAddress: '0xBEEf00000000000000000000000000000000BEEF',
      abilities: ['publish_snapshot'],
      latestReceiptId: 'vincent-demo-receipt',
      lastActionAt: now - 1000 * 60 * 11,
    },
  };
}
