# 07 — Authentication Flow
> Cập nhật: 2026-04-07

## Routes

`/register` → `/login` → `/auth/callback`

## Mô tả

Xác thực chỉ bằng Email OTP (phone đã bị comment out). Register yêu cầu nhập mã giới thiệu trước khi gửi OTP. Login kiểm tra ref cookie và hiển thị modal nhập mã nếu chưa có. Middleware bảo vệ toàn bộ `/crm/*`.

## Flowchart (Mermaid)

```mermaid
flowchart TD
    Unauth([User chưa đăng nhập]) --> Middleware[Next.js Middleware\nBảo vệ /crm/ routes]
    Middleware -->|Chưa auth| RedirectLogin[Redirect /login\nLưu redirect path]
    Middleware -->|Đã auth| Allow[Cho phép truy cập]
    Allow --> RequestedPage[Hiển thị trang yêu cầu]

    RedirectLogin --> LoginPage[Trang đăng nhập\nRoute /login]
    LoginPage --> RefCookieCheck{Có ref cookie?}
    RefCookieCheck -->|Không| RefCodeModal[Hiển thị RefCodeModal\nNhập mã giới thiệu\nDefault: dainganxanh nếu bỏ trống]
    RefCodeModal --> InputEmail
    RefCookieCheck -->|Có| InputEmail[Nhập email]

    InputEmail --> SendOTP[Supabase gửi OTP\nHiệu lực 5 phút]
    SendOTP --> EnterCode[Nhập mã OTP 8 số\nDev bypass: 12345678]
    EnterCode --> OTPValid{OTP hợp lệ?}
    OTPValid -->|Không| Retry[Nhập lại hoặc gửi lại\nĐếm ngược 60s]
    OTPValid -->|Có| SetSession[Supabase setSession\nSet auth cookie]
    SetSession --> EnsureProfile[ensureUserProfile\nTạo profile nếu chưa có]
    EnsureProfile --> CheckRole{Role của user?}
    CheckRole -->|user| UserHome[Redirect /crm/my-garden\nhoặc redirect param]
    CheckRole -->|admin hoặc super_admin| AdminHome[Redirect /crm/admin]

    RegisterPage[Trang đăng ký\nRoute /register?quantity=N] --> RefRequired[Nhập mã giới thiệu\nBẮT BUỘC trước khi gửi OTP\nDefault nếu bỏ trống: dainganxanh]
    RefRequired --> InputEmailReg[Nhập email]
    InputEmailReg --> SendOTPReg[Supabase gửi OTP]
    SendOTPReg --> EnterCodeReg[Nhập mã OTP 8 số\nDev bypass: 12345678]
    EnterCodeReg --> OTPValidReg{OTP hợp lệ?}
    OTPValidReg -->|Không| RetryReg[Nhập lại hoặc gửi lại]
    OTPValidReg -->|Có| SetSessionReg[Supabase setSession]
    SetSessionReg --> EnsureProfileReg[ensureUserProfile\nTạo profile nếu chưa có]
    EnsureProfileReg --> SetRefCookie[Set cookie ref = CODE\nExpiry 90 ngày\nFirst referrer wins]
    SetRefCookie --> RedirectCheckout[Redirect /checkout?quantity=N]

    AuthCallback[Route /auth/callback\nMagic link handler] --> ExtractToken[Lấy token từ URL hash\naccess_token + refresh_token]
    ExtractToken --> SessionOK{Session hợp lệ?}
    SessionOK -->|Có| EnsureProfileCB[ensureUserProfile]
    EnsureProfileCB --> RedirectHome[Redirect trang chủ]
    SessionOK -->|Không| LoginError[Redirect /login\nerror: auth_failed]
```

## Ghi chú kỹ thuật

**Email OTP only:** Phone OTP đã được comment out trong code. Chỉ hỗ trợ xác thực qua email.

**Register — ref code bắt buộc:** User phải nhập (hoặc confirm) mã giới thiệu trước khi form gửi OTP. Nếu bỏ trống → default `dainganxanh`. Logic này ngăn chặn register không có referral.

**Login — RefCodeModal:** Nếu user đăng nhập mà chưa có ref cookie, hiển thị modal để nhập mã giới thiệu trước. Đảm bảo mọi session đều có referral context.

**ensureUserProfile:** Được gọi sau mỗi OTP success (cả register, login, auth/callback). Tạo bản ghi trong `public.users` nếu chưa tồn tại — đảm bảo profile luôn có trước khi user vào CRM.

**Cookie expiry:**
- `ReferralTracker` (ref cookie từ landing page): 30 ngày
- Cookie ref set sau OTP (register/login): 90 ngày
- First referrer wins — không ghi đè cookie đã có

**Dev bypass:** OTP `12345678` bỏ qua xác thực trong môi trường development. Không hoạt động trên production.

**Middleware:** Bảo vệ toàn bộ `/crm/*`. Lưu `redirect` param để sau khi login quay lại đúng trang. Session được đọc từ Supabase cookie.

**Session management:** Dùng Supabase cookie-based session. `setSession` sau OTP verify → browser nhận auth cookie → mọi request sau đó tự động mang cookie này.
