-- Fix: point_transactions.user_id references auth.users instead of public.users
-- This prevents PostgREST from resolving the join with public.users table
-- (all other tables correctly reference public.users)

-- Drop the existing FK to auth.users
ALTER TABLE point_transactions
    DROP CONSTRAINT IF EXISTS point_transactions_user_id_fkey;

-- Add FK to public.users instead
ALTER TABLE point_transactions
    ADD CONSTRAINT point_transactions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id);
