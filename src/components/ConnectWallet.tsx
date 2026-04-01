/**
 * ConnectWallet — shown when no wallet is connected.
 */

import { ConnectButton } from '@rainbow-me/rainbowkit';

function VaultIcon() {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="8" y="8" width="64" height="64" rx="8" fill="#1f2937" stroke="#6366f1" strokeWidth="3" />
      <circle cx="40" cy="40" r="16" stroke="#6366f1" strokeWidth="3" />
      <circle cx="40" cy="40" r="6" fill="#6366f1" />
      <line x1="40" y1="24" x2="40" y2="20" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" />
      <line x1="40" y1="56" x2="40" y2="60" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" />
      <line x1="24" y1="40" x2="20" y2="40" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" />
      <line x1="56" y1="40" x2="60" y2="40" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" />
      <rect x="60" y="36" width="8" height="8" rx="2" fill="#374151" stroke="#6366f1" strokeWidth="2" />
    </svg>
  );
}

/** Centred card shown when the wallet is not connected. */
export function ConnectWallet() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="rounded-xl border border-gray-700 bg-gray-800 p-10 max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <VaultIcon />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-gray-50">NexusVault</h2>
          <p className="mt-2 text-gray-400 text-sm leading-relaxed">
            Your sovereign digital life, encrypted and owned by you
          </p>
        </div>

        <ConnectButton.Custom>
          {({ mounted, openConnectModal }) => (
            <button
              onClick={openConnectModal}
              disabled={!mounted}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-3 transition-colors flex items-center justify-center gap-2"
              aria-label="Connect Ethereum wallet"
              type="button"
            >
              {mounted ? 'Connect Wallet' : 'Loading wallet options…'}
            </button>
          )}
        </ConnectButton.Custom>
      </div>
    </div>
  );
}
