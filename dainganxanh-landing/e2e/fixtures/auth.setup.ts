import { test as setup, expect } from '@playwright/test';
import { envConfig } from '../config/env';
import { getOTPFromMailpit } from '../utils/mailpit';
import * as path from 'path';

// Nơi lưu trữ phiên đăng nhập (session storage state)
const adminFile = path.resolve(__dirname, '../storagestate/admin.json');
// Optional: Có thể tạo thêm userFile nếu dự án phân quyền Admin cứng và User riêng

setup('Xác thực đăng nhập toàn cục (Global Auth)', async ({ page }) => {
    console.log('🔄 Bắt đầu Global Setup: Đang tiến hành Đăng nhập...');
    
    // Xoá cookie / storage cũ nếu có
    await page.context().clearCookies();

    // Vào trang login Admin/User (trong hệ thống này, /login dùng chung)
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input#identifier-input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    
    // Điền Email của Tester (Admin)
    await emailInput.fill(envConfig.ADMIN_EMAIL);

    // Gửi yêu cầu lấy OTP
    const sendOTPButton = page.getByRole('button', { name: /gửi mã otp/i });
    await sendOTPButton.click();

    // Đợi form nhập mã xuất hiện
    await expect(page.getByText(/nhập mã otp \(8 chữ số\)/i)).toBeVisible({ timeout: 10000 });

    console.log(`⏳ Đang chạy gọi tới Mailpit tại url: ${envConfig.MAILPIT_URL} ...`);
    // Lấy OTP code từ Utility
    const otpCode = await getOTPFromMailpit(envConfig.ADMIN_EMAIL);
    console.log(`✅ Lấy thành công OTP: ${otpCode}`);

    const otpInputs = page.locator('input[inputmode="numeric"]');
    // Nhập thủ công OTP giống user thật (8 ô)
    for (let i = 0; i < 8; i++) {
        await otpInputs.nth(i).fill(otpCode[i]);
    }

    // Đợi quá trình Redirect tự động hoặc chờ nhấn Bỏ Qua nếu hiện form đăng ký Referral
    try {
        await Promise.race([
            page.waitForURL((url) => !url.href.includes('/login'), { timeout: 15000 }),
            page.getByRole('button', { name: /bỏ qua/i }).waitFor({ state: 'visible', timeout: 8000 })
        ]);

        const skipButton = page.getByRole('button', { name: /bỏ qua/i });
        if (await skipButton.isVisible()) {
            await skipButton.click();
            await page.waitForLoadState('networkidle');
        }
    } catch {
        console.log('⚠️ Không tìm thấy nút Bỏ Qua hoặc redirect tự nhiên, tiếp tục lưu State.');
        await page.waitForLoadState('networkidle');
    }

    // Đảm bảo cookie phiên đăng nhập đã được thiết lập bởi backend (Supabase auth)
    await page.waitForTimeout(2000); 
    
    // Lưu trạng thái đăng nhập (Tokens, Cookies, LocalStorage) vào file json
    await page.context().storageState({ path: adminFile });
    
    console.log(`✅ Setup hoàn tất. Trạng thái xác thực lưu tại: ${adminFile}`);
});
