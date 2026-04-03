export function getWorkspaceHeadKey(walletAddress) {
  return `nexusvault:workspace:head:${walletAddress.toLowerCase()}`;
}

export function getVincentStatusKey(walletAddress) {
  return `nexusvault:vincent:status:${walletAddress.toLowerCase()}`;
}

export function buildPublishMessage({
  walletAddress,
  manifestCid,
  auditCid,
  publishedAt,
}) {
  return [
    'NexusVault Workspace Publish',
    `Wallet: ${walletAddress}`,
    `Manifest CID: ${manifestCid}`,
    `Audit CID: ${auditCid}`,
    `Published At: ${new Date(publishedAt).toISOString()}`,
  ].join('\n');
}
