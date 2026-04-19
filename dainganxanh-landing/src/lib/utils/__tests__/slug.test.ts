/**
 * Unit Tests: slug.ts
 *
 * [P2] Utility — Vietnamese text → URL-friendly slug.
 * Pure functions, no mocks needed.
 */

import { generateSlug } from '../slug'

describe('[P2] generateSlug', () => {
    test('[P1] converts basic ASCII to lowercase', () => {
        expect(generateSlug('Hello World')).toBe('hello-world')
    })

    test('[P1] removes Vietnamese diacritics', () => {
        expect(generateSlug('Cây Dó Đen')).toBe('cay-do-den')
    })

    test('[P1] handles full Vietnamese sentence', () => {
        expect(generateSlug('Cây Dó Đen là gì?')).toBe('cay-do-den-la-gi')
    })

    test('[P2] collapses multiple spaces into single dash', () => {
        expect(generateSlug('hello   world')).toBe('hello-world')
    })

    test('[P2] removes leading and trailing dashes', () => {
        expect(generateSlug('  hello  ')).toBe('hello')
    })

    test('[P2] collapses multiple consecutive dashes', () => {
        expect(generateSlug('hello--world')).toBe('hello-world')
    })

    test('[P2] removes special characters', () => {
        expect(generateSlug('hello! world@2024')).toBe('hello-world2024')
    })

    test('[P2] handles empty string', () => {
        expect(generateSlug('')).toBe('')
    })

    test('[P2] handles string with only special characters', () => {
        expect(generateSlug('!@#$%')).toBe('')
    })

    test('[P2] preserves numbers', () => {
        expect(generateSlug('Bài 123 viết')).toBe('bai-123-viet')
    })

    test('[P1] handles Đ (capital D with stroke)', () => {
        expect(generateSlug('Đà Lạt')).toBe('da-lat')
    })

    test('[P1] handles mixed Vietnamese and ASCII', () => {
        expect(generateSlug('Café Việt Nam')).toBe('cafe-viet-nam')
    })

    test('[P2] handles numbers only', () => {
        expect(generateSlug('2024')).toBe('2024')
    })
})
