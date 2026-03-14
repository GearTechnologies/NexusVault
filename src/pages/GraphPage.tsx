/**
 * GraphPage — portable social graph management.
 */

import { SocialGraphExport } from '../components/graph/SocialGraphExport';

/** Portable social graph page. */
export function GraphPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-50">Social Graph</h2>
      <SocialGraphExport />
    </div>
  );
}
