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

export const wagmiConfig = createConfig({
  chains,
  connectors,
  ssr: false,
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});

export const queryClient = new QueryClient();
