-- Create print_queue table for managing physical contract printing and shipping
CREATE TABLE IF NOT EXISTS print_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'printed', 'shipped')),
    printed_at TIMESTAMPTZ,
    shipped_at TIMESTAMPTZ,
    tracking_number TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_print_queue_order_id ON print_queue(order_id);
CREATE INDEX IF NOT EXISTS idx_print_queue_status ON print_queue(status);
CREATE INDEX IF NOT EXISTS idx_print_queue_created_at ON print_queue(created_at DESC);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_print_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER print_queue_updated_at
    BEFORE UPDATE ON print_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_print_queue_updated_at();

-- Add comment for documentation
COMMENT ON TABLE print_queue IS 'Queue for managing physical contract printing and postal delivery';
COMMENT ON COLUMN print_queue.status IS 'Status: pending (awaiting print), printed (ready to ship), shipped (delivered to postal service)';
