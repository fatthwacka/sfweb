-- SlyFox Studios - Comprehensive Supabase Data Seeding Script
-- This script populates all tables with realistic dummy data

-- First, clear existing data (except any real auth.users)
DELETE FROM analytics;
DELETE FROM favorites; 
DELETE FROM images;
DELETE FROM shoots;
DELETE FROM clients;
DELETE FROM bookings;
DELETE FROM packages;
DELETE FROM profiles;
DELETE FROM users;

-- 1. USERS TABLE (Legacy system - integers)
INSERT INTO users (id, email, password, role, profile_image, banner_image, theme_preference, created_at) VALUES
(1, 'dax@slyfox.co.za', 'slyfox2025', 'staff', NULL, NULL, 'dark', NOW()),
(2, 'eben@slyfox.co.za', 'slyfox2025', 'staff', NULL, NULL, 'dark', NOW()),
(3, 'demo@slyfox.co.za', 'slyfox2025', 'client', NULL, NULL, 'light', NOW()),
(4, 'client2@slyfox.co.za', 'slyfox2025', 'client', NULL, NULL, 'dark', NOW()),
(5, 'sarah.johnson@email.com', 'slyfox2025', 'client', NULL, NULL, 'light', NOW());

-- 2. PROFILES TABLE (Supabase auth extension - UUIDs)
-- Note: In real Supabase, these would be created when users sign up through auth
INSERT INTO profiles (id, email, full_name, role, profile_image_url, banner_image_url, theme_preference, created_at, updated_at) VALUES
(gen_random_uuid(), 'dax@slyfox.co.za', 'Dax Tucker', 'staff', NULL, NULL, 'dark', NOW(), NOW()),
(gen_random_uuid(), 'eben@slyfox.co.za', 'Eben Schoeman', 'staff', NULL, NULL, 'dark', NOW(), NOW()),
(gen_random_uuid(), 'demo@slyfox.co.za', 'Demo Client', 'client', NULL, NULL, 'light', NOW(), NOW()),
(gen_random_uuid(), 'sarah.johnson@email.com', 'Sarah Johnson', 'client', NULL, NULL, 'light', NOW(), NOW()),
(gen_random_uuid(), 'mike.wilson@email.com', 'Mike Wilson', 'client', NULL, NULL, 'dark', NOW(), NOW());

-- 3. PACKAGES TABLE (Service offerings)
INSERT INTO packages (id, name, description, price, features, category, is_active, display_order, created_at, updated_at) VALUES
(gen_random_uuid(), 'Essential Photography', 'Perfect for small events and intimate portraits. Ideal for couples, small families, or brief sessions.', 299.00, ARRAY['2 hours shooting', '50 edited photos', 'Online gallery access', 'High-resolution downloads', 'Basic retouching'], 'photography', true, 1, NOW(), NOW()),

(gen_random_uuid(), 'Premium Photography', 'Comprehensive coverage for special occasions like birthdays, anniversaries, or medium events.', 599.00, ARRAY['4 hours shooting', '150 edited photos', 'Online gallery access', 'High-resolution downloads', 'Advanced retouching', 'Print release included', 'USB drive delivery'], 'photography', true, 2, NOW(), NOW()),

(gen_random_uuid(), 'Luxury Wedding Package', 'Complete wedding day coverage with premium service and all extras included.', 1299.00, ARRAY['8 hours shooting', '500+ edited photos', 'Engagement session included', 'Online gallery access', 'High-resolution downloads', 'Premium retouching', 'Print release included', 'USB drive + cloud storage', 'Wedding album design', 'Bridal prep coverage'], 'photography', true, 3, NOW(), NOW()),

(gen_random_uuid(), 'Corporate Event Photography', 'Professional corporate event documentation and headshots.', 450.00, ARRAY['3 hours event coverage', '100+ edited photos', 'Same-day preview gallery', 'High-resolution downloads', 'Professional retouching', 'Corporate branding options'], 'photography', true, 4, NOW(), NOW()),

(gen_random_uuid(), 'Videography Essential', 'Professional video coverage for events and special occasions.', 800.00, ARRAY['3 hours filming', '5-10 minute highlight reel', 'Raw footage included', 'Professional editing', 'Music licensing', 'Multiple format delivery'], 'videography', true, 1, NOW(), NOW()),

(gen_random_uuid(), 'Videography Premium', 'Comprehensive video production with cinematic quality.', 1500.00, ARRAY['6 hours filming', '15-20 minute feature film', 'Raw footage included', 'Cinematic editing', 'Color grading', 'Music licensing', 'Drone footage (if permitted)', 'Multiple format delivery'], 'videography', true, 2, NOW(), NOW());

