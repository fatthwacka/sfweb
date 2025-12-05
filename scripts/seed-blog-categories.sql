-- Insert default blog categories if they don't exist
INSERT INTO blog_categories (name, slug, description, color, display_order) VALUES
('Wedding Stories', 'wedding-stories', 'Complete wedding day documentation and behind-the-scenes', '#ef4444', 1),
('Portrait Sessions', 'portrait-sessions', 'Individual and family portrait photography', '#8b5cf6', 2),
('Corporate Events', 'corporate-events', 'Business event photography and documentation', '#06b6d4', 3),
('Behind the Scenes', 'behind-the-scenes', 'Photography process, equipment, and techniques', '#10b981', 4),
('Photography Tips', 'photography-tips', 'Educational content and tutorials', '#f59e0b', 5),
('Case Studies', 'case-studies', 'Detailed project breakdowns and client stories', '#ec4899', 6),
('Client Features', 'client-features', 'Highlighting client work and testimonials', '#6366f1', 7),
('Venue Spotlights', 'venue-spotlights', 'Featured wedding and event venues', '#84cc16', 8)
ON CONFLICT (slug) DO NOTHING;