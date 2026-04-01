/**
 * e2e/config/env.ts
 * Quản lý tập trung các biến môi trường, URLs và emails dùng trong test E2E.
 * Tránh việc hardcode lặp lại trong hơn 25 specs.
 */

export const envConfig = {
    // Mặc định chạy nội bộ
    MAILPIT_URL: process.env.MAILPIT_URL || 'http://127.0.0.1:54334',
    BASE_URL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001',
    
    // Testing Accounts
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'phanquochoipt@gmail.com',
    USER_EMAIL: process.env.USER_EMAIL || 'phanquochoipt@gmail.com', // Tạm thời dùng cùng 1 tài khoản nếu dự án chỉ yêu cầu 1 test user
    TEST_EMAIL: process.env.TEST_EMAIL || 'test-keyboard@test.local',
    
    // Auth Configurations
    AUTH_TIMEOUT: 15000, // Ms timeout cho quá trình đăng nhập (Đọc Mailpit)
};
