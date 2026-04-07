/**
 * Scoped logging for Node (Vercel API routes, server utilities, scripts).
 *
 * - `debug`: verbose tracing; off in production unless you set env `LOG_DEBUG=1`.
 * - `info` / `warn` / `error`: always emitted (keep `info` for meaningful audit lines).
 */
export function createLogger(scope) {
  const prefix = `[${scope}]`;
  const debugEnabled =
    process.env.LOG_DEBUG === '1' ||
    (process.env.NODE_ENV !== 'production' && process.env.LOG_DEBUG !== '0');

  return {
    debug(message, ...args) {
      if (debugEnabled) console.log(prefix, message, ...args);
    },
    info(message, ...args) {
      console.log(prefix, message, ...args);
    },
    warn(message, ...args) {
      console.warn(prefix, message, ...args);
    },
    error(message, ...args) {
      console.error(prefix, message, ...args);
    },
  };
}
