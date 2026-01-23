-- Create email_templates table for storing email templates
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_key TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  variables JSONB, -- List of available template variables
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all email templates
CREATE POLICY "Admins can view email templates"
  ON email_templates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Policy: Admins can update email templates (for future Story 4-6)
CREATE POLICY "Admins can update email templates"
  ON email_templates
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Create index for faster lookups by template_key
CREATE INDEX IF NOT EXISTS idx_email_templates_key ON email_templates(template_key);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_email_templates_updated_at();

-- Seed email templates from existing Edge Function
-- Template 1: Withdrawal Request Created (Admin Notification)
INSERT INTO email_templates (template_key, subject, html_body, variables) VALUES
(
  'withdrawal_request_created',
  'Yêu cầu rút tiền mới - Đại Ngàn Xanh',
  '<div style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #eee;">
      <div style="font-size: 24px; font-weight: bold; color: #10b981; text-decoration: none;">Đại Ngàn Xanh</div>
    </div>
    <h2>Yêu cầu rút tiền mới</h2>
    <p>Có một yêu cầu rút tiền mới từ <strong>{{fullName}}</strong>.</p>
    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p><strong>Số tiền:</strong> {{amount}}</p>
      <p><strong>Ngân hàng:</strong> {{bankName}}</p>
      <p><strong>Số tài khoản:</strong> {{bankAccountNumber}}</p>
      <p><strong>Người nhận:</strong> {{fullName}}</p>
    </div>
    <p>Vui lòng kiểm tra và xử lý tại trang quản trị.</p>
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #666;">
      <p>Email này được gửi tự động từ hệ thống Đại Ngàn Xanh.</p>
    </div>
  </div>',
  '["fullName", "amount", "bankName", "bankAccountNumber"]'::jsonb
),
(
  'withdrawal_request_approved',
  'Yêu cầu rút tiền đã được duyệt - Đại Ngàn Xanh',
  '<div style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #eee;">
      <div style="font-size: 24px; font-weight: bold; color: #10b981; text-decoration: none;">Đại Ngàn Xanh</div>
    </div>
    <h2 style="color: #10b981;">Yêu cầu rút tiền thành công</h2>
    <p>Xin chào <strong>{{fullName}}</strong>,</p>
    <p>Yêu cầu rút tiền của bạn đã được duyệt và chuyển khoản thành công.</p>
    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p><strong>Số tiền:</strong> {{amount}}</p>
      <p><strong>Ngân hàng:</strong> {{bankName}}</p>
      <p><strong>Số tài khoản:</strong> {{bankAccountNumber}}</p>
    </div>
    <p>Cảm ơn bạn đã đồng hành cùng Đại Ngàn Xanh!</p>
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #666;">
      <p>Nếu bạn có thắc mắc, vui lòng liên hệ bộ phận hỗ trợ.</p>
    </div>
  </div>',
  '["fullName", "amount", "bankName", "bankAccountNumber", "proofImageUrl"]'::jsonb
),
(
  'withdrawal_request_rejected',
  'Thông báo về yêu cầu rút tiền - Đại Ngàn Xanh',
  '<div style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #eee;">
      <div style="font-size: 24px; font-weight: bold; color: #10b981; text-decoration: none;">Đại Ngàn Xanh</div>
    </div>
    <h2 style="color: #ef4444;">Yêu cầu rút tiền bị từ chối</h2>
    <p>Xin chào <strong>{{fullName}}</strong>,</p>
    <p>Rất tiếc, yêu cầu rút tiền của bạn đã không được chấp nhận.</p>
    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p><strong>Số tiền:</strong> {{amount}}</p>
      <p><strong>Lý do từ chối:</strong></p>
      <p style="color: #ef4444; font-weight: 500;">{{rejectionReason}}</p>
    </div>
    <p>Vui lòng kiểm tra lại thông tin hoặc liên hệ bộ phận hỗ trợ để được giải đáp.</p>
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #666;">
      <p>Email này được gửi tự động từ hệ thống Đại Ngàn Xanh.</p>
    </div>
  </div>',
  '["fullName", "amount", "rejectionReason"]'::jsonb
)
ON CONFLICT (template_key) DO NOTHING;
