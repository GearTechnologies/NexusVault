const browserEnv = import.meta.env;

export interface BrowserEnv {
  litNetwork: string;
  storachaEmail?: string;
  storachaAppName: string;
  storachaSpaceName: string;
  storachaSpaceDid?: string;
  storachaAutoCreateSpace: boolean;
  storachaGatewayBase: string;
  heartbeatIntervalDays: number;
  vincentEnabled: boolean;
  vincentStatusEndpoint: string;
  vincentActionEndpoint: string;
}

export function getBrowserEnv(): BrowserEnv {
  return {
    litNetwork: browserEnv.VITE_LIT_NETWORK ?? 'datil-test',
    storachaEmail: browserEnv.VITE_STORACHA_EMAIL,
    storachaAppName: browserEnv.VITE_STORACHA_APP_NAME ?? 'NexusVault',
    storachaSpaceName: browserEnv.VITE_STORACHA_SPACE_NAME ?? 'NexusVault Space',
    storachaSpaceDid: browserEnv.VITE_STORACHA_SPACE_DID,
    storachaAutoCreateSpace: browserEnv.VITE_STORACHA_AUTO_CREATE_SPACE !== 'false',
    storachaGatewayBase:
      browserEnv.VITE_STORACHA_GATEWAY_BASE ?? 'https://w3s.link/ipfs',
    heartbeatIntervalDays: Number(browserEnv.VITE_HEARTBEAT_INTERVAL_DAYS ?? 7),
    vincentEnabled: browserEnv.VITE_VINCENT_ENABLED === 'true',
    vincentStatusEndpoint: '/api/vincent/status',
    vincentActionEndpoint: '/api/vincent/action',
  };
}

export function validateBrowserEnv() {
  const env = getBrowserEnv();
  const warnings: string[] = [];

  if (!env.storachaEmail) {
    warnings.push('Storacha email is not configured. Browser space bootstrap will be limited.');
  }

  if (!env.litNetwork) {
    warnings.push('Lit network is not configured.');
  }

  return warnings;
}
