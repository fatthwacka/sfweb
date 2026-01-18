import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package } from 'lucide-react';
import BrandProfileEditor from './BrandProfileEditor';
import BrandAssetsEditor from './BrandAssetsEditor';

interface BrandProfile {
  id: string;
  version: number;
  brand_description: string;
  industry_segment: string;
  products_services: string;
  voice_tone: {
    creative: boolean;
    technical: boolean;
    approachable: boolean;
    professional: boolean;
    friendly: boolean;
    authoritative: boolean;
    casual: boolean;
    formal: boolean;
    playful: boolean;
    serious: boolean;
    innovative: boolean;
    traditional: boolean;
  };
  voice_rules: {
    tone: string;
    humor: string;
    sentence_length?: string;
    sentence_structure?: string;
    emojis?: string;
    profanity?: string;
  };
  visual_rules: {
    style: string;
    primary_color: string;
  };
  key_messages: string[];
  key_benefits_features: string[];
  forbidden_phrases: string[];
  preferred_terminology: Record<string, string>;
  primary_color: string;
  secondary_colors: string[];
  logo_url: string | null;
  visual_style_notes: string | null;
  content_themes: string[];
  target_audience_description: string;
  content_length_preferences: Record<string, any>;
  top_performing_content_types: string[];
  successful_hooks: string[];
  content_to_avoid: string[];
  approved_examples: string[];
  negative_examples: string[];
  platform_rules: Record<string, any>;
  notes: string | null;
}

interface ContentClient {
  id: string;
  name: string;
  slug: string;
  email?: string;
  website_url?: string;
  industry?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  client_brand_profiles?: BrandProfile[];
}

interface BrandIntelligencePanelProps {
  client: ContentClient;
}

