import { generateTreeCode, generateTreeCodes, isValidTreeCode } from '../treeCode'

// Pin time so year-based assertions never flip at Dec 31 → Jan 1 boundary
const FIXED_DATE = new Date('2026-04-21T12:00:00Z')

describe('Tree Code Generation', () => {
    beforeAll(() => {
        jest.useFakeTimers().setSystemTime(FIXED_DATE)
    })
    afterAll(() => {
        jest.useRealTimers()
    })

    describe('generateTreeCode', () => {
        it('should generate code in correct format with timestamp', () => {
            const code = generateTreeCode('abc123', 1)
            // Format: TREE-YYYY-XXXXX###-TIMESTAMP
            expect(code).toMatch(/^TREE-\d{4}-ABC12001-\d{6}$/)
        })

        it('should use current year in tree code', () => {
            const orderId = 'test-order-id'
            const year = FIXED_DATE.getFullYear()
            const code = generateTreeCode(orderId, 1)

            expect(code).toContain(`TREE-${year}`)
        })

        it('should use first 5 characters of order ID as prefix', () => {
            const orderId = 'abc12345-6789'
            const code = generateTreeCode(orderId, 1)

            expect(code).toContain('ABC12')
        })

        it('should pad sequence number with zeros', () => {
            const orderId = 'test-order'

            expect(generateTreeCode(orderId, 1)).toMatch(/001-\d{6}$/)
            expect(generateTreeCode(orderId, 10)).toMatch(/010-\d{6}$/)
            expect(generateTreeCode(orderId, 100)).toMatch(/100-\d{6}$/)
        })

        it('should generate sequential codes', () => {
            const codes = [
                generateTreeCode('order1', 1),
                generateTreeCode('order1', 2),
                generateTreeCode('order1', 3),
            ]
            // Assuming the new format includes a timestamp, the last 3 digits are still the sequence.
            expect(codes[0]).toMatch(/001-\d{6}$/)
            expect(codes[1]).toMatch(/002-\d{6}$/)
            expect(codes[2]).toMatch(/003-\d{6}$/)
            expect(codes[0]).not.toBe(codes[1])
            expect(codes[1]).not.toBe(codes[2])
        })
    })

    describe('generateTreeCodes', () => {
        it('should generate multiple tree codes', () => {
            const orderId = 'test-order-id'
            const codes = generateTreeCodes(orderId, 5)

            expect(codes).toHaveLength(5)
            expect(codes[0]).toMatch(/001-\d{6}$/)
            expect(codes[4]).toMatch(/005-\d{6}$/)
        })

        it('should generate unique codes for each tree', () => {
            const orderId = 'test-order'
            const codes = generateTreeCodes(orderId, 10)

            const uniqueCodes = new Set(codes)
            expect(uniqueCodes.size).toBe(10)
        })

        it('should use correct year', () => {
            const code = generateTreeCode('test12', 1)
            const year = FIXED_DATE.getFullYear()
            expect(code).toContain(`TREE-${year}`)
        })

        it('should generate codes with unique timestamps', () => {
            const code1 = generateTreeCode('test12', 1)
            const code2 = generateTreeCode('test12', 1)
            // Even with same orderId and sequence, timestamps should differ
            expect(code1).not.toBe(code2)
        })

        it('should handle quantity of 1', () => {
            const orderId = 'test-order'
            const codes = generateTreeCodes(orderId, 1)

            expect(codes).toHaveLength(1)
            expect(codes[0]).toMatch(/001-\d{6}$/)
        })

        it('should handle large quantities', () => {
            const orderId = 'test-order'
            const codes = generateTreeCodes(orderId, 100)

            expect(codes).toHaveLength(100)
            expect(codes[0]).toMatch(/001-\d{6}$/)
            expect(codes[99]).toMatch(/100-\d{6}$/)
        })
    })

    describe('isValidTreeCode', () => {
        it('should validate correct tree code format with timestamp', () => {
            const validCode = 'TREE-2026-ABC12001-123456'
            expect(isValidTreeCode(validCode)).toBe(true)
        })

        it('should reject invalid formats', () => {
            expect(isValidTreeCode('TREE-2026-ABC12001')).toBe(false) // Missing timestamp
            expect(isValidTreeCode('TREE-2026-ABC1200-12345')).toBe(false) // Too short sequence
            expect(isValidTreeCode('TREE-2026-ABC120011-123456')).toBe(false) // Too long sequence
            expect(isValidTreeCode('TREE-26-ABC12001-123456')).toBe(false) // Year too short
            expect(isValidTreeCode('tree-2026-abc12001-123456')).toBe(false) // Lowercase
            expect(isValidTreeCode('TREE-2026-abc12001-123456')).toBe(false) // Lowercase prefix
            expect(isValidTreeCode('TREE-2026-ABC12001-12345')).toBe(false) // Timestamp too short
            expect(isValidTreeCode('TREE-2026-ABC12001-1234567')).toBe(false) // Timestamp too long
            expect(isValidTreeCode('INVALID-CODE')).toBe(false)
            expect(isValidTreeCode('')).toBe(false)
        })

        it('should accept codes with different years', () => {
            expect(isValidTreeCode('TREE-2025-ABC12001-123456')).toBe(true)
            expect(isValidTreeCode('TREE-2026-ABC12001-654321')).toBe(true)
            expect(isValidTreeCode('TREE-2027-ABC12001-999999')).toBe(true)
        })

        it('should accept codes with different prefixes', () => {
            expect(isValidTreeCode('TREE-2026-ABC12001-111111')).toBe(true)
            expect(isValidTreeCode('TREE-2026-XYZ98001-222222')).toBe(true)
            expect(isValidTreeCode('TREE-2026-12345001-333333')).toBe(true)
        })
    })
})
