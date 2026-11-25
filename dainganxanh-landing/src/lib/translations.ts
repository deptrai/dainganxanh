/**
 * Content Database i18n Helpers (Story 14.4)
 * Handles dual-language VI/EN translation extraction and fallback.
 */

export type ContentTranslations = Record<string, Record<string, unknown>>

export interface TranslatableItem {
    translations?: ContentTranslations | null
    [key: string]: any
}

/**
 * Extract a localized field from an entity.
 * Fallback chain:
 * 1. item.translations[locale][field] (non-empty string)
 * 2. item.translations[fallbackLocale][field] (non-empty string)
 * 3. item[field] (cast String if non-null)
 * 4. Empty string ''
 */
export function getTranslatedField(
    item: any,
    field: string,
    locale: string = 'vi',
    fallbackLocale: string = 'vi'
): string {
    if (!item) return ''

    const locVal = item.translations?.[locale]?.[field]
    if (typeof locVal === 'string' && locVal.trim().length > 0) {
        return locVal
    }

    if (fallbackLocale && fallbackLocale !== locale) {
        const fallbackVal = item.translations?.[fallbackLocale]?.[field]
        if (typeof fallbackVal === 'string' && fallbackVal.trim().length > 0) {
            return fallbackVal
        }
    }

    const baseVal = item[field]
    if (baseVal != null) {
        return String(baseVal)
    }

    return ''
}

/**
 * Check whether an item has an English translation.
 * Supports:
 * - JSONB translations: item.translations.en has at least one non-empty string field
 * - post_translations join: item.post_translations array contains a valid 'en' record
 */
export function hasEnTranslation(item: any): boolean {
    if (!item) return false

    // Check post_translations relation if present
    if (Array.isArray(item.post_translations)) {
        return item.post_translations.some(
            (t: any) =>
                t &&
                t.locale === 'en' &&
                ((typeof t.title === 'string' && t.title.trim().length > 0) ||
                    (typeof t.slug === 'string' && t.slug.trim().length > 0))
        )
    }

    // Check JSONB translations column
    const en = item.translations?.en
    if (en && typeof en === 'object') {
        return Object.values(en).some(
            (val) => typeof val === 'string' && val.trim().length > 0
        )
    }

    return false
}
