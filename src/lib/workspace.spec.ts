import { describe, expect, it } from 'vitest';
import {
  buildPublicWorkspaceManifest,
  computeWorkspaceReadiness,
  createEmptyWorkspace,
} from './workspace';

describe('workspace manifest', () => {
  it('keeps encrypted payload internals out of the public manifest', () => {
    const workspace = createEmptyWorkspace();
    workspace.walletAddress = '0x123';
    workspace.items = [
      {
        id: 'item-1',
        type: 'note',
        label: 'Launch note',
        cid: 'bafy-note',
        ciphertext: 'encrypted-value',
        dataToEncryptHash: 'hash',
        createdAt: 1,
        updatedAt: 2,
        consentEnabled: true,
        tags: ['note'],
        knowledgeChunkIds: [],
        delegations: [],
      },
    ];

    const manifest = buildPublicWorkspaceManifest(workspace);

    expect(manifest.items[0]).not.toHaveProperty('ciphertext');
    expect(manifest.items[0]).not.toHaveProperty('dataToEncryptHash');
    expect(manifest.items[0]).toHaveProperty('cid', 'bafy-note');
  });
});

describe('workspace readiness', () => {
  it('returns a full score when all judge checkpoints are present', () => {
    const workspace = createEmptyWorkspace();
    workspace.items = [
      {
        id: 'item-1',
        type: 'note',
        label: 'Launch note',
        cid: 'bafy-note',
        ciphertext: 'encrypted-value',
        dataToEncryptHash: 'hash',
        createdAt: 1,
        updatedAt: 2,
        consentEnabled: true,
        tags: ['note'],
        knowledgeChunkIds: ['chunk-1'],
        delegations: [],
      },
    ];
    workspace.memoryPacks = [
      {
        id: 'pack-1',
        title: 'Launch pack',
        summary: 'Ready',
        scope: 'shared',
        sourceItemIds: ['item-1'],
        chunkIds: ['chunk-1'],
        manifestCid: 'bafy-pack',
        createdAt: 1,
        updatedAt: 2,
        tags: ['launch'],
      },
    ];
    workspace.workspaceHead = {
      walletAddress: '0x123',
      headCid: 'bafy-head',
      manifestCid: 'bafy-manifest',
      auditCid: 'bafy-audit',
      updatedAt: 2,
    };
    workspace.recovery.guardians = ['0x1', '0x2'];
    workspace.recovery.threshold = 2;
    workspace.continuity.switchArmed = true;
    workspace.agents = [
      {
        id: 'agent-1',
        name: 'Steward',
        did: 'did:key:steward',
        role: 'Publisher',
        status: 'ready',
        lastSeenAt: 1,
        capabilities: ['publish_memory_snapshot'],
        summary: 'Ready',
      },
    ];
    workspace.handoffTasks = [
      {
        id: 'task-1',
        title: 'Publish',
        description: 'Publish',
        priority: 'high',
        status: 'active',
        ownerAgentId: 'agent-1',
        relatedItemIds: ['item-1'],
        createdAt: 1,
        updatedAt: 2,
      },
    ];

    expect(computeWorkspaceReadiness(workspace).score).toBe(100);
  });
});
