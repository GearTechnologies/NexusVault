import { QueryClient } from '@tanstack/react-query';
import type { CreateConnectorFn } from 'wagmi';
import { createConfig, http } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { injected, safe } from 'wagmi/connectors';

const chains = [mainnet, sepolia] as const;

const connectors: CreateConnectorFn[] = [
  safe({ shimDisconnect: true }),
  injected({ shimDisconnect: true }),
];

function createRpcProxyUrl(path: string) {
  if (typeof window !== 'undefined') {
    return new URL(path, window.location.origin).toString();
  }

  return path;
}

export const wagmiConfig = createConfig({
  chains,
  connectors,
  ssr: false,
  transports: {
    [mainnet.id]: http(createRpcProxyUrl('/api/rpc/mainnet')),
    [sepolia.id]: http(createRpcProxyUrl('/api/rpc/sepolia')),
  },
});

export const queryClient = new QueryClient();
