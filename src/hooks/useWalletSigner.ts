import type { SignerLike } from '@lit-protocol/types';
import type { Hex, WalletClient } from 'viem';
import { useWalletClient } from 'wagmi';

function createWalletSigner(walletClient: WalletClient): SignerLike {
  const { account } = walletClient;

  if (!account) {
    throw new Error('Wallet client is connected without an active account.');
  }

  return {
    getAddress: async () => account.address,
    signMessage: async (message) =>
      walletClient.signMessage({
        account,
        message:
          typeof message === 'string'
            ? message
            : ({ raw: message as Hex }),
      }),
  };
}

export function useWalletSigner() {
  const { data: walletClient, isLoading } = useWalletClient();

  return {
    isLoading,
    signer: walletClient ? createWalletSigner(walletClient) : null,
    walletClient: walletClient ?? null,
  };
}
