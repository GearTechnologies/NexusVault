import type { ContactEntry } from '../lib/did';

export type VaultItemType = 'password' | 'file' | 'note' | 'contact' | 'api_key';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'queued' | 'active' | 'blocked' | 'completed';
export type AuditEventStatus = 'info' | 'success' | 'warning' | 'error';

export interface DelegationRecord {
  id: string;
  recipientDid: string;
  expiresAt: number;
  token: string;
  capability: string;
  createdAt: number;
}

export interface VaultItemManifest {
  id: string;
  type: VaultItemType;
  label: string;
  cid: string;
  dataToEncryptHash: string;
  ciphertext: string;
  createdAt: number;
  updatedAt: number;
  consentEnabled: boolean;
  tags: string[];
  knowledgeChunkIds: string[];
  delegations: DelegationRecord[];
}

export interface KnowledgeChunk {
  id: string;
  label: string;
  summary: string;
  sourceItemIds: string[];
  cid: string | null;
  createdAt: number;
  updatedAt: number;
  tags: string[];
}

export interface MemoryPack {
  id: string;
  title: string;
  summary: string;
  scope: 'private' | 'shared' | 'public';
  sourceItemIds: string[];
  chunkIds: string[];
  manifestCid: string | null;
  createdAt: number;
  updatedAt: number;
  tags: string[];
}

export interface AgentProfile {
  id: string;
  name: string;
  did: string;
  walletAddress?: string;
  role: string;
  status: 'ready' | 'busy' | 'offline';
  lastSeenAt: number | null;
  capabilities: string[];
  summary: string;
}

export interface HandoffTask {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  ownerAgentId: string;
  assigneeAgentId?: string;
  relatedItemIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface AuditEvent {
  id: string;
  type:
    | 'workspace_publish'
    | 'workspace_restore'
    | 'memory_pack'
    | 'delegation'
    | 'recovery'
    | 'continuity'
    | 'vincent'
    | 'knowledge_chunk'
    | 'vault_item';
  status: AuditEventStatus;
  summary: string;
  actor: string;
  createdAt: number;
  targetId?: string;
  cid?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface RecoveryApproval {
  guardianAddress: string;
  signature: string;
  approvedAt: number;
}

export interface RecoveryRequest {
  createdAt: number;
  targetAddress: string;
  message: string;
  approvals: RecoveryApproval[];
}

export interface RecoveryPolicy {
  guardians: string[];
  threshold: number;
  recoveryId: string | null;
  policyPkpPublicKey: string | null;
  permittedAddresses: string[];
  permittedActions: string[];
  recoveryRequest: RecoveryRequest | null;
  lastVerificationAt: number | null;
}

export interface ContinuityPolicy {
  heirAddress: string | null;
  intervalDays: number;
  switchArmed: boolean;
  lastHeartbeat: number | null;
  lastEvaluationAt: number | null;
}

export interface WorkspaceHead {
  walletAddress: string;
  headCid: string | null;
  manifestCid: string | null;
  auditCid: string | null;
  updatedAt: number;
}

export interface StorachaStatus {
  spaceDid: string | null;
  currentManifestCid: string | null;
  currentAuditCid: string | null;
  lastPublishedAt: number | null;
  lastRestoreCid: string | null;
}

export interface VincentStatus {
  enabled: boolean;
  installed: boolean;
  agentWalletAddress: string | null;
  abilities: string[];
  latestReceiptId: string | null;
  lastActionAt: number | null;
}

export interface VaultWorkspace {
  version: number;
  walletAddress: string | null;
  items: VaultItemManifest[];
  knowledgeChunks: KnowledgeChunk[];
  memoryPacks: MemoryPack[];
  agents: AgentProfile[];
  handoffTasks: HandoffTask[];
  contacts: ContactEntry[];
  auditTrail: AuditEvent[];
  recovery: RecoveryPolicy;
  continuity: ContinuityPolicy;
  workspaceHead: WorkspaceHead | null;
  storacha: StorachaStatus;
  vincent: VincentStatus;
}
