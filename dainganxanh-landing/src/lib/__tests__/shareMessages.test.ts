import { getShareMessage, ShareContext } from '../shareMessages'

describe('shareMessages', () => {
    describe('getShareMessage', () => {
        it('should generate purchase message with tree count', () => {
            const result = getShareMessage('purchase', {
                trees: 5,
                refCode: 'DNG123456',
            })

            expect(result.title).toBe('Đại Ngàn Xanh')
            expect(result.text).toContain('5 cây')
            expect(result.text).toContain('Mẹ Thiên Nhiên')
            expect(result.text).toContain('🌳')
            expect(result.url).toContain('DNG123456')
        })

        it('should generate progress message with months', () => {
            const result = getShareMessage('progress', {
                months: 3,
                refCode: 'DNG123456',
            })

            expect(result.title).toBe('Cây của tôi đang lớn!')
            expect(result.text).toContain('3 tháng tuổi')
            expect(result.text).toContain('🌲')
            expect(result.url).toContain('DNG123456')
        })

        it('should generate harvest message', () => {
            const result = getShareMessage('harvest', {
                refCode: 'DNG123456',
            })

            expect(result.title).toBe('Thu hoạch trầm hương')
            expect(result.text).toContain('5 năm')
            expect(result.text).toContain('🎉')
            expect(result.url).toContain('DNG123456')
        })

        it('should use base URL from environment', () => {
            const originalEnv = process.env.NEXT_PUBLIC_BASE_URL
            process.env.NEXT_PUBLIC_BASE_URL = 'https://test.com'

            const result = getShareMessage('purchase', {
                trees: 1,
                refCode: 'TEST123',
            })

            expect(result.url).toBe('https://test.com/?ref=TEST123')

            process.env.NEXT_PUBLIC_BASE_URL = originalEnv
        })

        it('should fallback to default URL when env not set', () => {
            const originalEnv = process.env.NEXT_PUBLIC_BASE_URL
            delete process.env.NEXT_PUBLIC_BASE_URL

            const result = getShareMessage('purchase', {
                trees: 1,
                refCode: 'TEST123',
            })

            expect(result.url).toBe('https://dainganxanh.com.vn/?ref=TEST123')

            process.env.NEXT_PUBLIC_BASE_URL = originalEnv
        })
    })
})
