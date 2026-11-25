-- Enable Row Level Security on email_logs and print_queue
-- These tables are only accessed via service_role client on server

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.print_queue ENABLE ROW LEVEL SECURITY;
