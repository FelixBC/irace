/**
 * node-postgres returns PostgreSQL enum[] columns as strings like `{RUNNING}` or `{RUNNING,CYCLING}`.
 * The frontend expects a real string[].
 */
export function normalizeSports(sports: unknown): string[] {
  if (Array.isArray(sports)) {
    return sports.filter((x) => x != null && x !== '') as string[];
  }
  if (sports == null || sports === '') {
    return [];
  }
  if (typeof sports === 'string') {
    const s = sports.trim();
    if (s.startsWith('{') && s.endsWith('}')) {
      const inner = s.slice(1, -1).trim();
      if (!inner) return [];
      return inner
        .split(',')
        .map((part) => part.replace(/^"(.+)"$/, '$1').trim())
        .filter(Boolean);
    }
    try {
      const parsed = JSON.parse(s) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((x) => x != null && x !== '') as string[];
      }
    } catch {
      /* not JSON */
    }
    if (s.includes(',')) {
      return s.split(',').map((x) => x.trim()).filter(Boolean);
    }
    return s ? [s] : [];
  }
  return [];
}
