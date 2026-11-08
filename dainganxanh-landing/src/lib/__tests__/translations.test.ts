import { getTranslatedField, hasEnTranslation } from '../translations'

describe('translations helper', () => {
    describe('getTranslatedField', () => {
        const item = {
            name: 'Trà Hoa Vàng',
            description: 'Trà thảo dược quý hiếm',
            translations: {
                en: {
                    name: 'Golden Camellia Tea',
                    description: 'Precious herbal tea',
                },
            },
        }

        it('returns VI default when locale is "vi"', () => {
            expect(getTranslatedField(item, 'name', 'vi')).toBe('Trà Hoa Vàng')
            expect(getTranslatedField(item, 'description', 'vi')).toBe('Trà thảo dược quý hiếm')
        })

        it('returns EN translation when locale is "en" and translation exists', () => {
            expect(getTranslatedField(item, 'name', 'en')).toBe('Golden Camellia Tea')
            expect(getTranslatedField(item, 'description', 'en')).toBe('Precious herbal tea')
        })

        it('falls back to default VI value when translations is null or undefined', () => {
            const noTranslations = { name: 'Mật Ong', description: 'Mật ong nguyên chất' }
            expect(getTranslatedField(noTranslations, 'name', 'en')).toBe('Mật Ong')
            expect(getTranslatedField(noTranslations, 'description', 'en')).toBe('Mật ong nguyên chất')

            const nullTranslations = { name: 'Mật Ong', translations: null }
            expect(getTranslatedField(nullTranslations, 'name', 'en')).toBe('Mật Ong')
        })

        it('falls back to default VI value when en translation key is missing or empty', () => {
            const partialItem = {
                name: 'Tinh Dầu Quế',
                translations: {
                    en: {
                        description: 'Cinnamon essential oil',
                    },
                },
            }
            expect(getTranslatedField(partialItem, 'name', 'en')).toBe('Tinh Dầu Quế')
            expect(getTranslatedField(partialItem, 'description', 'en')).toBe('Cinnamon essential oil')

            const emptyStrItem = {
                name: 'Trầm Hương',
                translations: {
                    en: {
                        name: '   ',
                    },
                },
            }
            expect(getTranslatedField(emptyStrItem, 'name', 'en')).toBe('Trầm Hương')
        })

        it('handles non-string target field gracefully', () => {
            const itemWithNonString = { count: 123, translations: { en: { count: 'One hundred' } } }
            expect(getTranslatedField(itemWithNonString, 'count' as any, 'en')).toBe('One hundred')
            expect(getTranslatedField(itemWithNonString, 'count' as any, 'vi')).toBe('123')
        })

        it('supports fallbackLocale parameter and follows priority chain', () => {
            const itemWithMultiple = {
                name: 'Gốc',
                translations: {
                    vi: { name: 'Bản dịch tiếng Việt' },
                    ja: { name: '日本語' },
                },
            }
            // locale is 'fr' (missing), fallback is 'ja' -> should get '日本語'
            expect(getTranslatedField(itemWithMultiple, 'name', 'fr', 'ja')).toBe('日本語')
            // locale is 'fr' (missing), fallback default is 'vi' -> should get 'Bản dịch tiếng Việt'
            expect(getTranslatedField(itemWithMultiple, 'name', 'fr')).toBe('Bản dịch tiếng Việt')
            // locale is 'fr', fallback is 'de' (missing), item has 'Gốc' -> returns 'Gốc'
            expect(getTranslatedField(itemWithMultiple, 'name', 'fr', 'de')).toBe('Gốc')
            // completely missing field -> returns ''
            expect(getTranslatedField(itemWithMultiple, 'missing', 'fr', 'de')).toBe('')
        })
    })

    describe('hasEnTranslation', () => {
        it('returns false when translations is null or undefined', () => {
            expect(hasEnTranslation(null)).toBe(false)
            expect(hasEnTranslation(undefined)).toBe(false)
            expect(hasEnTranslation({})).toBe(false)
            expect(hasEnTranslation({ translations: null })).toBe(false)
            expect(hasEnTranslation({ translations: undefined })).toBe(false)
        })

        it('returns false when translations.en is missing or not an object', () => {
            expect(hasEnTranslation({ translations: {} })).toBe(false)
            expect(hasEnTranslation({ translations: { en: null } })).toBe(false)
            expect(hasEnTranslation({ translations: { en: 'invalid' } })).toBe(false)
            expect(hasEnTranslation({ translations: { fr: { name: 'Thé' } } })).toBe(false)
        })

        it('returns false when translations.en has only empty/whitespace values', () => {
            expect(hasEnTranslation({ translations: { en: {} } })).toBe(false)
            expect(hasEnTranslation({ translations: { en: { name: '', desc: '  ' } } })).toBe(false)
            expect(hasEnTranslation({ translations: { en: { name: null } } })).toBe(false)
        })

        it('returns true when translations.en has at least one non-empty string', () => {
            expect(hasEnTranslation({ translations: { en: { name: 'Golden Tea' } } })).toBe(true)
            expect(hasEnTranslation({
                translations: {
                    en: {
                        name: '',
                        description: 'A fine tea',
                    },
                },
            })).toBe(true)
        })
    })
})
