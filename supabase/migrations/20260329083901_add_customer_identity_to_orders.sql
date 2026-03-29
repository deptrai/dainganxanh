ALTER TABLE orders ADD COLUMN IF NOT EXISTS dob date;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS nationality text DEFAULT 'Việt Nam';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS id_number text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS id_issue_date date;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS id_issue_place text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS phone text;
