# Referral Commission Fix - March 31, 2026

## Issue
Phát hiện 26 đơn hàng bị mất thông tin `referred_by` (referrer attribution), dẫn đến mất hoa hồng cho người giới thiệu.

## Root Cause
Checkout flow có bug khi query referrer từ cookie "ref" - query có thể fail silently và để `referred_by = NULL` thay vì gán default referrer "dainganxanh".

## Impact Analysis
- **Tổng số đơn hàng bị ảnh hưởng:** 26 orders
- **Đơn hàng đã hoàn thành (completed):** 9 orders
- **Tổng giá trị đơn hàng completed:** 29,120,000 VND
- **Tổng hoa hồng bị mất:** 1,456,000 VND (~$60 USD)
- **Tỷ lệ hoa hồng:** 5%

## Orders Fixed
### Completed Orders (9) - Khôi phục hoa hồng:
1. `DHTXR1UL` - epsiloncryptoai@gmail.com - 260,000 VND → 13,000 VND commission
2. `DHH60EJP` - manhhieu972000@gmail.com - 260,000 VND → 13,000 VND commission
3. `DHY0KDJ1` - thuanthanh24092013@gmail.com - 260,000 VND → 13,000 VND commission
4. `DHYSAJ4U` - dovanvinh2012@gmail.com - 260,000 VND → 13,000 VND commission
5. `DHTEST99` - nguyenphuonghoang888@gmail.com - 260,000 VND → 13,000 VND commission
6. `DH1ZZTHM` - (no email) - 260,000 VND → 13,000 VND commission
7. `DHY0MJBQ` - trangiangha@gmail.com - 260,000 VND → 13,000 VND commission
8. `DHYQ4OK1` - (no email) - 26,000,000 VND → 1,300,000 VND commission
9. `DHE6MDDH` - (no email) - 1,300,000 VND → 65,000 VND commission

### Pending Orders (4) - Sẽ tạo hoa hồng khi complete:
- `DHR3XGZO`, `DH25MDMA`, `DHMY78Y6`, `DHH2QQJM`

### Cancelled Orders (13) - Không tạo hoa hồng:
- Multiple cancelled orders updated for data consistency

## Fix Applied
```sql
UPDATE public.orders
SET referred_by = '5296b70b-03bb-463b-853c-9ccff2697685'  -- dainganxanh referrer
WHERE referred_by IS NULL;
```

**Kết quả:** 26 orders updated successfully ✅

## Verification
```sql
SELECT COUNT(*) FROM orders WHERE referred_by IS NULL;
-- Result: 0 (all orders now have referrer assigned)
```

## Referrer Information
- **Referrer ID:** `5296b70b-03bb-463b-853c-9ccff2697685`
- **Email:** nguyenphuonghoang888@gmail.com
- **Referral Code:** dainganxanh
- **Recovered Commission:** 1,456,000 VND

## Next Steps (Khuyến nghị)
1. ✅ **DONE:** Update all orders with missing `referred_by`
2. 🔜 **TODO:** Fix checkout flow để prevent bug này tái diễn
   - Add proper error handling khi query referrer
   - Ensure default referrer "dainganxanh" được gán khi không có ref cookie
   - Add logging để track referral attribution failures
3. 🔜 **TODO:** Add database constraint hoặc validation để ensure orders luôn có `referred_by`

## Execution Details
- **Date:** 2026-03-31
- **Method:** Direct SQL update via Supabase MCP
- **Script Created:** `/scripts/fix-missing-referrals.mjs` (for future reference)
- **Executed By:** Claude Code Implementor Agent

---
**Status:** ✅ Fix Complete - All affected orders restored
