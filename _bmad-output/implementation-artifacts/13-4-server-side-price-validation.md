# Story 13.4: Server-Side Price Validation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a system,
I want all checkout pricing, seasonal surcharges, weekend rates, and order totals calculated and validated strictly server-side,
So that users cannot tamper with prices, inject modified totals, or bypass pricing business rules.

## Acceptance Criteria

1. **Given** any checkout or order creation request (Tree Orders, Room Bookings, or Store Orders)
   **When** the client submits a request containing `total_amount`, `unit_price`, or other calculated monetary fields
   **Then** the server ignores or explicitly rejects any client-supplied totals
   **And** re-fetches authoritative prices directly from the database (`products`, `rooms`, `room_pricing_rules`, or system constants `VALID_UNIT_PRICES`)

2. **Given** a Room Booking request sent to `POST /api/bookings/create` or previewed via `POST /api/bookings/calculate-price`
   **When** dates span weekend nights or periods covered by `room_pricing_rules`
   **Then** the price calculation service calculates the breakdown on a per-night basis (`check_in_date` to `check_out_date` minus 1 night):
     - For each night date `D`: check if a matching row exists in `room_pricing_rules` where `D >= start_date AND D <= end_date`. If found, use `rule.price_per_night`; otherwise use `rooms.price_per_night`.
     - Check `min_nights`: if any matched rule has `min_nights > nights`, the API rejects the request with HTTP 400 and an informative message ("Giai đoạn này yêu cầu đặt tối thiểu N đêm").
     - Verify `guests_count <= rooms.capacity` (returns HTTP 400 if exceeded).
   **And** returns the exact computed breakdown `{ roomId, roomName, nights, basePricePerNight, nightBreakdown: [{ date, price, isCustomRule }], totalAmount }`

3. **Given** a Store Order request sent to `POST /api/store/orders/create` or previewed via `POST /api/store/calculate-price`
   **When** the client submits items with quantities and province
   **Then** the server queries active product prices from `products.price`
   **And** calculates `subtotal = sum(product.price * quantity)`
   **And** calculates shipping fee deterministically: `shipping_fee = subtotal >= 500000 ? 0 : 30000` (Free ship for orders >= 500k VND, standard flat rate 30k VND otherwise)
   **And** calculates `total_amount = subtotal + shipping_fee` strictly as integer VND without floating point rounding errors
   **And** returns `{ items: [{ slug, name, unitPrice, quantity, lineTotal }], subtotal, shippingFee, totalAmount }`

4. **Given** an invalid or tampered price payload sent to existing order creation endpoints
   **When** client injects client-side prices or totals (e.g. `total_amount: 1000` or `unit_price: 100`)
   **Then** the API either:
     - Replaces it with the server-recalculated authoritative total, OR
     - If client explicitly sent a mismatched total, rejects with HTTP 400 Bad Request
   **And** no order or booking is EVER persisted with an incorrect or tampered amount

5. **Technical Constraints & Shared Utilities:**
   - Implement core pricing logic in `@/lib/pricing`:
     - `src/lib/pricing/booking.ts`: `calculateBookingPrice(supabase, { roomId, checkInDate, checkOutDate, guestsCount })`
     - `src/lib/pricing/store.ts`: `calculateStoreOrderPrice(supabase, { items, province })`
   - Expose lightweight, rate-limited public preview endpoints:
     - `POST /api/bookings/calculate-price`
     - `POST /api/store/calculate-price`
   - Refactor `POST /api/bookings/create` and `POST /api/store/orders/create` to use the shared pricing engine.
   - All amounts must be non-negative integers (VND). Float values are rejected.

## Tasks / Subtasks

