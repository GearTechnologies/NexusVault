/**
 * Home page — redirects to vault if connected, otherwise shows ConnectWallet.
 */

import { Navigate } from 'react-router-dom';
import { ConnectWallet } from '../components/ConnectWallet';
import { useWallet } from '../hooks/useWallet';

/** Landing page with wallet connection. */
export function Home() {
  const { walletAddress } = useWallet();

  if (walletAddress) {
    return <Navigate to="/vault" replace />;
  }

  return <ConnectWallet />;
}
