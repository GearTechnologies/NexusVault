/**
 * Home page — redirects to vault if connected, otherwise shows ConnectWallet.
 */

import { Navigate } from 'react-router-dom';
import { useVaultStore } from '../store/vault';
import { ConnectWallet } from '../components/ConnectWallet';

/** Landing page with wallet connection. */
export function Home() {
  const walletAddress = useVaultStore((s) => s.walletAddress);

  if (walletAddress) {
    return <Navigate to="/vault" replace />;
  }

  return <ConnectWallet />;
}
