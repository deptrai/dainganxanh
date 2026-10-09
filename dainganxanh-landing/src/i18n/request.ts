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

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  const viCommonMod = await import('../../messages/vi/common.json');
  const viLandingMod = await import('../../messages/vi/landing.json');
  const viPricingMod = await import('../../messages/vi/pricing.json');
  const viCrmMod = await import('../../messages/vi/crm.json');

  const viCommon = (viCommonMod as any).default ?? viCommonMod;
  const viLanding = (viLandingMod as any).default ?? viLandingMod;
  const viPricing = (viPricingMod as any).default ?? viPricingMod;
  const viCrm = (viCrmMod as any).default ?? viCrmMod;

  if (locale === 'vi') {
    return {
      locale,
      messages: {
        common: viCommon,
        landing: viLanding,
        pricing: viPricing,
        crm: viCrm,
      },
    };
  }

  const locCommonMod = await import(`../../messages/${locale}/common.json`);
  const locLandingMod = await import(`../../messages/${locale}/landing.json`);
  const locPricingMod = await import(`../../messages/${locale}/pricing.json`);
  const locCrmMod = await import(`../../messages/${locale}/crm.json`);

  const locCommon = (locCommonMod as any).default ?? locCommonMod;
  const locLanding = (locLandingMod as any).default ?? locLandingMod;
  const locPricing = (locPricingMod as any).default ?? locPricingMod;
  const locCrm = (locCrmMod as any).default ?? locCrmMod;

  return {
    locale,
    messages: {
      common: deepMerge(viCommon, locCommon),
      landing: deepMerge(viLanding, locLanding),
      pricing: deepMerge(viPricing, locPricing),
      crm: deepMerge(viCrm, locCrm),
    },
  };
});
