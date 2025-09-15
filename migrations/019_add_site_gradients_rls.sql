-- ADD RLS FOR SITE_GRADIENTS TABLE
-- Secure gradient configuration storage

-- =====================================================
-- ENABLE RLS FOR SITE_GRADIENTS
-- =====================================================

ALTER TABLE site_gradients ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SITE_GRADIENTS POLICIES
-- =====================================================

-- Allow everyone to read gradient configurations (needed for public pages)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'site_gradients' AND policyname = 'site_gradients_read_policy') THEN
        CREATE POLICY "site_gradients_read_policy" ON site_gradients
          FOR SELECT USING (true);
    END IF;

    -- Only admin/staff can modify gradient configurations
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'site_gradients' AND policyname = 'site_gradients_write_policy') THEN
        CREATE POLICY "site_gradients_write_policy" ON site_gradients
          FOR ALL USING (is_admin_or_staff());
    END IF;
END $$;

SELECT 'Site gradients RLS policies created successfully!' as status;