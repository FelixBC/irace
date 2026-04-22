/**
 * Never set NODE_TLS_REJECT_UNAUTHORIZED=0 by default — it disables TLS certificate
 * validation process-wide (database, Strava, everything using `https`).
 *
 * If a local proxy or broken CA setup forces TLS errors, opt in explicitly:
 *   ALLOW_INSECURE_TLS=true
 * Prefer fixing DATABASE_URL / system trust store instead.
 */
export function applyOptionalInsecureTlsFromEnv(): void {
  const allowInsecureTls = process.env.ALLOW_INSECURE_TLS?.trim().toLowerCase();
  if (allowInsecureTls === '1' || allowInsecureTls === 'true' || allowInsecureTls === 'yes') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }
}
