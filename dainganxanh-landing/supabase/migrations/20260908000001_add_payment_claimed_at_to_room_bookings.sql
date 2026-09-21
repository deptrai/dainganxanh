ALTER TABLE public.room_bookings
  ADD COLUMN IF NOT EXISTS payment_claimed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS cancellation_reason text;
