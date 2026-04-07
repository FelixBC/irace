/**
 * Scoped logging for the browser bundle. debug/info only run in development.
 */
export function createLogger(scope: string) {
  const prefix = `[${scope}]`;
  const dev = import.meta.env.DEV;

  return {
    debug(message: string, ...args: unknown[]) {
      if (dev) console.log(prefix, message, ...args);
    },
    info(message: string, ...args: unknown[]) {
      if (dev) console.log(prefix, message, ...args);
    },
    warn(message: string, ...args: unknown[]) {
      console.warn(prefix, message, ...args);
    },
    error(message: string, ...args: unknown[]) {
      console.error(prefix, message, ...args);
    },
  };
}