- [x] Task 1: Implement shared server-side pricing engine in `src/lib/pricing/` (AC: #1, #2, #3, #5)
  - [x] Implement `src/lib/pricing/booking.ts` with per-night resolution algorithm & `min_nights` validation against `room_pricing_rules`
  - [x] Implement `src/lib/pricing/store.ts` with product lookup from database, quantity checks, subtotal, and shipping fee logic
  - [x] Add unit tests in `src/lib/pricing/__tests__/pricing.test.ts` covering normal rates, custom holiday pricing rules, `min_nights` rejections, and free shipping thresholds
- [x] Task 2: Create preview calculation API endpoints (AC: #2, #3, #5)
  - [x] Create `src/app/api/bookings/calculate-price/route.ts` with Zod schema and rate limiting
  - [x] Create `src/app/api/store/calculate-price/route.ts` with Zod schema and rate limiting
  - [x] Add route unit tests in `src/app/api/bookings/calculate-price/__tests__/route.test.ts` and `src/app/api/store/calculate-price/__tests__/route.test.ts`
- [x] Task 3: Refactor existing order creation routes to use the shared pricing engine (AC: #1, #4)
  - [x] Refactor `src/app/api/bookings/create/route.ts` to call `calculateBookingPrice`
  - [x] Refactor `src/app/api/store/orders/create/route.ts` to call `calculateStoreOrderPrice`
  - [x] Verify `src/app/api/orders/pending/route.ts` rejects any tampered `total_amount` or unlisted `unit_price`
- [x] Task 4: Comprehensive test suite for price integrity & tampering prevention (AC: #1 - #5)
  - [x] Write integration test attempting client price injection (`total_amount: 1000`) on all 3 order routes
  - [x] Verify both preview APIs and creation APIs yield 100% identical totals for the same inputs

## Dev Notes

### Architecture & Data Models

- **Bảng `rooms`**:
  - `id`: UUID
  - `price_per_night`: BIGINT (VND, base rate)
  - `capacity`: INTEGER (sức chứa tối đa)
  - `status`: 'active' | 'inactive' | 'maintenance'

- **Bảng `room_pricing_rules`**:
  - `id`: UUID
  - `room_id`: UUID REFERENCES `rooms(id)`
  - `start_date`: DATE
  - `end_date`: DATE
  - `price_per_night`: BIGINT (VND, holiday / peak season rate)
  - `min_nights`: INTEGER (số đêm tối thiểu yêu cầu cho giai đoạn này)

- **Bảng `products`**:
  - `id`: UUID
  - `price`: BIGINT (VND)
  - `status`: 'active' | 'inactive'

- **Shipping Rules**:
  - `subtotal >= 500,000 VND`: Miễn phí giao hàng (`shipping_fee = 0`).
  - `subtotal < 500,000 VND`: Phí giao hàng tiêu chuẩn toàn quốc `30,000 VND`.

### Per-Night Resolution Algorithm (Booking)
```ts
// For a booking from checkIn to checkOut:
let currentDate = new Date(checkInDate)
const endDate = new Date(checkOutDate)
const nightBreakdown = []
let totalAmount = 0

while (currentDate < endDate) {
  const dateStr = currentDate.toISOString().split('T')[0]
  // Find matching rule for this date
  const rule = pricingRules.find(r => dateStr >= r.start_date && dateStr <= r.end_date)
  const price = rule ? Number(rule.price_per_night) : Number(room.price_per_night)
  
  if (rule && rule.min_nights && totalNights < rule.min_nights) {
    throw new PricingError(`Yêu cầu đặt tối thiểu ${rule.min_nights} đêm cho giai đoạn này.`)
  }

  nightBreakdown.push({ date: dateStr, price, isCustomRule: !!rule })
  totalAmount += price
  currentDate.setDate(currentDate.getDate() + 1)
}
```

## Dev Agent Record

### Agent Model Used
claude-sonnet-5

### Debug Log References

### Completion Notes List
- ✅ Created reusable server-side pricing engine in `src/lib/pricing/`:
  - `booking.ts`: Implemented `calculateBookingPrice` with per-night resolution algorithm and `min_nights` validation against `room_pricing_rules`.
  - `store.ts`: Implemented `calculateStoreOrderPrice` with authoritative DB product pricing and free shipping threshold (>= 500k VND).
  - `types.ts` & `index.ts`: Re-exported clean types and `PricingError` class with status codes.
- ✅ Created price preview calculation endpoints:
  - `POST /api/bookings/calculate-price` with Zod validation and rate limiting.
  - `POST /api/store/calculate-price` with Zod validation and rate limiting.
- ✅ Refactored order creation routes (`/api/bookings/create` and `/api/store/orders/create`) to consume shared pricing engine and strictly reject client-side price tampering (HTTP 400).
- ✅ Verified `src/app/api/orders/pending/route.ts` already enforces strict unit price and total price validation for tree orders against `VALID_UNIT_PRICES`.
- ✅ Created comprehensive unit and integration test suites:
  - `src/lib/pricing/__tests__/pricing.test.ts` (7 passed)
  - `src/app/api/bookings/calculate-price/__tests__/route.test.ts` (3 passed)
  - `src/app/api/store/calculate-price/__tests__/route.test.ts` (3 passed)
  - `src/lib/pricing/__tests__/tampering-prevention.test.ts` (4 passed)
  - Full suite passed: 48/48 tests across pricing, bookings, store, cron, and casso.
- ✅ Live verified preview and anti-tampering endpoints against local Next.js server (port 3001) and Supabase database:
  - `POST /api/store/calculate-price` returns exact subtotal and 30k ship fee.
  - `POST /api/store/calculate-price` with 10 items (>=500k) returns free ship (0 VND).
  - `POST /api/bookings/calculate-price` returns per-night breakdown and total.
  - `POST /api/bookings/calculate-price` with excess guests returns capacity error.
  - Tampered `total_amount` injection on `/api/bookings/create` and `/api/store/orders/create` returned HTTP 400 Bad Request: `Giá trị đơn hàng không khớp`.

### File List
- `dainganxanh-landing/src/lib/pricing/types.ts` (created)
- `dainganxanh-landing/src/lib/pricing/booking.ts` (created)
- `dainganxanh-landing/src/lib/pricing/store.ts` (created)
- `dainganxanh-landing/src/lib/pricing/index.ts` (created)
- `dainganxanh-landing/src/lib/pricing/__tests__/pricing.test.ts` (created)
- `dainganxanh-landing/src/lib/pricing/__tests__/tampering-prevention.test.ts` (created)
- `dainganxanh-landing/src/app/api/bookings/calculate-price/route.ts` (created)
- `dainganxanh-landing/src/app/api/bookings/calculate-price/__tests__/route.test.ts` (created)
- `dainganxanh-landing/src/app/api/store/calculate-price/route.ts` (created)
- `dainganxanh-landing/src/app/api/store/calculate-price/__tests__/route.test.ts` (created)
- `dainganxanh-landing/src/app/api/bookings/create/route.ts` (modified)
- `dainganxanh-landing/src/app/api/store/orders/create/route.ts` (modified)
- `_bmad-output/implementation-artifacts/13-4-server-side-price-validation.md` (updated)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (updated)

### Review Findings

- [x] [Review] Clean review: Tất cả 3 tầng review (Blind Hunter, Edge Case Hunter, Acceptance Auditor) đều PASS 100%. Engine tính giá phân giải theo từng đêm chính xác, ràng buộc min_nights/capacity chặt chẽ, ngưỡng miễn phí vận chuyển đúng quy tắc, phòng chống can thiệp giá (tampering) trên mọi endpoint đạt chuẩn P0. Không phát hiện lỗ hổng bảo mật hay lỗi logic.

