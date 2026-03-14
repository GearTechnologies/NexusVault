/**
 * App.tsx — React Router v6 setup with guarded routes.
 */

import type { ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { VaultPage } from './pages/VaultPage';
import { RecoveryPage } from './pages/RecoveryPage';
import { SharingPage } from './pages/SharingPage';
import { GraphPage } from './pages/GraphPage';
import { DeadMansPage } from './pages/DeadMansPage';
import { Dashboard } from './components/Dashboard';
import { useVaultStore } from './store/vault';

function RequireWallet({ children }: { children: ReactNode }) {
  const walletAddress = useVaultStore((s) => s.walletAddress);
  if (!walletAddress) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route
          path="/vault"
          element={
            <RequireWallet>
              <VaultPage />
            </RequireWallet>
          }
        />
        <Route
          path="/recovery"
          element={
            <RequireWallet>
              <RecoveryPage />
            </RequireWallet>
          }
        />
        <Route
          path="/sharing"
          element={
            <RequireWallet>
              <SharingPage />
            </RequireWallet>
          }
        />
        <Route
          path="/graph"
          element={
            <RequireWallet>
              <GraphPage />
            </RequireWallet>
          }
        />
        <Route
          path="/deadmans"
          element={
            <RequireWallet>
              <DeadMansPage />
            </RequireWallet>
          }
        />
        <Route
          path="/dashboard"
          element={
            <RequireWallet>
              <Dashboard />
            </RequireWallet>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
