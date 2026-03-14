/**
 * EntryTypeIcon — renders a distinct SVG icon for each vault entry type.
 */

import type { VaultEntryMeta } from '../../lib/storacha';

interface EntryTypeIconProps {
  type: VaultEntryMeta['type'];
  className?: string;
}

/** Renders a type-specific SVG icon using the indigo color scheme. */
export function EntryTypeIcon({ type, className = 'w-6 h-6' }: EntryTypeIconProps) {
  const fill = '#6366f1';

  switch (type) {
    case 'password':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <ellipse cx="8" cy="13" rx="5" ry="5" stroke={fill} strokeWidth="2" />
          <circle cx="8" cy="13" r="2" fill={fill} />
          <path d="M13 8l7-3" stroke={fill} strokeWidth="2" strokeLinecap="round" />
          <path d="M18 5l2 2" stroke={fill} strokeWidth="2" strokeLinecap="round" />
          <path d="M20 7l2-2" stroke={fill} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'file':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke={fill} strokeWidth="2" strokeLinejoin="round" />
          <path d="M14 2v6h6" stroke={fill} strokeWidth="2" strokeLinejoin="round" />
          <path d="M8 13h8M8 17h5" stroke={fill} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'note':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M12 20h9" stroke={fill} strokeWidth="2" strokeLinecap="round" />
          <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z" stroke={fill} strokeWidth="2" strokeLinejoin="round" />
        </svg>
      );
    case 'api_key':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M8 3l-5 9 5 9" stroke={fill} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16 3l5 9-5 9" stroke={fill} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 12h6" stroke={fill} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'contact':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <circle cx="12" cy="8" r="4" stroke={fill} strokeWidth="2" />
          <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke={fill} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
  }
}
