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
  /** Tailwind classes for the badge */
  badgeClass: string;
}

const FALLBACK: ErrorTypeInfo = {
  category: 'OTHER',
  label: 'OTHER',
  badgeClass: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600',
};

const RULES: { pattern: RegExp; info: ErrorTypeInfo }[] = [
  {
    pattern: /ECONNREFUSED/,
    info: {
      category: 'REFUSED',
      label: 'ECONNREFUSED',
      badgeClass: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
    },
  },
  {
    pattern: /EHOSTUNREACH/,
    info: {
      category: 'UNREACHABLE',
      label: 'EHOSTUNREACH',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800',
    },
  },
  {
    pattern: /ETIMEDOUT|timed?\s*out/i,
    info: {
      category: 'TIMEOUT',
      label: 'TIMEOUT',
      badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
    },
  },
  {
    pattern: /ENOTFOUND|getaddrinfo/,
    info: {
      category: 'DNS',
      label: 'ENOTFOUND',
      badgeClass: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
    },
  },
  {
    pattern: /CERT_|TLS_|SSL_|handshake/i,
    info: {
      category: 'TLS',
      label: 'TLS',
      badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800',
    },
  },
  {
    pattern: /HTTP\s*5\d\d|status[\s_]?code.*5\d\d|: 5\d\d\b/i,
    info: {
      category: 'HTTP_5XX',
      label: 'HTTP 5xx',
      badgeClass: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
    },
  },
  {
    pattern: /HTTP\s*4\d\d|status[\s_]?code.*4\d\d|: 4\d\d\b/i,
    info: {
      category: 'HTTP_4XX',
      label: 'HTTP 4xx',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
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