-- 4. CLIENTS TABLE (Customer information)
INSERT INTO clients (id, name, slug, email, user_id, created_by, created_at, updated_at) VALUES
(1, 'Sarah & Tom Johnson', 'sarah-tom-johnson', 'sarah.johnson@email.com', (SELECT id FROM profiles WHERE email = 'sarah.johnson@email.com' LIMIT 1), (SELECT id FROM profiles WHERE email = 'dax@slyfox.co.za' LIMIT 1), NOW(), NOW()),

(2, 'Wilson Family', 'wilson-family', 'mike.wilson@email.com', (SELECT id FROM profiles WHERE email = 'mike.wilson@email.com' LIMIT 1), (SELECT id FROM profiles WHERE email = 'eben@slyfox.co.za' LIMIT 1), NOW(), NOW()),

(3, 'Demo Gallery Client', 'demo-gallery', 'demo@slyfox.co.za', (SELECT id FROM profiles WHERE email = 'demo@slyfox.co.za' LIMIT 1), (SELECT id FROM profiles WHERE email = 'dax@slyfox.co.za' LIMIT 1), NOW(), NOW()),

(4, 'Durban Corporate', 'durban-corporate', 'events@durbancorp.co.za', NULL, (SELECT id FROM profiles WHERE email = 'eben@slyfox.co.za' LIMIT 1), NOW(), NOW()),

(5, 'Mountain View Wedding', 'mountain-view-wedding', 'info@mountainviewvenue.co.za', NULL, (SELECT id FROM profiles WHERE email = 'dax@slyfox.co.za' LIMIT 1), NOW(), NOW());

-- 5. SHOOTS TABLE (Photography/videography sessions)
INSERT INTO shoots (id, client_id, title, description, is_private, banner_image_id, seo_tags, view_count, created_by, created_at, updated_at) VALUES
(gen_random_uuid(), 1, 'Sarah & Tom - Engagement Session', 'Romantic engagement shoot at uShaka Beach beach during golden hour. Captured their natural chemistry and love story with Durban''s stunning coastline as backdrop.', false, NULL, ARRAY['engagement', 'couples', 'ushaka beach', 'beach', 'sunset', 'durban', 'romantic'], 45, (SELECT id FROM profiles WHERE email = 'dax@slyfox.co.za' LIMIT 1), NOW(), NOW()),

(gen_random_uuid(), 2, 'Wilson Family Portrait Session', 'Fun family portrait session in Durban Botanic Gardens Botanical Gardens. Three generations celebrating grandmother''s 80th birthday with natural, candid moments.', false, NULL, ARRAY['family', 'portraits', 'durban botanic gardens', 'generations', 'birthday', 'durban', 'natural'], 32, (SELECT id FROM profiles WHERE email = 'eben@slyfox.co.za' LIMIT 1), NOW(), NOW()),

(gen_random_uuid(), 3, 'Demo Portfolio Showcase', 'Curated collection showcasing SlyFox Studios'' diverse photography styles and technical expertise across various genres and lighting conditions.', false, NULL, ARRAY['portfolio', 'showcase', 'diverse', 'professional', 'studio work', 'outdoor'], 78, (SELECT id FROM profiles WHERE email = 'dax@slyfox.co.za' LIMIT 1), NOW(), NOW()),

(gen_random_uuid(), 4, 'Corporate Event - Annual Gala', 'Professional documentation of Durban Corporate''s annual gala dinner. Executive headshots, award presentations, and networking moments captured.', true, NULL, ARRAY['corporate', 'gala', 'professional', 'headshots', 'awards', 'networking'], 12, (SELECT id FROM profiles WHERE email = 'eben@slyfox.co.za' LIMIT 1), NOW(), NOW()),

(gen_random_uuid(), 5, 'Mountain View Wedding - Sarah & James', 'Intimate wedding ceremony overlooking uMhlanga Ridge. Captured ceremony, reception, and couple portraits with dramatic mountain backdrop.', false, NULL, ARRAY['wedding', 'mountain view', 'table mountain', 'ceremony', 'intimate', 'durban', 'couples'], 156, (SELECT id FROM profiles WHERE email = 'dax@slyfox.co.za' LIMIT 1), NOW(), NOW());

