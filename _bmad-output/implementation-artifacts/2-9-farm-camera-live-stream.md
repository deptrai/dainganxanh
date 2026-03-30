# Story 2.9: Farm Camera Live Stream

Status: done

## Story

As a **customer**,
I want to **xem live stream camera từ vườn trực tiếp trong trang quản lý cây của tôi**,
so that **tôi có thể quan sát cây của mình 24/7 mà không cần đến tận nơi**.

## Acceptance Criteria

1. **Given** tôi vào trang `/crm/my-garden/[orderId]`
   **When** trang được load
   **Then** section "Camera Vườn Trực Tiếp" hiển thị với status badge

2. **And** nếu go2rtc server có stream `farm` active → badge **"Đang phát"** (emerald, animated pulse) + iframe stream

3. **And** nếu go2rtc server offline / stream không tồn tại → badge **"Ngoại tuyến"** + placeholder thay thế iframe

4. **And** nút Refresh tải lại iframe (không reload page)

5. **And** nút Fullscreen mở stream toàn màn hình

6. **And** status được check lại mỗi **30 giây** tự động

7. **And** trang chủ `/api/camera/status?stream=farm` trả `{online, streaming}` trong < 5 giây

## Tasks / Subtasks

- [x] Task 1: Server-side status probe API (AC: 7)
  - [x] 1.1 Tạo `src/app/api/camera/status/route.ts` — Next.js App Router GET handler
  - [x] 1.2 Proxy call đến go2rtc `/api/streams` với `https.Agent({ rejectUnauthorized: false })` để bypass self-signed cert
  - [x] 1.3 Parse response: `online = !!data[stream]`, `streaming = producers.some(p => p.bytes_recv > 0)`
  - [x] 1.4 Fallback `{ online: false }` khi unreachable / timeout 5s
  - [x] 1.5 `next: { revalidate: 0 }` — không cache, luôn fresh

- [x] Task 2: FarmCamera component (AC: 1, 2, 3, 4, 5, 6)
  - [x] 2.1 Tạo `src/components/crm/FarmCamera.tsx` — "use client" component
  - [x] 2.2 `useEffect` poll `/api/camera/status` mỗi 30s, timeout 6s
  - [x] 2.3 `isOnline === null` (loading) → render iframe ngay (optimistic)
  - [x] 2.4 `isOnline === false` → VideoOff placeholder + text "Camera đang ngoại tuyến"
  - [x] 2.5 `isOnline === true` → iframe `go2rtc/stream.html?src=farm&mode=mse`
  - [x] 2.6 Refresh button: increment `key` state → React remount iframe
  - [x] 2.7 Fullscreen button: `containerRef.current.requestFullscreen()`

- [x] Task 3: Integration vào tree detail page (AC: 1)
  - [x] 3.1 Import `FarmCamera` vào `src/app/crm/my-garden/[orderId]/page.tsx`
  - [x] 3.2 Render `<FarmCamera streamName="farm" />` sau GPS Map section

- [x] Task 4: Infrastructure (out-of-band)
  - [x] 4.1 go2rtc v1.9.14 chạy trên VPS 167.172.66.16:1984
  - [x] 4.2 frpc tunnel: camera RTSP (192.168.0.135:554) → VPS port 8554
  - [x] 4.3 DNS: `stream.dainganxanh.com.vn` → 167.172.66.16
  - [x] 4.4 Traefik routing: `stream.dainganxanh.com.vn` → go2rtc:1984
  - [x] 4.5 Let's Encrypt cert via Traefik ACME (HTTP-01 challenge) — valid Mar–Jun 2026
  - [x] 4.6 `NEXT_PUBLIC_GO2RTC_URL=https://stream.dainganxanh.com.vn` trong Dokploy env + buildArgs

## Dev Notes

### Architecture

```
Browser
  └─ iframe src="https://stream.dainganxanh.com.vn/stream.html?src=farm&mode=mse"
  └─ fetch /api/camera/status?stream=farm (same-origin, no SSL issue)
        └─ Next.js API Route (server-side)
              └─ fetch https://stream.dainganxanh.com.vn/api/streams (Node.js, rejectUnauthorized:false)
                    └─ go2rtc on VPS
                          └─ frpc tunnel ← RTSP camera on LAN

```

### Key Decisions
- **Server-side probe**: Browser không thể fetch `stream.dainganxanh.com.vn` trực tiếp khi có self-signed cert (mixed content / SSL error). Server-side proxy giải quyết vấn đề này.
- **`rejectUnauthorized: false`**: Chấp nhận self-signed cert trong server context. Đây là intentional vì cert Traefik có thể là self-signed ở tầng nội bộ.
- **Optimistic render**: Khi `isOnline === null` (chưa có kết quả probe), render iframe ngay thay vì spinner → giảm thời gian người dùng nhìn thấy stream.
- **`streaming` vs `online`**: `online = true` nghĩa là stream entry tồn tại trong go2rtc config. `streaming = true` nghĩa là có active RTSP producer (camera đang truyền). go2rtc lazy-connect nên `streaming` thường `false` khi không có viewer.
- **30s poll interval**: Cân bằng giữa freshness và server load.

### Environment Variables
- `NEXT_PUBLIC_GO2RTC_URL`: URL của go2rtc server. Default: `https://stream.dainganxanh.com.vn`

### Files Changed
- `src/app/api/camera/status/route.ts` — NEW
- `src/components/crm/FarmCamera.tsx` — NEW
- `src/app/crm/my-garden/[orderId]/page.tsx` — MODIFIED (added FarmCamera import + usage)
- `dainganxanh-landing/.env.local` — MODIFIED (added NEXT_PUBLIC_GO2RTC_URL)
