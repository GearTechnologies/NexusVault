const RPC_TIMEOUT_MS = 12000;

function getEnvRpc(chain) {
  if (chain === 'mainnet') {
    return (
      process.env.MAINNET_RPC_URL ||
      process.env.ETHEREUM_RPC_URL ||
      process.env.RPC_URL_MAINNET ||
      null
    );
  }

  if (chain === 'sepolia') {
    return (
      process.env.SEPOLIA_RPC_URL ||
      process.env.ETHEREUM_SEPOLIA_RPC_URL ||
      process.env.RPC_URL_SEPOLIA ||
      null
    );
  }

  return null;
}

function getFallbackRpcUrls(chain) {
  if (chain === 'mainnet') {
    return [
      'https://eth.merkle.io',
      'https://ethereum-rpc.publicnode.com',
      'https://cloudflare-eth.com',
    ];
  }

  if (chain === 'sepolia') {
    return [
      'https://ethereum-sepolia-rpc.publicnode.com',
      'https://rpc.sepolia.org',
      'https://rpc2.sepolia.org',
    ];
  }

  return [];
}

async function fetchRpc(url, body) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), RPC_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    return response;
  } finally {
    clearTimeout(timeout);
  }
}

export async function proxyRpcRequest(chain, body) {
  const urls = [getEnvRpc(chain), ...getFallbackRpcUrls(chain)].filter(Boolean);
  let lastError = null;

  for (const url of urls) {
    try {
      const response = await fetchRpc(url, body);
      if (!response.ok) {
        lastError = new Error(`RPC upstream ${url} returned ${response.status}.`);
        continue;
      }

      return {
        status: response.status,
        bodyText: await response.text(),
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw (
    lastError ??
    new Error(`No RPC upstreams are configured for ${chain}.`)
  );
}
