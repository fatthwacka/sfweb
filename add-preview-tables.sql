-- Add preview selection system tables
-- This script only creates the new tables without modifying existing ones

-- 1. Shoot Preview Settings table
CREATE TABLE IF NOT EXISTS shoot_previews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shoot_id UUID NOT NULL REFERENCES shoots(id) ON DELETE CASCADE,
    dropbox_folder_path TEXT,
    dropbox_share_link TEXT,
    selection_limit INTEGER NOT NULL DEFAULT 20,
    additional_bundle5_price NUMERIC(10, 2) NOT NULL DEFAULT 150.00,
    additional_bundle10_price NUMERIC(10, 2) NOT NULL DEFAULT 250.00,
    unlimited_bundle_price NUMERIC(10, 2) NOT NULL DEFAULT 500.00,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_shoot_preview UNIQUE (shoot_id)
);

-- 2. Client Selections table
CREATE TABLE IF NOT EXISTS client_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shoot_id UUID NOT NULL REFERENCES shoots(id) ON DELETE CASCADE,
    client_id TEXT NOT NULL,
    image_filename TEXT NOT NULL,
    is_selected BOOLEAN NOT NULL DEFAULT TRUE,
    selection_type TEXT NOT NULL DEFAULT 'favorite',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_client_image_selection UNIQUE (shoot_id, client_id, image_filename)
);

-- 3. Selection Packages table (for upgrade bundles)
CREATE TABLE IF NOT EXISTS selection_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    additional_images INTEGER NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Insert default selection packages
INSERT INTO selection_packages (name, description, additional_images, price) VALUES
('5 Additional Images', 'Add 5 more images to your selection', 5, 150.00),
('10 Additional Images', 'Add 10 more images to your selection', 10, 250.00),
('Unlimited Selection', 'Select as many images as you want', -1, 500.00)
ON CONFLICT DO NOTHING;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shoot_previews_shoot_id ON shoot_previews(shoot_id);
CREATE INDEX IF NOT EXISTS idx_client_selections_shoot_id ON client_selections(shoot_id);
CREATE INDEX IF NOT EXISTS idx_client_selections_client_id ON client_selections(client_id);
CREATE INDEX IF NOT EXISTS idx_selection_packages_active ON selection_packages(is_active) WHERE is_active = TRUE;