import { describe, expect, it, vi } from 'vitest';

describe('validateBrowserEnv', () => {
  it('warns when Storacha email is missing', async () => {
    vi.stubEnv('VITE_STORACHA_EMAIL', undefined);
    const { validateBrowserEnv } = await import('./env');
    const warnings = validateBrowserEnv();

    expect(warnings.some((warning) => warning.includes('Storacha email'))).toBe(true);
    vi.unstubAllEnvs();
  });
});
