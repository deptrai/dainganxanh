# Story 13.2: Secure Order Creation APIs

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a system,
I want all order creation to go through secure server routes,
So that anonymous users cannot fake orders, tamper with prices, or bypass inventory limits.

## Acceptance Criteria

1. **Given** a booking request sent to `POST /api/bookings/create`
   **When** the request arrives
   **Then** the request payload is validated with Zod:
     - `room_id` (valid UUID)
     - `guest_name` (non-empty string)
     - `guest_phone` (valid VN phone: 10 digits starting with 0)
     - `guest_email` (valid email format or optional)
     - `check_in_date` (YYYY-MM-DD, >= today)
     - `check_out_date` (YYYY-MM-DD, > check_in_date, stay <= 30 nights)
     - `guests_count` (integer >= 1)
     - `special_requests` (optional string)
     - `payment_method` (literal `'banking'`)
   **And** rate limiting is enforced (30 requests/minute per IP)
   **And** room existence, capacity, and active status are verified server-side

2. **Given** valid booking dates and room
   **When** total amount is computed
   **Then** the server calculates total server-side: `nights * price_per_night` (checking `room_pricing_rules` if applicable)
   **And** client-sent totals or prices are ignored/rejected
   **And** a booking code with prefix `BK` is generated (`BK` + 6 uppercase alphanumeric characters)
   **And** `status` is set to `pending` with `expires_at = now() + 15 minutes`

3. **Given** two concurrent booking requests for overlapping dates on the same room
   **When** the database insertion runs
   **Then** the PostgreSQL GiST exclusion constraint (`exclude_overlapping_bookings`) rejects the second insert
   **And** the API returns HTTP 409 Conflict with a clear error message ("Phòng đã có người đặt trong thời gian này")

4. **Given** a store order creation request sent to `POST /api/store/orders/create`
   **When** the request arrives
   **Then** the payload is validated with Zod (name, phone, address, province, quantity, slug, payment_method)
   **And** rate limiting is enforced (30 requests/minute per IP)
   **And** total is calculated strictly server-side: `product.price * quantity + shipping_fee`
   **And** atomic stock reservation is called via stored procedure `reserve_product_stock`
   **And** an order code with prefix `ST` is generated (`ST` + 6 uppercase alphanumeric characters)

5. **Given** requests to both endpoints
   **When** orders/bookings are written to the database
   **Then** the service role client (`createServiceRoleClient`) is used for database operations (bypassing restrictive RLS)
   **And** if the user is authenticated via session/cookie, `user_id` is linked; otherwise `user_id` is stored as `null` for guest checkouts
   **And** no direct client-side insert into `room_bookings` or `store_orders` is permitted by RLS policies

## Tasks / Subtasks

