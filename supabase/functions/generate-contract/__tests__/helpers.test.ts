import { assertEquals } from 'https://deno.land/std@0.168.0/testing/asserts.ts'

// Import the helper function (we'll need to export it from index.ts)
// For now, we'll redefine it here for testing
const removeAccents = (str: string): string => {
    return str
        // Vietnamese special characters (must be before normalization)
        .replace(/Đ/g, 'D').replace(/đ/g, 'd')
        .replace(/Ơ/g, 'O').replace(/ơ/g, 'o')
        .replace(/Ư/g, 'U').replace(/ư/g, 'u')
        // Subscript numbers (CO₂ → CO2)
        .replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (m) => '0123456789'['₀₁₂₃₄₅₆₇₈₉'.indexOf(m)])
        // Normalize and remove combining diacritics
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
}

Deno.test('removeAccents - handles Vietnamese special characters', () => {
    assertEquals(removeAccents('Đại Ngàn Xanh'), 'Dai Ngan Xanh')
    assertEquals(removeAccents('đồng'), 'dong')
    assertEquals(removeAccents('Ơn'), 'On')
    assertEquals(removeAccents('ơi'), 'oi')
    assertEquals(removeAccents('Ưu'), 'Uu')
    assertEquals(removeAccents('ưu'), 'uu')
})

Deno.test('removeAccents - handles common Vietnamese words', () => {
    assertEquals(removeAccents('Xin chào'), 'Xin chao')
    assertEquals(removeAccents('Cảm ơn'), 'Cam on')
    assertEquals(removeAccents('Hợp đồng'), 'Hop dong')
    assertEquals(removeAccents('Chăm sóc'), 'Cham soc')
    assertEquals(removeAccents('Điều khoản'), 'Dieu khoan')
})

Deno.test('removeAccents - handles full sentences', () => {
    const input = 'Đại Ngàn Xanh cam kết chăm sóc cây trong vòng 5 năm.'
    const expected = 'Dai Ngan Xanh cam ket cham soc cay trong vong 5 nam.'
    assertEquals(removeAccents(input), expected)
})

Deno.test('removeAccents - handles subscript numbers (CO₂)', () => {
    assertEquals(removeAccents('CO₂'), 'CO2')
    assertEquals(removeAccents('H₂O'), 'H2O')
    assertEquals(removeAccents('-100 kg CO₂/năm'), '-100 kg CO2/nam')
})

Deno.test('removeAccents - handles mixed content', () => {
    const input = 'Nguyễn Văn A - Email: test@example.com - CO₂: 500kg'
    const expected = 'Nguyen Van A - Email: test@example.com - CO2: 500kg'
    assertEquals(removeAccents(input), expected)
})

Deno.test('removeAccents - preserves ASCII characters', () => {
    assertEquals(removeAccents('ABC123'), 'ABC123')
    assertEquals(removeAccents('test@example.com'), 'test@example.com')
    assertEquals(removeAccents('TREE-2026-00001'), 'TREE-2026-00001')
})

Deno.test('removeAccents - handles empty string', () => {
    assertEquals(removeAccents(''), '')
})

Deno.test('removeAccents - handles all Vietnamese tones', () => {
    // Test all 5 tones on vowel 'a'
    assertEquals(removeAccents('à á ả ã ạ'), 'a a a a a')
    // Test all 5 tones on vowel 'e'
    assertEquals(removeAccents('è é ẻ ẽ ẹ'), 'e e e e e')
    // Test all 5 tones on vowel 'i'
    assertEquals(removeAccents('ì í ỉ ĩ ị'), 'i i i i i')
    // Test all 5 tones on vowel 'o'
    assertEquals(removeAccents('ò ó ỏ õ ọ'), 'o o o o o')
    // Test all 5 tones on vowel 'u'
    assertEquals(removeAccents('ù ú ủ ũ ụ'), 'u u u u u')
})

Deno.test('removeAccents - handles Vietnamese compound vowels', () => {
    assertEquals(removeAccents('ươ'), 'uo')
    assertEquals(removeAccents('ướ'), 'uo')
    assertEquals(removeAccents('ơi'), 'oi')
    assertEquals(removeAccents('ưu'), 'uu')
})
