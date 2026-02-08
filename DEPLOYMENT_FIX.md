# 🔧 Hướng dẫn khắc phục lỗi 502 Bad Gateway

## 📊 Tình trạng hiện tại

**Website:** https://dainganxanh.com.vn/  
**Lỗi:** 502 Bad Gateway  
**Nguyên nhân:** Backend server không phản hồi

## ✅ Đã kiểm tra

1. ✅ **Build local thành công** - Code không có lỗi
2. ✅ **Dockerfile cấu hình đúng** - Sử dụng standalone output
3. ✅ **Environment variables local đầy đủ**
4. ✅ **next.config.js đúng cấu hình**

## ❌ Vấn đề phát hiện

**Nguyên nhân chính:** Production environment variables chưa được set đúng hoặc container không chạy

## 🔧 Các bước khắc phục

### Bước 1: Truy cập Dokploy Dashboard

1. Đăng nhập vào Dokploy dashboard
2. Tìm project `dainganxanh` hoặc `dainganxanh-landing`
3. Kiểm tra status của container

### Bước 2: Kiểm tra Environment Variables

Đảm bảo các biến môi trường sau đã được set trong Dokploy:

```bash
# Supabase Configuration (BẮT BUỘC)
NEXT_PUBLIC_SUPABASE_URL=https://gzuuyzikjvykjpeixzqk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dXV5emlranZ5a2pwZWl4enFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNDI5ODYsImV4cCI6MjA4MzYxODk4Nn0.FRIlpL0vLsYJ6OlM_Yxf-lBkF_sfYpxkWSAQ6TQU_fk

# Service Role Key (BẮT BUỘC cho admin operations)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dXV5emlranZ5a2pwZWl4enFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODA0Mjk4NiwiZXhwIjoyMDgzNjE4OTg2fQ._peCNxZb8juCAvvNxvp6RB_37f17_8ToZPY-aJNaxE4

# Base URL (QUAN TRỌNG - phải là domain production)
NEXT_PUBLIC_BASE_URL=https://dainganxanh.com.vn

# Email Service
RESEND_API_KEY=re_8MwR5S63_3RHeMeqPmsBBwp9dmj3agkkD

# Banking Information
NEXT_PUBLIC_BANK_NAME=Vietcombank
NEXT_PUBLIC_BANK_ACCOUNT=1234567890
NEXT_PUBLIC_BANK_HOLDER=CÔNG TY ĐẠI NGÀN XANH
NEXT_PUBLIC_BANK_BRANCH=Chi nhánh TP.HCM

# Database URI
POSTGRESURI=postgresql://postgres:3oGKl037r3PDI1eT@db.gzuuyzikjvykjpeixzqk.supabase.co:5432/postgres

# Next.js Configuration
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
PORT=3000
HOSTNAME=0.0.0.0
```

### Bước 3: Kiểm tra Port Mapping

Đảm bảo trong Dokploy:
- **Container Port:** 3000
- **Host Port:** 80 hoặc 443 (tùy theo cấu hình)
- **Protocol:** HTTP/HTTPS

### Bước 4: Rebuild và Restart

1. Sau khi set environment variables, click **Rebuild**
2. Hoặc click **Restart** nếu chỉ thay đổi env vars
3. Đợi container khởi động (khoảng 1-2 phút)

### Bước 5: Kiểm tra Logs

Trong Dokploy dashboard:
1. Vào tab **Logs**
2. Xem có lỗi gì không
3. Tìm dòng: `✓ Ready in XXXms` → nghĩa là server đã start thành công

## 🔍 Các lỗi thường gặp

### Lỗi 1: Missing Environment Variables
```
Error: NEXT_PUBLIC_SUPABASE_URL is not defined
```
**Giải pháp:** Set lại environment variables như bước 2

### Lỗi 2: Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Giải pháp:** Restart container hoặc thay đổi port

### Lỗi 3: Database Connection Failed
```
Error: connect ECONNREFUSED
```
**Giải pháp:** Kiểm tra POSTGRESURI và firewall rules

## 📝 Checklist

- [ ] Environment variables đã được set trong Dokploy
- [ ] NEXT_PUBLIC_BASE_URL = https://dainganxanh.com.vn (không phải localhost)
- [ ] Port mapping đúng (3000 → 80/443)
- [ ] Container đã được rebuild/restart
- [ ] Logs không có lỗi
- [ ] Website đã hoạt động trở lại

## 🆘 Nếu vẫn không hoạt động

1. **Kiểm tra Cloudflare:**
   - Vào Cloudflare dashboard
   - Kiểm tra DNS records
   - Tạm thời tắt proxy (orange cloud → grey cloud) để test

2. **Kiểm tra Dokploy:**
   - Xem container có đang chạy không
   - Check resource usage (CPU, Memory)
   - Xem logs chi tiết

3. **Test local với production env:**
   ```bash
   cd dainganxanh-landing
   # Copy production env vars vào .env.local
   pnpm build
   pnpm start
   # Truy cập http://localhost:3000
   ```

## 📞 Liên hệ hỗ trợ

Nếu cần hỗ trợ thêm, cung cấp:
- Screenshot của Dokploy logs
- Screenshot của environment variables settings
- Thời gian xảy ra lỗi

