/**
 * Full-width dark-themed layout with sidebar navigation and top bar.
 */

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { NavLink, Outlet } from 'react-router-dom';
import { useVaultStore } from '../store/vault';
import { useWallet } from '../hooks/useWallet';

const NAV_LINKS = [
  { to: '/vault', label: 'Vault', icon: '🔐' },
  { to: '/recovery', label: 'Recovery', icon: '🛡️' },
  { to: '/sharing', label: 'Sharing', icon: '🔗' },
  { to: '/graph', label: 'Social Graph', icon: '🌐' },
  { to: '/deadmans', label: "Dead Man's Switch", icon: '⏰' },
];

/** Main application layout with sidebar and top bar. */
export function Layout() {
  const isLoading = useVaultStore((s) => s.isLoading);
  const error = useVaultStore((s) => s.error);
  const setError = useVaultStore((s) => s.setError);
  const { isConnected } = useWallet();

  return (
    <div className="flex min-h-screen flex-col bg-gray-950 text-gray-50 md:h-screen md:flex-row md:overflow-hidden">
      {/* Sidebar */}
      <aside className="w-full shrink-0 border-b border-gray-700 bg-gray-900 md:w-64 md:border-b-0 md:border-r">
        <div className="border-b border-gray-700 px-4 py-4 md:p-6">
          <h1 className="text-xl font-semibold text-indigo-400">NexusVault</h1>
          <p className="mt-1 text-xs text-gray-400">Sovereign Data Layer</p>
        </div>
        <nav
          className="flex gap-2 overflow-x-auto px-3 py-3 md:flex-1 md:flex-col md:space-y-1 md:px-4 md:py-4"
          aria-label="Main navigation"
        >
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex min-w-max items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 md:w-full ${
                  isActive
                    ? 'bg-indigo-600 text-white font-medium'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`
              }
              aria-label={`Navigate to ${link.label}`}
            >
              <span aria-hidden="true">{link.icon}</span>
              <span className="whitespace-nowrap">{link.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex min-h-16 items-center justify-between border-b border-gray-700 bg-gray-900 px-4 py-3 md:px-6">
          <div />
          {isConnected && (
            <ConnectButton accountStatus="address" chainStatus="icon" showBalance={false} />
          )}
        </header>

        {/* Error toast */}
        {error && (
          <div
            role="alert"
            className="mx-4 mt-4 flex items-start justify-between rounded-lg border border-red-700 bg-red-900/50 p-4 md:mx-6"
          >
            <span className="pr-3 text-sm text-red-300">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-400 hover:text-red-200"
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div
          className="fixed inset-0 bg-gray-950/80 flex items-center justify-center z-50"
          role="status"
          aria-label="Loading"
        >
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
