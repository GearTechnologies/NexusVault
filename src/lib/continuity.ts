export interface ContinuityStatus {
  eligible: boolean;
  daysRemaining: number | null;
  expiresAt: number | null;
  label: string;
}

export function evaluateContinuity(
  lastHeartbeat: number | null,
  intervalDays: number,
  now = Math.floor(Date.now() / 1000)
): ContinuityStatus {
  if (!lastHeartbeat) {
    return {
      eligible: false,
      daysRemaining: null,
      expiresAt: null,
      label: 'Awaiting first heartbeat',
    };
  }

  const expiresAt = lastHeartbeat + intervalDays * 86400;
  const remainingSeconds = expiresAt - now;
  const eligible = remainingSeconds <= 0;

  return {
    eligible,
    expiresAt,
    daysRemaining: eligible ? 0 : Math.ceil(remainingSeconds / 86400),
    label: eligible ? 'Release window open' : 'Heartbeat valid',
  };
}
