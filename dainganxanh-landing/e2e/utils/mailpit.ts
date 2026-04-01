/**
 * e2e/utils/mailpit.ts
 * Hàm dùng chung duy nhất cho việc lấy OTP từ Mailpit.
 */
import { envConfig } from '../config/env';

export async function getOTPFromMailpit(email: string): Promise<string> {
    // Đợi 2 giây để chờ hệ thống backend đổ email về Mailpit
    await new Promise(resolve => setTimeout(resolve, 2000));

    const response = await fetch(`${envConfig.MAILPIT_URL}/api/v1/messages`);
    const data = await response.json();

    const messages = data.messages || [];
    const latestMessage = messages.find((msg: any) =>
        msg.To && msg.To.some((to: any) => to.Address === email)
    );

    if (!latestMessage) {
        throw new Error(`[Mailpit] Không tìm thấy email OTP gửi tới ${email}. Có thể dịch vụ chưa chạy hoặc cấu hình gửi sai.`);
    }

    const msgResponse = await fetch(`${envConfig.MAILPIT_URL}/api/v1/message/${latestMessage.ID}`);
    const msgData = await msgResponse.json();

    const text = msgData.Text || '';
    const otpMatch = text.match(/\b\d{8}\b/);

    if (!otpMatch) {
        throw new Error(`[Mailpit] Không thể tìm thấy chuỗi 8 chữ số OTP trong nội dung thư: ${text}`);
    }

    return otpMatch[0];
}
