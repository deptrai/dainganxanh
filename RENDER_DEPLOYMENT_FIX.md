# 🔧 Hướng dẫn khắc phục lỗi trên Render

## 🎯 Vấn đề phát hiện

**Lỗi:** `Application error: a client-side exception has occurred`

**Nguyên nhân:** Environment variables `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY` không được set trong build environment của Render.

## ✅ Giải pháp

### Bước 1: Kiểm tra Environment Variables trên Render

1. Đăng nhập vào [Render Dashboard](https://dashboard.render.com/)
2. Chọn service `dainganxanh` hoặc `dainganxanh-landing`
3. Vào tab **"Environment"**
4. Kiểm tra xem có các biến sau không:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://gzuuyzikjvykjpeixzqk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dXV5emlranZ5a2pwZWl4enFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNDI5ODYsImV4cCI6MjA4MzYxODk4Nn0.FRIlpL0vLsYJ6OlM_Yxf-lBkF_sfYpxkWSAQ6TQU_fk
```

### Bước 2: Thêm Environment Variables (nếu chưa có)

Click **"Add Environment Variable"** và thêm:

**Variable 1:**
- Key: `NEXT_PUBLIC_SUPABASE_URL`
- Value: `https://gzuuyzikjvykjpeixzqk.supabase.co`

**Variable 2:**
- Key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dXV5emlranZ5a2pwZWl4enFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNDI5ODYsImV4cCI6MjA4MzYxODk4Nn0.FRIlpL0vLsYJ6OlM_Yxf-lBkF_sfYpxkWSAQ6TQU_fk`

**Variable 3:**
- Key: `NEXT_PUBLIC_BASE_URL`
- Value: `https://dainganxanh.com.vn`

**Variable 4:**
- Key: `SUPABASE_SERVICE_ROLE_KEY`
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dXV5emlranZ5a2pwZWl4enFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODA0Mjk4NiwiZXhwIjoyMDgzNjE4OTg2fQ._peCNxZb8juCAvvNxvp6RB_37f17_8ToZPY-aJNaxE4`

**Variable 5:**
- Key: `RESEND_API_KEY`
- Value: `re_8MwR5S63_3RHeMeqPmsBBwp9dmj3agkkD`

**Variable 6-9 (Banking info):**
```
NEXT_PUBLIC_BANK_NAME=Vietcombank
NEXT_PUBLIC_BANK_ACCOUNT=1234567890
NEXT_PUBLIC_BANK_HOLDER=CÔNG TY ĐẠI NGÀN XANH
NEXT_PUBLIC_BANK_BRANCH=Chi nhánh TP.HCM
```

**Variable 10:**
- Key: `POSTGRESURI`
- Value: `postgresql://postgres:3oGKl037r3PDI1eT@db.gzuuyzikjvykjpeixzqk.supabase.co:5432/postgres`

### Bước 3: Trigger Manual Deploy

⚠️ **QUAN TRỌNG:** Sau khi thêm/sửa env vars, bạn PHẢI trigger manual deploy:

1. Vào tab **"Manual Deploy"** hoặc **"Deploys"**
2. Click **"Deploy latest commit"** hoặc **"Clear build cache & deploy"**
3. Đợi build hoàn tất (3-5 phút)

### Bước 4: Kiểm tra Logs

Trong quá trình deploy, xem logs để đảm bảo:
- Build thành công
- Không có lỗi về missing env vars
- Server start thành công

### Bước 5: Test Website

1. Truy cập https://dainganxanh.com.vn/
2. Hard refresh (Ctrl+Shift+R hoặc Cmd+Shift+R)
3. Mở Console (F12) để xem có lỗi không

## 🔍 Nếu vẫn lỗi

### Kiểm tra Build Logs

Trong Render Dashboard:
1. Vào tab "Logs"
2. Tìm dòng có chứa "Missing Supabase environment variables"
3. Nếu thấy → env vars chưa được set đúng

### Clear Build Cache

Nếu vẫn lỗi sau khi set env vars:
1. Vào "Settings"
2. Scroll xuống "Danger Zone"
3. Click "Clear build cache"
4. Sau đó trigger deploy lại

## 📝 Checklist

- [ ] Đã thêm `NEXT_PUBLIC_SUPABASE_URL` vào Render
- [ ] Đã thêm `NEXT_PUBLIC_SUPABASE_ANON_KEY` vào Render
- [ ] Đã thêm `NEXT_PUBLIC_BASE_URL=https://dainganxanh.com.vn`
- [ ] Đã thêm các env vars khác (SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, etc.)
- [ ] Đã trigger manual deploy
- [ ] Build thành công (check logs)
- [ ] Website hoạt động bình thường

## 💡 Lưu ý quan trọng

1. **`NEXT_PUBLIC_*` variables phải có LÚC BUILD**, không phải runtime
2. Mỗi lần thay đổi env vars phải **deploy lại**
3. Nếu dùng "Auto-Deploy", Render sẽ tự deploy khi có git push
4. Nếu dùng "Manual Deploy", phải click deploy sau khi đổi env vars

## 🆘 Vẫn không được?

Gửi cho tôi:
1. Screenshot của Environment Variables trong Render
2. Screenshot của Build Logs (phần cuối)
3. Screenshot của Console errors trong browser (F12)

