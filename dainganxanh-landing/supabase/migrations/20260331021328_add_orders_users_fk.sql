-- Add foreign key constraint from orders.user_id to auth.users.id
-- This fixes PostgREST error PGRST200: "Could not find a relationship between 'orders' and 'users'"

ALTER TABLE public.orders
ADD CONSTRAINT fk_orders_users
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Add index for performance on the foreign key column
CREATE INDEX IF NOT EXISTS idx_orders_user_id
ON public.orders(user_id);
