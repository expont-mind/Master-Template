-- ============================================================================
-- Defense-in-depth: ensure public.users row exists before any orders insert
--
-- Background: handle_new_user() can fail to create the matching public.users
-- row in rare edge cases (silent error during signup, social-login race),
-- leaving auth.users without a public.users counterpart. The next time that
-- user places an order, orders.user_id -> public.users(id) FK fails with
-- "Validation failed: User must exist".
--
-- Web's checkout calls ensurePublicUser() before each orders insert
-- (frontend/src/components/checkout/actions.ts, 5 sites). Mobile and other
-- direct clients skip that safety net, so the FK still occasionally fires —
-- exactly the StorePay failure reported on 2026-04-30.
--
-- This BEFORE INSERT trigger calls ensure_public_user(NEW.user_id) on every
-- orders row, making the safety net universal regardless of which client
-- (web, mobile, admin, edge function) creates the order.
--
-- Performance: ensure_public_user() short-circuits with a single existence
-- check when the public.users row already exists (the normal case).
--
-- Failure containment: ensure_public_user() can fail for reasons unrelated
-- to the order itself (privilege issues, email uniqueness conflict, missing
-- auth.users row for admin-created orders). The trap below makes the safety
-- net best-effort: if it fails, log a WARNING and let the order INSERT
-- proceed. The pre-existing FK orders.user_id -> public.users(id) still
-- protects the data; this just stops the trigger from blocking *every*
-- order when the safety net itself errors out.
-- ============================================================================

CREATE OR REPLACE FUNCTION ensure_public_user_for_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    BEGIN
      PERFORM ensure_public_user(NEW.user_id);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING
        'ensure_public_user_for_order: ensure_public_user failed for user_id=%: % (SQLSTATE=%)',
        NEW.user_id, SQLERRM, SQLSTATE;
    END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_public_user_before_order_insert ON orders;

CREATE TRIGGER ensure_public_user_before_order_insert
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION ensure_public_user_for_order();
