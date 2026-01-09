# Story E6.2: Referral System

**Epic:** E6 - Growth Features  
**Story Points:** 5  
**Status:** done  
**Dependencies:** E4.1 (My Garden Dashboard)

---

## User Story

**As a** tree owner,  
**I want** có referral link để invite friends,  
**So that** tôi có thể earn commission.

---

## Acceptance Criteria

1. Generate unique ref code:
   - URL format: /ref/{code}
   - Code: alphanumeric 6-8 chars
   - One code per user

2. Track referrals:
   - Record referrer → referee relation
   - Track successful conversions
   - Status: PENDING | CONVERTED | PAID

3. Display in dashboard với QR code:
   - Referral widget in My Garden
   - QR code generation
   - Copy link button
   - Share buttons

4. Commission calculation:
   - 10% of tree price = 26,000 VND/tree
   - Track total earned
   - Payout status

---

## Technical Tasks

- [ ] Task 1: Referral Code Generation
  - [ ] Subtask 1.1: Generate unique code
  - [ ] Subtask 1.2: Store in user profile
  - [ ] Subtask 1.3: /ref/{code} route

- [ ] Task 2: Tracking
  - [ ] Subtask 2.1: Referral object schema
  - [ ] Subtask 2.2: Cookie/session tracking
  - [ ] Subtask 2.3: Conversion on order

- [ ] Task 3: Dashboard Widget
  - [ ] Subtask 3.1: ReferralWidget component
  - [ ] Subtask 3.2: QR code generation
  - [ ] Subtask 3.3: Stats display

- [ ] Task 4: Commission
  - [ ] Subtask 4.1: Calculate per referral
  - [ ] Subtask 4.2: Total earnings display
  - [ ] Subtask 4.3: Payout request flow

- [ ] Task 5: Testing
  - [ ] Subtask 5.1: Unit tests
  - [ ] Subtask 5.2: E2E referral flow

---

## Notes

- Consider fraud prevention (self-referral, etc.)
- Integration với payment system for payouts
