/**
 * DeadMansPage — digital inheritance configuration.
 */

import { DeadMansSwitch } from '../components/deadmans/DeadMansSwitch';

/** Dead man's switch configuration page. */
export function DeadMansPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-50">Dead Man's Switch</h2>
        <p className="text-sm text-gray-400 mt-1">
          Automatically transfer vault access to your heir if you stop checking in.
        </p>
      </div>
      <DeadMansSwitch />
    </div>
  );
}
