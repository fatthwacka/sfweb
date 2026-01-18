-- Client Brand Assets Table
-- Stores uploaded brand assets (products, logos, materials, style references) for AI content generation
-- Linked to content_clients via client_id for brand-aware image generation

CREATE TABLE IF NOT EXISTS client_brand_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES content_clients(id) ON DELETE CASCADE,

  -- Basic asset info
  name TEXT NOT NULL,
  description TEXT,
  asset_type TEXT NOT NULL DEFAULT 'product', -- 'product', 'logo', 'material', 'style_reference', 'background', 'texture'

  -- Image storage
  image_url TEXT NOT NULL,
  thumbnail_url TEXT, -- Smaller version for quick loading in pickers

  -- Auto-detected metadata
  width INTEGER,
  height INTEGER,
  file_size_bytes INTEGER,
  mime_type TEXT,
  dominant_colours JSONB, -- Array of hex colours extracted from image

  -- AI context fields (user-provided)
  material TEXT, -- 'glass', 'metal', 'fabric', 'wood', 'plastic', 'ceramic', etc.
  similar_to TEXT, -- 'perfume bottle', 'skincare jar', 'wine glass', etc.
  usage_notes TEXT, -- 'Use as hero product', 'Background element only', etc.

  -- Placement guidance for AI
  placement_guidance TEXT, -- 'centre frame', 'left third', 'background', 'foreground'
  scale_preference TEXT DEFAULT 'prominent', -- 'prominent', 'subtle', 'fill-frame', 'background'

  -- Composition hints
  preferred_angle TEXT, -- 'front', 'side', '45-degree', 'overhead', 'any'
  lighting_notes TEXT, -- 'works well with dramatic lighting', 'needs soft diffused light'

  -- Tags for filtering/search
  tags TEXT[],

  -- Status and ordering
  is_active BOOLEAN DEFAULT true NOT NULL,
  sort_order INTEGER DEFAULT 0,

  -- Audit fields
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast client asset lookups
CREATE INDEX idx_client_brand_assets_client
ON client_brand_assets (client_id, is_active, sort_order);

-- Index for asset type filtering
CREATE INDEX idx_client_brand_assets_type
ON client_brand_assets (client_id, asset_type, is_active);

-- Enable RLS
ALTER TABLE client_brand_assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow authenticated users to read all assets
CREATE POLICY "Allow authenticated read" ON client_brand_assets
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to insert/update/delete their own assets
CREATE POLICY "Allow authenticated write" ON client_brand_assets
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Comments for documentation
COMMENT ON TABLE client_brand_assets IS 'Brand assets (products, logos, materials) for AI-powered content generation. Linked to content_clients.';
COMMENT ON COLUMN client_brand_assets.asset_type IS 'Type: product, logo, material, style_reference, background, texture';
COMMENT ON COLUMN client_brand_assets.material IS 'Physical material of the asset for AI context: glass, metal, fabric, etc.';
COMMENT ON COLUMN client_brand_assets.similar_to IS 'Describes what the asset looks like for AI context: perfume bottle, skincare jar, etc.';
COMMENT ON COLUMN client_brand_assets.placement_guidance IS 'Where the asset should appear in generated images: centre frame, left third, etc.';
COMMENT ON COLUMN client_brand_assets.scale_preference IS 'How prominent the asset should be: prominent, subtle, fill-frame, background';
