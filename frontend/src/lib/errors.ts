/** Known error categories displayed as color-coded badges */
export type ErrorCategory =
  | 'DNS'
  | 'REFUSED'
  | 'UNREACHABLE'
  | 'TIMEOUT'
  | 'TLS'
  | 'HTTP_5XX'
  | 'HTTP_4XX'
  | 'OTHER';

export interface ErrorTypeInfo {
  category: ErrorCategory;
  label: string;
  /**
   * Tailwind classes for the badge.
   * Contrast contract (WCAG 2.1 AA, verified per pair):
   *   light  text-<c>-800 on bg-<c>-50  >= 6:1, border-<c>-700 on white >= 5:1
   *   dark   text-<c>-300 on bg-<c>-900/30 over slate-950 >= 8:1,
   *          border-<c>-500 against both the fill and the surface >= 3:1
   * The border token sits one step darker/lighter than the old -200/-800 pair
   * because those were invisible (light) or sub-3:1 (dark).
   */
  badgeClass: string;
  /** Rail filter-dot fill: the badge border hue, which already clears >= 3:1 on both surfaces. */
  dotClass: string;
}

const FALLBACK: ErrorTypeInfo = {
  category: 'OTHER',
  label: 'OTHER',
  badgeClass:
    'bg-slate-50 text-slate-800 border-slate-500 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-400',
  dotClass: 'bg-slate-500 dark:bg-slate-400',
};

const RULES: { pattern: RegExp; info: ErrorTypeInfo }[] = [
  {
    pattern: /ECONNREFUSED/,
    info: {
      category: 'REFUSED',
      label: 'ECONNREFUSED',
      badgeClass:
        'bg-red-50 text-red-800 border-red-700 dark:bg-red-900/30 dark:text-red-300 dark:border-red-500',
      dotClass: 'bg-red-700 dark:bg-red-500',
    },
  },
  {
    pattern: /EHOSTUNREACH/,
    info: {
      category: 'UNREACHABLE',
      label: 'EHOSTUNREACH',
      badgeClass:
        'bg-rose-50 text-rose-800 border-rose-700 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-500',
      dotClass: 'bg-rose-700 dark:bg-rose-500',
    },
  },
  {
    pattern: /ETIMEDOUT|timed?\s*out/i,
    info: {
      category: 'TIMEOUT',
      label: 'TIMEOUT',
      badgeClass:
        'bg-yellow-50 text-yellow-800 border-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-500',
      dotClass: 'bg-yellow-700 dark:bg-yellow-500',
    },
  },
  {
    pattern: /ENOTFOUND|getaddrinfo/,
    info: {
      category: 'DNS',
      label: 'ENOTFOUND',
      badgeClass:
        'bg-purple-50 text-purple-800 border-purple-700 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-500',
      dotClass: 'bg-purple-700 dark:bg-purple-500',
    },
  },
  {
    pattern: /CERT_|TLS_|SSL_|handshake/i,
    info: {
      category: 'TLS',
      label: 'TLS',
      badgeClass:
        'bg-indigo-50 text-indigo-800 border-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-500',
      dotClass: 'bg-indigo-700 dark:bg-indigo-500',
    },
  },
  {
    pattern: /HTTP\s*5\d\d|status[\s_]?code.*5\d\d|: 5\d\d\b/i,
    info: {
      category: 'HTTP_5XX',
      label: 'HTTP 5xx',
      badgeClass:
        'bg-orange-50 text-orange-800 border-orange-700 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-500',
      dotClass: 'bg-orange-700 dark:bg-orange-500',
    },
  },
  {
    pattern: /HTTP\s*4\d\d|status[\s_]?code.*4\d\d|: 4\d\d\b/i,
    info: {
      category: 'HTTP_4XX',
      label: 'HTTP 4xx',
      badgeClass:
        'bg-amber-50 text-amber-800 border-amber-700 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-500',
      dotClass: 'bg-amber-700 dark:bg-amber-500',
    },
  },
];

/** Classify a heartbeat message into an error-type with a badge style */
export function classifyError(msg: string | null): ErrorTypeInfo {
  if (!msg) return { ...FALLBACK, label: 'UNKNOWN' };
  for (const rule of RULES) {
    if (rule.pattern.test(msg)) return rule.info;
  }
  return FALLBACK;
}
