-- Migration: 20261008000000_expire_pending_bookings_cron.sql
-- TD-05: Tự động hủy đơn đặt phòng pending quá hạn 15 phút bằng pg_cron

-- 1. Tạo function expire_pending_bookings với SECURITY DEFINER và search_path an toàn
CREATE OR REPLACE FUNCTION public.expire_pending_bookings()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_bookings_count INTEGER := 0;
BEGIN
  -- Cập nhật bảng room_bookings (bảng chính thức của hệ thống)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'room_bookings'
  ) THEN
    WITH updated AS (
      UPDATE public.room_bookings
      SET status = 'cancelled',
          cancellation_reason = 'Payment timeout (15 mins)',
          updated_at = now()
      WHERE status = 'pending'
        AND expires_at IS NOT NULL
        AND expires_at < now()
      RETURNING id
    )
    SELECT count(*) INTO v_count FROM updated;
  END IF;

  -- Hỗ trợ thêm bảng bookings nếu tồn tại (phòng trường hợp alias/schema khác)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'bookings'
  ) THEN
    EXECUTE '
      WITH updated AS (
        UPDATE public.bookings
        SET status = ''cancelled'',
            cancellation_reason = ''Payment timeout (15 mins)'',
            updated_at = now()
        WHERE status = ''pending''
          AND expires_at IS NOT NULL
          AND expires_at < now()
        RETURNING id
      )
      SELECT count(*) FROM updated'
    INTO v_bookings_count;
    v_count := v_count + COALESCE(v_bookings_count, 0);
  END IF;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

COMMENT ON FUNCTION public.expire_pending_bookings() IS
'Hủy các đơn đặt phòng pending quá hạn (expires_at < now()), giải phóng phòng và trả về số lượng đơn đã hủy.';

-- Function alias expire_bookings() để tương thích với API route RPC call
CREATE OR REPLACE FUNCTION public.expire_bookings()
RETURNS INTEGER AS $$
BEGIN
  RETURN public.expire_pending_bookings();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 2. Kích hoạt pg_cron và lập lịch chạy mỗi 15 phút (idempotent, an toàn trên mọi môi trường)
DO $$
BEGIN
  -- Kiểm tra xem extension pg_cron có sẵn trong danh sách extensions không
  IF EXISTS (
    SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron'
  ) THEN
    -- Cài đặt extension nếu chưa có
    CREATE EXTENSION IF NOT EXISTS pg_cron;

    -- Kiểm tra bảng cron.job và chỉ tạo job nếu chưa tồn tại
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'cron' AND table_name = 'job'
    ) THEN
      IF NOT EXISTS (
        SELECT 1 FROM cron.job WHERE jobname = 'expire-pending-bookings'
      ) THEN
        PERFORM cron.schedule(
          'expire-pending-bookings',
          '*/15 * * * *',
          $$SELECT public.expire_pending_bookings()$$
        );
        RAISE NOTICE 'Đã tạo pg_cron job expire-pending-bookings chạy mỗi 15 phút.';
      ELSE
        RAISE NOTICE 'pg_cron job expire-pending-bookings đã tồn tại, bỏ qua tạo mới.';
      END IF;
    END IF;
  ELSE
    RAISE NOTICE 'Extension pg_cron không khả dụng trên môi trường này, bỏ qua lập lịch tự động.';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Bỏ qua lỗi (ví dụ không đủ quyền superuser trên môi trường dev/local không có pg_cron)
    RAISE NOTICE 'Không thể khởi tạo hoặc lập lịch pg_cron (lỗi: %), bỏ qua để migration không bị gián đoạn.', SQLERRM;
END;
$$;
