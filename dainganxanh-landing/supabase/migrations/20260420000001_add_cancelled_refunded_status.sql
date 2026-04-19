-- Migration: add cancelled_refunded to orders_status_check constraint
-- Story 5.7: Order Refund for Completed Orders
-- Date: 2026-04-20

ALTER TABLE public.orders
  DROP CONSTRAINT orders_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check CHECK (
    status = ANY (ARRAY[
      'pending'::text,
      'paid'::text,
      'manual_payment_claimed'::text,
      'verified'::text,
      'completed'::text,
      'assigned'::text,
      'failed'::text,
      'cancelled'::text,
      'cancelled_refunded'::text
    ])
  );
