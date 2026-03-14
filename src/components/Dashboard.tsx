/**
 * Dashboard — overview stats, quick actions, and vault health indicator.
 */

import { useNavigate } from 'react-router-dom';
import { useVaultStore } from '../store/vault';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800 p-6 flex items-center gap-4">
      <span className="text-3xl" aria-hidden="true">{icon}</span>
      <div>
        <p className="text-2xl font-semibold text-gray-50">{value}</p>
        <p className="text-sm text-gray-400">{label}</p>
      </div>
    </div>
  );
}

function VaultHealth() {
  const recoveryId = useVaultStore((s) => s.recoveryId);
  const switchArmed = useVaultStore((s) => s.switchArmed);

  const status =
    recoveryId && switchArmed
      ? { label: 'Healthy', color: 'text-emerald-400', dot: 'bg-emerald-400' }
      : recoveryId || switchArmed
      ? { label: 'Partial protection', color: 'text-amber-400', dot: 'bg-amber-400' }
      : { label: 'No protection configured', color: 'text-red-400', dot: 'bg-red-400' };

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800 p-6 flex items-center gap-3">
      <span className={`w-3 h-3 rounded-full ${status.dot}`} aria-hidden="true" />
      <div>
        <p className="text-sm font-medium text-gray-50">Vault Health</p>
        <p className={`text-xs ${status.color}`}>{status.label}</p>
      </div>
    </div>
  );
}

/** Main dashboard overview. */
export function Dashboard() {
  const navigate = useNavigate();
  const entries = useVaultStore((s) => s.entries);
  const guardians = useVaultStore((s) => s.guardians);
  const contacts = useVaultStore((s) => s.contacts);
  const lastHeartbeat = useVaultStore((s) => s.lastHeartbeat);
  const heartbeatIntervalDays = useVaultStore((s) => s.heartbeatIntervalDays);

  const daysUntilHeartbeat =
    lastHeartbeat !== null
      ? Math.max(
          0,
          Math.ceil(
            (lastHeartbeat + heartbeatIntervalDays * 86400 -
              Math.floor(Date.now() / 1000)) /
              86400
          )
        )
      : null;

  const recentEntries = [...entries]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  const quickActions = [
    { label: 'Add Secret', to: '/vault', color: 'bg-indigo-600 hover:bg-indigo-500' },
    { label: 'Setup Recovery', to: '/recovery', color: 'bg-gray-700 hover:bg-gray-600' },
    { label: 'Share Data', to: '/sharing', color: 'bg-gray-700 hover:bg-gray-600' },
    { label: 'Export Graph', to: '/graph', color: 'bg-gray-700 hover:bg-gray-600' },
    { label: 'Configure Switch', to: '/deadmans', color: 'bg-gray-700 hover:bg-gray-600' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-50">Dashboard</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Vault Entries" value={entries.length} icon="🔐" />
        <StatCard label="Guardians" value={guardians.length} icon="🛡️" />
        <StatCard label="Contacts" value={contacts.length} icon="🌐" />
        <StatCard
          label="Days Until Heartbeat"
          value={daysUntilHeartbeat !== null ? daysUntilHeartbeat : '—'}
          icon="⏰"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <VaultHealth />
        <div className="lg:col-span-2 rounded-xl border border-gray-700 bg-gray-800 p-6">
          <p className="text-sm font-medium text-gray-300 mb-3">Quick Actions</p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <button
                key={action.to}
                onClick={() => void navigate(action.to)}
                className={`${action.color} text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors`}
                aria-label={action.label}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-700 bg-gray-800 p-6">
        <p className="text-sm font-medium text-gray-300 mb-4">Recent Activity</p>
        {recentEntries.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No entries yet. Add your first secret to get started.
          </p>
        ) : (
          <ul className="space-y-3">
            {recentEntries.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-200">{entry.label}</span>
                  <span className="text-xs text-gray-500 uppercase tracking-wide">
                    {entry.type}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(entry.createdAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
