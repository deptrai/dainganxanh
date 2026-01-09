# Story E3.2: Tích hợp USDT Webhook

**Epic:** E3 - Payment Gateway Integration  
**Story Points:** 5  
**Status:** done  
**Dependencies:** E1.3 (Order Object)

---

## User Story

**As a** developer,  
**I want** blockchain webhook verify USDT payments trên Polygon,  
**So that** crypto payments được xử lý tự động.

---

## Acceptance Criteria

1. POST /webhooks/blockchain nhận notifications từ Alchemy/Moralis

2. Verify transaction on-chain:
   - Check transaction hash exists
   - Verify amount matches order
   - Verify recipient address

3. Match payment với pending order:
   - Extract orderCode từ transaction memo hoặc mapping table
   - Find order by orderCode

4. Update order status:
   - Set paymentStatus = 'PAID'
   - Store transactionHash
   - Trigger post-payment workflow

---

## Technical Tasks

- [ ] Task 1: Webhook Endpoint
  - [ ] Subtask 1.1: POST /webhooks/blockchain
  - [ ] Subtask 1.2: Verify signature từ provider
  - [ ] Subtask 1.3: Parse payload

- [ ] Task 2: On-chain Verification
  - [ ] Subtask 2.1: Connect to Polygon RPC
  - [ ] Subtask 2.2: Verify transaction exists
  - [ ] Subtask 2.3: Check USDT amount và recipient

- [ ] Task 3: Order Matching
  - [ ] Subtask 3.1: Create payment → order mapping
  - [ ] Subtask 3.2: Update order status
  - [ ] Subtask 3.3: Trigger tree assignment

- [ ] Task 4: Testing
  - [ ] Subtask 4.1: Unit tests với mock blockchain
  - [ ] Subtask 4.2: Testnet integration tests

---

## Notes

- Consider using Alchemy Webhooks hoặc Moralis Streams
- USDT contract address on Polygon mainnet
- Need fallback verification mechanism