export default function BrandIntelligencePanel({ client }: BrandIntelligencePanelProps) {
  const [showBrandEditor, setShowBrandEditor] = useState(false);
  const [showAssetsEditor, setShowAssetsEditor] = useState(false);

  // Fetch brand assets count for display
  const { data: assetsData } = useQuery({
    queryKey: ['brand-assets', client.id],
    queryFn: async () => {
      const response = await fetch(`/api/content-management/brand-intelligence/clients/${client.id}/assets`);
      if (!response.ok) return { assets: [] };
      return response.json();
    },
  });

  const assetsCount = assetsData?.assets?.length || 0;

  // Get the active brand profile
  const brandProfile = client.client_brand_profiles?.[0];
  
  // Generate voice description from actual data
  const voiceDescription = brandProfile ? 
    `${brandProfile.industry_segment || client.industry || 'Unspecified industry'} • ${brandProfile.voice_rules.tone} voice, ${(brandProfile.voice_rules as any).sentence_structure || brandProfile.voice_rules.sentence_length || 'medium'} sentences` :
    'No brand profile configured';

  // Generate themes summary
  const themesDescription = brandProfile?.content_themes?.length ? 
    `Focuses on: ${brandProfile.content_themes.join(', ')}` :
    'No content themes set';

  return (
    <div className="space-y-3 p-4 bg-gray-700 border border-gray-600 rounded-lg">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-salmon mb-2">Brand Intelligence</h2>
        <p className="text-sm text-gray-400">AI-powered brand understanding and content customization</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Brand Profile Analysis */}
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-600 flex flex-col h-full">
          <div className="text-center mb-3 flex-grow">
            <div className="text-2xl mb-2">🎯</div>
            <h3 className="text-lg font-semibold text-cyan mb-1">Brand Profile</h3>
            <p className="text-xs text-gray-400">{voiceDescription}</p>
          </div>
          <button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm mt-auto"
            onClick={() => setShowBrandEditor(true)}
          >
            {brandProfile ? 'Edit Profile' : 'Create Profile'}
          </button>
        </div>

        {/* Brand Assets */}
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-600 flex flex-col h-full">
          <div className="text-center mb-3 flex-grow">
            <div className="text-2xl mb-2">
              <Package className="h-6 w-6 mx-auto text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-cyan mb-1">Brand Assets</h3>
            <p className="text-xs text-gray-400">
              {assetsCount === 0
                ? 'No assets uploaded yet'
                : `${assetsCount} asset${assetsCount === 1 ? '' : 's'} for AI generation`}
            </p>
          </div>
          <button
            className="w-full bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded text-sm mt-auto"
            onClick={() => setShowAssetsEditor(true)}
          >
            {assetsCount === 0 ? 'Add Assets' : 'Manage Assets'}
          </button>
        </div>

        {/* Brand Insights */}
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-600 flex flex-col h-full">
          <div className="text-center mb-3 flex-grow">
            <div className="text-2xl mb-2">🧠</div>
            <h3 className="text-lg font-semibold text-cyan mb-1">AI Insights</h3>
            <p className="text-xs text-gray-400">Brand analysis and content optimization recommendations</p>
          </div>
          <button className="w-full bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm border border-gray-600 mt-auto">
            Generate Insights
          </button>
        </div>
      </div>

      {/* Brand Assets Editor Modal */}
      <BrandAssetsEditor
        clientId={client.id}
        isOpen={showAssetsEditor}
        onClose={() => setShowAssetsEditor(false)}
      />

      {/* Brand Profile Editor Modal */}
      {showBrandEditor && (
        <BrandProfileEditor
          clientId={client.id}
          brandProfile={brandProfile || {
            id: '',
            version: 1,
            brand_description: 'Premium luxury photography studio specializing in weddings and corporate branding',
            industry_segment: 'Luxury Photography & Creative Services',
            products_services: 'Premium wedding photography, executive portraits, luxury brand campaigns, commercial videography, creative direction services',
            // NEW: Enhanced AI fields with comprehensive test data
            business_niche: 'luxury wedding and high-end corporate photography with artistic flair',
            color_personality: 'sophisticated, warm, and timelessly elegant',
            visual_mood: 'romantic elegance meets contemporary luxury with emotional depth',
            target_audience: 'discerning couples planning luxury weddings, C-suite executives, premium brands',
            priority_benefits: [
              'exceptional artistic quality and attention to detail',
              'personalized creative storytelling approach',
              'proven track record with luxury clientele',
              'comprehensive service from concept to delivery'
            ],
            secondary_benefits: [
              'flexible scheduling for busy executives',
              'discreet and professional service',
              'premium album and print options',
              'ongoing brand relationship development'
            ],
            positive_examples: [
              'intimate emotional wedding moments captured naturally',
              'sophisticated executive portraits with personality',
              'luxury brand campaigns with authentic storytelling',
              'behind-the-scenes content that builds trust and connection'
            ],
            negative_examples: [
              'generic stock photo approaches without personality',
              'overly aggressive sales tactics and pushy upselling',
              'technical equipment focus over artistic vision',
              'one-size-fits-all packages without customization'
            ],
            prohibited_terms: [
              'cheap',
              'basic',
              'amateur', 
              'low-budget'
            ],
            // NEW: Content Guidelines fields
            language: 'english',
            region: 'sa',
            spelling: 'british',
            voice_tone: {
              creative: true,
              technical: false,
              approachable: true,
              professional: true,
              friendly: true,
              authoritative: true,
              casual: false,
              formal: true,
              playful: false,
              serious: false,
              innovative: true,
              traditional: false
            },
            voice_rules: {
              tone: 'sophisticated yet approachable with warmth',
              humor: 'minimal',
              sentence_length: 'medium'
            },
            visual_rules: {
              style: 'luxury minimalist with elegant typography and refined colour palette',
              primary_color: '#8B5CF6'
            },
            key_messages: [
              'Where artistry meets luxury in visual storytelling excellence',
              'Creating timeless images that capture the essence of your most important moments',
              'Bespoke photography experiences tailored to discerning clients',
              'Excellence in every frame, from intimate moments to corporate milestones'
            ],
            key_benefits_features: [
              'award-winning artistic vision and technical expertise',
              'personalised consultation and creative planning process',
              'premium equipment and cutting-edge editing techniques',
              'comprehensive service including styling and location guidance'
            ],
            forbidden_phrases: [
              'cheap photography packages',
              'basic wedding coverage',
              'amateur photographer rates',
              'budget-friendly options'
            ],
            preferred_terminology: {
              'photoshoot': 'photography session',
              'pics': 'images',
              'snaps': 'photographs',
              'cheap': 'accessible',
              'expensive': 'investment'
            },
            primary_color: '#8B5CF6',
            secondary_colors: ['#ffffff', '#1a1a1a', '#f8f9fa', '#e9ecef', '#6f42c1'],
            logo_url: null,
            visual_style_notes: 'Sophisticated minimalist aesthetic with warm undertones and elegant typography. Focus on luxury, refinement, and emotional connection through visual hierarchy.',
            content_themes: [
              'luxury wedding planning inspiration',
              'executive branding and corporate identity',
              'behind-the-scenes creative process',
              'client success stories and testimonials'
            ],
            target_audience_description: 'Affluent couples planning luxury weddings who value artistic excellence and personalised service, C-suite executives seeking distinguished corporate portraits, premium brands requiring sophisticated visual storytelling',
            content_length_preferences: {
              'social_media': 'concise yet evocative',
              'blog_posts': 'comprehensive and inspiring',
              'captions': 'emotionally resonant with clear call-to-action',
              'email_campaigns': 'personal and relationship-focused'
            },
            top_performing_content_types: [
              'intimate behind-the-scenes creative process videos',
              'heartfelt client testimonials and success stories',
              'before-and-after luxury wedding transformations',
              'educational content about photography techniques'
            ],
            successful_hooks: [
              'Your love story deserves to be told with artistic excellence...',
              'Transform your brand presence with distinguished corporate imagery...',
              'Every precious moment captured with luxury and care...',
              'Where timeless elegance meets contemporary artistry...'
            ],
            content_to_avoid: [
              'overly promotional language without substance',
              'complex technical photography jargon',
              'price-focused messaging over value proposition',
              'generic industry clichés and stock phrases'
            ],
            approved_examples: [
              'Authentic emotional storytelling that resonates with luxury clientele',
              'Sophisticated client testimonials highlighting experience and results',
              'Educational content that demonstrates expertise without overwhelming',
              'Behind-the-scenes glimpses that build trust and personal connection'
            ],
            negative_examples: [
              'Generic stock photography approaches without personality or uniqueness',
              'Aggressive sales language that pressures rather than inspires',
              'Technical equipment focus that overshadows artistic vision',
              'One-size-fits-all marketing that ignores client individuality'
            ],
            platform_rules: {
              'instagram': 'visual storytelling with minimal yet impactful copy',
              'facebook': 'community building through authentic engagement',
              'linkedin': 'professional authority with business value focus',
              'website': 'comprehensive luxury experience with emotional resonance'
            },
            notes: 'Maintain focus on emotional connection and artistic excellence. Emphasise the unique, personalised story each client brings while positioning as the premium choice for discerning individuals who value quality and creative vision.'
          }}
          isOpen={showBrandEditor}
          onClose={() => setShowBrandEditor(false)}
        />
      )}
    </div>
  );
}