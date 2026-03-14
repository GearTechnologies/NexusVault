/**
 * RecoveryPage — two-panel layout for guardian setup and recovery flow.
 */

import { GuardianManager } from '../components/recovery/GuardianManager';
import { RecoveryFlow } from '../components/recovery/RecoveryFlow';

/** Social recovery configuration page. */
export function RecoveryPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-50">Social Recovery</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GuardianManager />
        <RecoveryFlow />
      </div>
    </div>
  );
}
