-- Add 'paid' and 'manual_payment_claimed' to orders status constraint
ALTER TABLE public.orders DROP CONSTRAINT orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status = ANY (ARRAY[
    'pending'::text,
    'paid'::text,
    'manual_payment_claimed'::text,
    'verified'::text,
    'completed'::text,
    'assigned'::text,
    'failed'::text,
    'cancelled'::text
  ]));
