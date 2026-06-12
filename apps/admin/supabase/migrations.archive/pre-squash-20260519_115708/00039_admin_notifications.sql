-- ============================================================================
-- Admin Notifications with Real-time Order Alerts
-- ============================================================================

-- Admin Notifications Table
CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL DEFAULT 'order',
    title VARCHAR(255) NOT NULL,
    body TEXT,
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_admin_notifications_created ON admin_notifications(created_at DESC);
CREATE INDEX idx_admin_notifications_is_read ON admin_notifications(is_read) WHERE is_read = FALSE;
CREATE INDEX idx_admin_notifications_type ON admin_notifications(type);

-- Enable RLS
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users (admins) to read
CREATE POLICY "Admins can read admin_notifications" ON admin_notifications
    FOR SELECT TO authenticated USING (true);

-- Allow authenticated users (admins) to update (mark as read)
CREATE POLICY "Admins can update admin_notifications" ON admin_notifications
    FOR UPDATE TO authenticated USING (true);

-- Trigger function to create admin notification on new order
CREATE OR REPLACE FUNCTION create_admin_order_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_user_name TEXT;
    v_user_phone TEXT;
BEGIN
    -- Get user info
    SELECT
        COALESCE(NULLIF(TRIM(CONCAT(first_name, ' ', last_name)), ''), email),
        COALESCE(primary_phone, '')
    INTO v_user_name, v_user_phone
    FROM users
    WHERE id = NEW.user_id;

    -- Create admin notification
    INSERT INTO admin_notifications (type, title, body, metadata)
    VALUES (
        'order',
        'Шинэ захиалга ирлээ',
        format('Захиалга #%s - %s (%s₮)',
            COALESCE(NEW.order_number, LEFT(NEW.id::text, 8)),
            COALESCE(v_user_name, 'Хэрэглэгч'),
            NEW.total_amount::text
        ),
        jsonb_build_object(
            'order_id', NEW.id,
            'order_number', NEW.order_number,
            'user_id', NEW.user_id,
            'user_name', v_user_name,
            'user_phone', v_user_phone,
            'total_amount', NEW.total_amount,
            'status', NEW.status,
            'payment_status', NEW.payment_status
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on orders table
DROP TRIGGER IF EXISTS trigger_admin_order_notification ON orders;
CREATE TRIGGER trigger_admin_order_notification
    AFTER INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION create_admin_order_notification();

-- Enable Realtime for admin_notifications
ALTER PUBLICATION supabase_realtime ADD TABLE admin_notifications;

-- Grant permissions
GRANT SELECT, UPDATE ON admin_notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON admin_notifications TO service_role;