- [x] Task 1: Create `POST /api/bookings/create` route (AC: #1, #2, #3, #5)
  - [x] Implement Zod schema `createBookingSchema` with phone, date, and capacity validation
  - [x] Implement rate limiter (`rateLimit`) with keyPrefix `booking-create`
  - [x] Implement server-side total calculation: query `rooms` table for `price_per_night` and capacity
  - [x] Generate unique booking code with prefix `BK` + 6 chars
  - [x] Insert booking into `room_bookings` via `createServiceRoleClient` with `status: 'pending'` and 15-min `expires_at`
  - [x] Handle GiST exclusion constraint error (`23P01`) and return HTTP 409
  - [x] Attach `user_id` from `getEffectiveUser()` if logged in, else `null` for guest
- [x] Task 2: Review and enhance `POST /api/store/orders/create` route (AC: #4, #5)
  - [x] Support guest checkout if user not logged in (`user_id = null` instead of blocking with 401)
  - [x] Ensure atomic rollback (`release_product_stock`) if order item creation fails
  - [x] Ensure server-side calculation and Zod validation match AC #4
- [x] Task 3: Write comprehensive unit and integration tests (AC: #1 - #5)
  - [x] Unit tests for `POST /api/bookings/create`: validation errors, capacity check, past date rejection, GiST overlap 409, success flow
  - [x] Unit tests for `POST /api/store/orders/create`: validation errors, out of stock 409, guest vs auth checkout, success flow
- [x] Task 4: Validate RLS policies and security boundaries (AC: #5)
  - [x] Verify `room_bookings` and `store_orders` reject direct anonymous client inserts
  - [x] Verify all inserts succeed only through service role client in API routes

## Dev Notes

### Architecture Compliance

- **File location for booking**: `dainganxanh-landing/src/app/api/bookings/create/route.ts`
- **File location for store**: `dainganxanh-landing/src/app/api/store/orders/create/route.ts`
- **Database constraints**:
  - `exclude_overlapping_bookings` on `room_bookings`:
    ```sql
    CONSTRAINT exclude_overlapping_bookings
      EXCLUDE USING gist (
        room_id WITH =,
        daterange(check_in_date, check_out_date, '[)') WITH &&
      ) WHERE (status IN ('pending', 'confirmed', 'completed'))
    ```
    PostgreSQL error code for exclusion violation is `23P01`. Catch this error and return HTTP 409.
- **Stock Reservation**:
  - `public.reserve_product_stock(p_product_id UUID, p_qty INT)`: Stored procedure that atomically decrements `stock_quantity` and increments `reserved_quantity`.
  - `public.release_product_stock(p_product_id UUID, p_qty INT)`: Stored procedure to release hold on rollback.

### Code Patterns to Follow

1. **Service Role Client**: Use `createServiceRoleClient()` from `@/lib/supabase/server`
2. **User Context**: Use `getEffectiveUser()` from `@/lib/getEffectiveUser` to support both direct users and admin impersonation
3. **Rate Limiting**: Use `rateLimit(req, { limit: 30, windowMs: 60_000, keyPrefix: '...' })` from `@/lib/rate-limit`
4. **Code Generation**:
   ```ts
   function generateBookingCode(): string {
     return 'BK' + Math.random().toString(36).substring(2, 8).toUpperCase()
   }
   function generateStoreOrderCode(): string {
     return 'ST' + Math.random().toString(36).substring(2, 8).toUpperCase()
   }
   ```
5. **Vietnamese phone validation regex**: `/^0\d{9}$/`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 13.2]
- [Source: _bmad-output/planning-artifacts/architecture.md#API Contracts]
- [Source: docs/prd.md#4.3 Security & Access Control, CC-09]
- [Source: supabase/migrations/20260530000001_eco_tourism_schema.sql#room_bookings]


### Review Findings

- [x] [Review][Patch] So sánh ngày check-in theo Timezone Việt Nam (UTC+7, `Asia/Ho_Chi_Minh`) thay vì UTC để tránh từ chối đặt phòng cùng ngày vào buổi sáng.
- [x] [Review][Patch] Tích hợp `captureError` từ `@/lib/monitoring` cho các khối lỗi hệ thống (500) tại `POST /api/bookings/create` và `POST /api/store/orders/create` để chuyển tiếp log lên Sentry.

Đã áp dụng cả 2 bản vá cải tiến. Tất cả 25 unit tests và typecheck đã pass 100%.

## Dev Agent Record

### Agent Model Used

claude-sonnet-5

### Debug Log References

### Completion Notes List

- ✅ Implemented `POST /api/bookings/create` with Zod validation (name, phone, dates, guest count, UUID), server-side total computation, capacity verification, and rate limiting (30 req/min).
- ✅ Handled PostgreSQL GiST exclusion constraint (`exclude_overlapping_bookings` / `23P01`) to return HTTP 409 Conflict when overlapping dates are booked for the same room.
- ✅ Enhanced `POST /api/store/orders/create` to support guest checkout (`user_id = null`), robust error handling, server-side price calculation, and atomic stock reservation (`reserve_product_stock`) with rollback on error.
- ✅ Added unit test suites for both endpoints covering validation, price computation, code generation, date boundaries, and GiST conflict identification (21 tests passed).
- ✅ Live verified against local Next.js server + local Supabase (successful booking creation 201, GiST overlap 409, atomic stock decrement, COD confirmation).
- ✅ Confirmed RLS boundaries: direct client insert is blocked on `room_bookings` and `store_orders`; writes succeed only through service role client in server API routes.

### File List

- `dainganxanh-landing/src/app/api/bookings/create/route.ts` (created)
- `dainganxanh-landing/src/app/api/bookings/create/__tests__/route.test.ts` (created)
- `dainganxanh-landing/src/app/api/store/orders/create/route.ts` (enhanced)
- `dainganxanh-landing/src/app/api/store/orders/create/__tests__/route.test.ts` (created)
- `_bmad-output/implementation-artifacts/13-2-secure-order-creation-apis.md` (updated)
EOF
