/**
 * useWallet — RainbowKit + wagmi wallet state helpers.
 */

import { useCallback } from 'react';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect } from 'wagmi';

/**
 * Provides wallet connection state and actions for RainbowKit.
 * @returns connect, disconnect, isConnected, walletAddress, shortAddress.
 */
export function useWallet() {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { disconnectAsync } = useDisconnect();

  const connect = useCallback(async () => {
    if (!openConnectModal) {
      throw new Error('Wallet connection modal is unavailable right now.');
    }

    openConnectModal();
  }, [openConnectModal]);

  const disconnect = useCallback(async () => {
    await disconnectAsync();
  }, [disconnectAsync]);

  const walletAddress = address ?? null;
  const shortAddress = walletAddress
    ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(
        walletAddress.length - 4
      )}`
    : null;

  return { connect, disconnect, isConnected, walletAddress, shortAddress };
}
