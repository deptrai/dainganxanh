-- Migration: confirm_product_stock
-- Story 12.5: Confirm Store Payment
-- Reduces reserved_quantity without returning items to stock_quantity (sale is completed).

CREATE OR REPLACE FUNCTION public.confirm_product_stock(p_product_id UUID, p_qty INT)
RETURNS VOID AS $$
BEGIN
  IF p_qty IS NULL OR p_qty <= 0 THEN
    RETURN;
  END IF;
  UPDATE public.products
  SET reserved_quantity = GREATEST(reserved_quantity - p_qty, 0)
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SET search_path = public;
