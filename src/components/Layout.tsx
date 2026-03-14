/**
 * Full-width dark-themed layout with sidebar navigation and top bar.
 */

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
  const { shortAddress, disconnect, isConnected } = useWallet();

  return (
    <div className="flex h-screen bg-gray-950 text-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-semibold text-indigo-400">NexusVault</h1>
          <p className="text-xs text-gray-400 mt-1">Sovereign Data Layer</p>
        </div>
        <nav className="flex-1 p-4 space-y-1" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600 text-white font-medium'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`
              }
              aria-label={`Navigate to ${link.label}`}
            >
              <span aria-hidden="true">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-gray-900 border-b border-gray-700 flex items-center justify-between px-6">
          <div />
          {isConnected && (
            <div className="flex items-center gap-4">
              <span className="font-mono text-sm text-gray-300">{shortAddress}</span>
              <button
                onClick={disconnect}
                className="border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white rounded-lg px-4 py-2 text-sm transition-colors"
                aria-label="Disconnect wallet"
              >
                Disconnect
              </button>
            </div>
          )}
        </header>

        {/* Error toast */}
        {error && (
          <div
            role="alert"
            className="mx-6 mt-4 p-4 bg-red-900/50 border border-red-700 rounded-lg flex items-center justify-between"
          >
            <span className="text-red-300 text-sm">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-200 ml-4"
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
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
