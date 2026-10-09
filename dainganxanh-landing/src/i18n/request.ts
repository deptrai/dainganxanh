import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

function deepMerge<T extends Record<string, unknown>>(base: T, override: Record<string, unknown>): T {
  const result: Record<string, unknown> = { ...base };
  for (const key of Object.keys(override)) {
    const baseVal = base[key];
    const overrideVal = override[key];
    if (
      baseVal &&
      overrideVal &&
      typeof baseVal === 'object' &&
      !Array.isArray(baseVal) &&
      typeof overrideVal === 'object' &&
      !Array.isArray(overrideVal)
    ) {
      result[key] = deepMerge(baseVal as Record<string, unknown>, overrideVal as Record<string, unknown>);
    } else if (overrideVal !== undefined) {
      result[key] = overrideVal;
    }
  }
  return result as T;
}

const DOMAINS = [
  'common',
  'landing',
  'pricing',
  'crm',
  'store',
  'checkout',
  'eco',
  'blog',
  'auth',
  'errors',
] as const;

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  // Load Vietnamese base catalogs
  const viMessages: Record<string, Record<string, unknown>> = {};
  for (const domain of DOMAINS) {
    const mod = await import(`../../messages/vi/${domain}.json`);
    viMessages[domain] = (mod as any).default ?? mod;
  }

  if (locale === 'vi') {
    return {
      locale,
      messages: viMessages,
    };
  }

  // Load target locale catalogs and merge with VI fallback
  const locMessages: Record<string, Record<string, unknown>> = {};
  for (const domain of DOMAINS) {
    const mod = await import(`../../messages/${locale}/${domain}.json`);
    const locCatalog = (mod as any).default ?? mod;
    locMessages[domain] = deepMerge(viMessages[domain], locCatalog);
  }

  return {
    locale,
    messages: locMessages,
  };
});
