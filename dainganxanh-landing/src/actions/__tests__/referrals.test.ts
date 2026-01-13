import { describe, it, expect } from '@jest/globals'
import {
    trackReferralClick,
    getReferralStats,
    getReferralConversions,
    regenerateReferralCode,
} from '../referrals'

describe('referrals server actions', () => {
    describe('trackReferralClick', () => {
        it('should have correct signature', () => {
            expect(trackReferralClick).toBeDefined()
            expect(typeof trackReferralClick).toBe('function')
            expect(trackReferralClick.length).toBe(2) // refCode, headers
        })
    })

    describe('getReferralStats', () => {
        it('should have correct signature', () => {
            expect(getReferralStats).toBeDefined()
            expect(typeof getReferralStats).toBe('function')
            expect(getReferralStats.length).toBe(1) // userId
        })
    })

    describe('getReferralConversions', () => {
        it('should have correct signature', () => {
            expect(getReferralConversions).toBeDefined()
            expect(typeof getReferralConversions).toBe('function')
            expect(getReferralConversions.length).toBe(1) // userId
        })
    })

    describe('regenerateReferralCode', () => {
        it('should have correct signature', () => {
            expect(regenerateReferralCode).toBeDefined()
            expect(typeof regenerateReferralCode).toBe('function')
            expect(regenerateReferralCode.length).toBe(1) // userId
        })
    })
})