-- 6. IMAGES TABLE (Individual photos)
-- We'll create realistic image entries using Unsplash for demonstration
WITH shoot_data AS (
  SELECT id as shoot_id, title, created_by FROM shoots
),
image_series AS (
  -- Engagement Session Images
  SELECT s.shoot_id, s.created_by, 'engagement-beach-sunset-01.jpg' as filename, 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&h=1200&fit=crop&crop=faces' as storage_path, 1 as upload_order, 'Romantic sunset moment on uShaka Beach beach' as alt_text
  FROM shoot_data s WHERE s.title LIKE '%Engagement%'
  
  UNION ALL
  SELECT s.shoot_id, s.created_by, 'engagement-beach-sunset-02.jpg', 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&h=1200&fit=crop&crop=faces', 2, 'Couple walking along the shoreline'
  FROM shoot_data s WHERE s.title LIKE '%Engagement%'
  
  UNION ALL
  SELECT s.shoot_id, s.created_by, 'engagement-beach-sunset-03.jpg', 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&h=1200&fit=crop&crop=faces', 3, 'Intimate embrace with mountain backdrop'
  FROM shoot_data s WHERE s.title LIKE '%Engagement%'
  
  UNION ALL
  SELECT s.shoot_id, s.created_by, 'engagement-beach-sunset-04.jpg', 'https://images.unsplash.com/photo-1545291730-faff8ca1d4b0?w=800&h=1200&fit=crop&crop=faces', 4, 'Candid laughter moment during golden hour'
  FROM shoot_data s WHERE s.title LIKE '%Engagement%'
  
  UNION ALL
  -- Family Portrait Images
  SELECT s.shoot_id, s.created_by, 'family-durban botanic gardens-01.jpg', 'https://images.unsplash.com/photo-1511895426328-dc8714efa2d8?w=800&h=600&fit=crop', 1, 'Three generations family group portrait'
  FROM shoot_data s WHERE s.title LIKE '%Wilson Family%'
  
  UNION ALL
  SELECT s.shoot_id, s.created_by, 'family-durban botanic gardens-02.jpg', 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=800&h=600&fit=crop', 2, 'Grandchildren with grandmother'
  FROM shoot_data s WHERE s.title LIKE '%Wilson Family%'
  
  UNION ALL
  SELECT s.shoot_id, s.created_by, 'family-durban botanic gardens-03.jpg', 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=600&fit=crop', 3, 'Natural candid family interaction'
  FROM shoot_data s WHERE s.title LIKE '%Wilson Family%'
  
  UNION ALL
  -- Portfolio Showcase Images
  SELECT s.shoot_id, s.created_by, 'portfolio-portrait-studio-01.jpg', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop&crop=face', 1, 'Professional studio portrait with dramatic lighting'
  FROM shoot_data s WHERE s.title LIKE '%Demo Portfolio%'
  
  UNION ALL
  SELECT s.shoot_id, s.created_by, 'portfolio-landscape-durban-01.jpg', 'https://images.unsplash.com/photo-1580692270804-1404f9846f96?w=1200&h=800&fit=crop', 2, 'Durban cityscape from uMhlanga Ridge'
  FROM shoot_data s WHERE s.title LIKE '%Demo Portfolio%'
  
  UNION ALL
  SELECT s.shoot_id, s.created_by, 'portfolio-wedding-detail-01.jpg', 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=800&h=800&fit=crop', 3, 'Wedding ring macro detail shot'
  FROM shoot_data s WHERE s.title LIKE '%Demo Portfolio%'
  
  UNION ALL
  -- Corporate Event Images  
  SELECT s.shoot_id, s.created_by, 'corporate-gala-presentation-01.jpg', 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&h=800&fit=crop', 1, 'Executive giving presentation at annual gala'
  FROM shoot_data s WHERE s.title LIKE '%Corporate Event%'
  
  UNION ALL
  SELECT s.shoot_id, s.created_by, 'corporate-gala-networking-01.jpg', 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=1200&h=800&fit=crop', 2, 'Professional networking at corporate event'
  FROM shoot_data s WHERE s.title LIKE '%Corporate Event%'
  
  UNION ALL
  -- Wedding Images
  SELECT s.shoot_id, s.created_by, 'wedding-ceremony-mountain-view-01.jpg', 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&h=800&fit=crop', 1, 'Wedding ceremony with uMhlanga Ridge backdrop'
  FROM shoot_data s WHERE s.title LIKE '%Mountain View Wedding%'
  
  UNION ALL
  SELECT s.shoot_id, s.created_by, 'wedding-couple-portraits-01.jpg', 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800&h=1200&fit=crop&crop=faces', 2, 'Bride and groom portrait session'
  FROM shoot_data s WHERE s.title LIKE '%Mountain View Wedding%'
)
INSERT INTO images (id, shoot_id, filename, storage_path, original_name, file_size, is_private, upload_order, download_count, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  shoot_id,
  filename,
  storage_path,
  filename,
  FLOOR(RANDOM() * 5000000 + 1000000)::INTEGER, -- Random file size between 1-5MB
  false,
  upload_order,
  FLOOR(RANDOM() * 50)::INTEGER, -- Random download count
  NOW(),
  NOW()
FROM image_series;

-- 7. BOOKINGS TABLE (Customer inquiries)
INSERT INTO bookings (id, email, phone, message, service_type, preferred_date, budget_range, status, inquiry_data, client_id, package_id, created_at) VALUES
(1, 'newclient@example.com', '+27 82 123 4567', 'Hi! We''re getting married in March 2025 and would love to discuss wedding photography packages. We''re particularly interested in the luxury package.', 'wedding', '2025-03-15'::timestamp, '10000-15000', 'pending', '{"venue": "Babylonstoren", "guest_count": 80, "style_preference": "natural_candid"}', NULL, NULL, NOW() - INTERVAL '2 days'),

(2, 'corporate@techstartup.co.za', '+27 21 456 7890', 'We need professional headshots for our team of 25 people. Can you provide a quote for on-site corporate photography?', 'corporate', '2025-02-20'::timestamp, '5000-8000', 'contacted', '{"company": "Tech Startup Durban", "employee_count": 25, "location": "office"}', NULL, NULL, NOW() - INTERVAL '5 days'),

(3, 'family.portraits@gmail.com', '+27 83 987 6543', 'Looking for a family portrait session for our family of 5. We have young children so would prefer an outdoor session with a relaxed atmosphere.', 'family', '2025-01-30'::timestamp, '2000-3000', 'quoted', '{"family_size": 5, "children_ages": [3, 7, 12], "location_preference": "outdoor"}', NULL, NULL, NOW() - INTERVAL '1 week'),

(4, 'events@luxuryhotel.co.za', '+27 21 789 0123', 'We host monthly events at our hotel and are looking for a reliable photographer for ongoing coverage. Please contact us to discuss a retainer arrangement.', 'events', NULL, '15000+', 'in_progress', '{"venue": "Luxury Hotel V&A Waterfront", "frequency": "monthly", "event_type": "corporate_hospitality"}', NULL, NULL, NOW() - INTERVAL '3 days');

-- 8. ANALYTICS TABLE (Usage tracking)
WITH random_analytics AS (
  SELECT 
    gen_random_uuid() as id,
    p.id as user_id,
    s.id as shoot_id,
    i.id as image_id,
    CASE 
      WHEN RANDOM() < 0.3 THEN 'view_image'
      WHEN RANDOM() < 0.6 THEN 'download_image'  
      WHEN RANDOM() < 0.8 THEN 'view_gallery'
      ELSE 'share_gallery'
    END as action_type,
    ('192.168.' || FLOOR(RANDOM() * 255) || '.' || FLOOR(RANDOM() * 255))::inet as ip_address,
    CASE 
      WHEN RANDOM() < 0.4 THEN 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
      WHEN RANDOM() < 0.7 THEN 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      ELSE 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    END as user_agent,
    NOW() - (RANDOM() * INTERVAL '30 days') as created_at
  FROM profiles p
  CROSS JOIN shoots s
  CROSS JOIN images i
  WHERE p.role = 'client'
  AND RANDOM() < 0.1 -- Only create 10% of possible combinations to keep data realistic
  LIMIT 50
)
INSERT INTO analytics (id, user_id, shoot_id, image_id, action_type, ip_address, user_agent, created_at)
SELECT id, user_id, shoot_id, image_id, action_type, ip_address, user_agent, created_at
FROM random_analytics;

-- 9. FAVORITES TABLE (User favorites)
WITH client_favorites AS (
  SELECT 
    p.id as user_id,
    i.id as image_id
  FROM profiles p
  CROSS JOIN images i
  WHERE p.role = 'client'
  AND RANDOM() < 0.15 -- 15% chance each client favorites each image
  LIMIT 20
)
INSERT INTO favorites (id, user_id, image_id, created_at)
SELECT 
  gen_random_uuid(),
  user_id,
  image_id,
  NOW() - (RANDOM() * INTERVAL '15 days')
FROM client_favorites;

-- Update shoot banner images to reference actual image IDs
UPDATE shoots 
SET banner_image_id = (
  SELECT i.id 
  FROM images i 
  WHERE i.shoot_id = shoots.id 
  ORDER BY i.upload_order 
  LIMIT 1
);

-- Final verification query
SELECT 
  'SEEDING COMPLETE' as status,
  (SELECT COUNT(*) FROM users) as users_count,
  (SELECT COUNT(*) FROM profiles) as profiles_count,
  (SELECT COUNT(*) FROM clients) as clients_count,
  (SELECT COUNT(*) FROM shoots) as shoots_count,
  (SELECT COUNT(*) FROM images) as images_count,
  (SELECT COUNT(*) FROM packages) as packages_count,
  (SELECT COUNT(*) FROM bookings) as bookings_count,
  (SELECT COUNT(*) FROM analytics) as analytics_count,
  (SELECT COUNT(*) FROM favorites) as favorites_count;