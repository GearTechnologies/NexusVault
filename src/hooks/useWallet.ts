/**
 * useWallet — MetaMask connection and ethers signer management.
 */

import { useCallback } from 'react';
import { ethers } from 'ethers';
import { useVaultStore } from '../store/vault';

/**
 * Provides wallet connection state and actions for MetaMask integration.
 * @returns connect, disconnect, isConnected, walletAddress, shortAddress.
 */
export function useWallet() {
  const walletAddress = useVaultStore((s) => s.walletAddress);
  const setWallet = useVaultStore((s) => s.setWallet);
  const clearWallet = useVaultStore((s) => s.clearWallet);
  const setError = useVaultStore((s) => s.setError);
  const setLoading = useVaultStore((s) => s.setLoading);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError(
        'MetaMask is not installed. Please install MetaMask to continue.'
      );
      return;
    }
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setWallet(address, signer);
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setWallet, setError, setLoading]);

  const disconnect = useCallback(() => {
    clearWallet();
  }, [clearWallet]);

  const isConnected = walletAddress !== null;

  const shortAddress = walletAddress
    ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(
        walletAddress.length - 4
      )}`
    : null;

  return { connect, disconnect, isConnected, walletAddress, shortAddress };
}
