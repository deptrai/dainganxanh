-- TEMPORARY FIX: Disable auto profile creation
-- Run this if you just want to test OTP flow without creating profiles

-- Disable the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Users will be created in auth.users but NOT in public.users
-- You can manually create profiles later

-- To re-enable later, run:
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION handle_new_user();
