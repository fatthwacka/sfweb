/**
 * Quote Generator Configuration
 *
 * Services organised by category with color-coded theming
 */

// ============================================================================
// LOCATION ZONES
// ============================================================================

export interface LocationZone {
  id: string;
  name: string;
  description?: string;
  weekdayTravelTier: 'none' | 'low' | 'medium' | 'high' | 'very-high' | 'custom';
  weekendTravelTier: 'none' | 'low' | 'medium' | 'high' | 'very-high' | 'custom';
  requiresDetails?: boolean;
}

export const LOCATION_ZONES: LocationZone[] = [
  { id: 'studio', name: 'Slyfox Studios', description: 'La Lucia', weekdayTravelTier: 'none', weekendTravelTier: 'none' },
  { id: 'umhlanga', name: 'Umhlanga / La Lucia', weekdayTravelTier: 'low', weekendTravelTier: 'medium' },
  { id: 'durban-north', name: 'Durban North', weekdayTravelTier: 'low', weekendTravelTier: 'medium' },
  { id: 'durban-central', name: 'Durban Central / Berea', weekdayTravelTier: 'medium', weekendTravelTier: 'low' },
  { id: 'durban-south', name: 'Durban South / Glenwood', weekdayTravelTier: 'high', weekendTravelTier: 'low' },
  { id: 'westville', name: 'Westville / Hillcrest', weekdayTravelTier: 'medium', weekendTravelTier: 'medium' },
  { id: 'ballito', name: 'Ballito / North Coast', weekdayTravelTier: 'high', weekendTravelTier: 'high' },
  { id: 'pmb-midlands', name: 'PMB / Midlands', weekdayTravelTier: 'very-high', weekendTravelTier: 'very-high' },
  { id: 'other', name: 'Other Location', weekdayTravelTier: 'custom', weekendTravelTier: 'custom', requiresDetails: true },
];

export const TRAVEL_COSTS: Record<string, number> = {
  'none': 0, 'low': 150, 'medium': 300, 'high': 500, 'very-high': 800, 'custom': 0,
};

// ============================================================================
// SERVICE CATEGORIES WITH COLOR THEMES
// ============================================================================

export type ServiceSection =
  | 'portraits'
  | 'weddings'
  | 'products'
  | 'corporate'
  | 'events'
  | 'graduation'
  | 'social';

export interface SectionTheme {
  id: ServiceSection;
  label: string;
  iconColor: string;      // Tailwind color class
  borderColor: string;    // Border color when selected
  bgGradient: string;     // Background gradient
  bgSelected: string;     // Background when selected
}

export const SECTION_THEMES: Record<ServiceSection, SectionTheme> = {
  portraits: {
    id: 'portraits',
    label: 'Portraits',
    iconColor: 'text-rose-400',
    borderColor: 'border-rose-500/30',
    bgGradient: 'from-rose-500/5 to-transparent',
    bgSelected: 'bg-rose-500/10',
  },
  weddings: {
    id: 'weddings',
    label: 'Weddings',
    iconColor: 'text-red-400',
    borderColor: 'border-red-500/30',
    bgGradient: 'from-red-500/5 to-transparent',
    bgSelected: 'bg-red-500/10',
  },
  products: {
    id: 'products',
    label: 'Products & Brands',
    iconColor: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    bgGradient: 'from-amber-500/5 to-transparent',
    bgSelected: 'bg-amber-500/10',
  },
  corporate: {
    id: 'corporate',
    label: 'Corporate',
    iconColor: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    bgGradient: 'from-blue-500/5 to-transparent',
    bgSelected: 'bg-blue-500/10',
  },
  events: {
    id: 'events',
    label: 'Events',
    iconColor: 'text-purple-400',
    borderColor: 'border-purple-500/30',
    bgGradient: 'from-purple-500/5 to-transparent',
    bgSelected: 'bg-purple-500/10',
  },
  graduation: {
    id: 'graduation',
    label: 'Graduation',
    iconColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    bgGradient: 'from-emerald-500/5 to-transparent',
    bgSelected: 'bg-emerald-500/10',
  },
  social: {
    id: 'social',
    label: 'Social Media',
    iconColor: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
    bgGradient: 'from-cyan-500/5 to-transparent',
    bgSelected: 'bg-cyan-500/10',
  },
};

// ============================================================================
// SERVICE OPTIONS
// ============================================================================

export interface ServiceOption {
  id: string;
  label: string;
  description?: string;
  type: 'toggle' | 'quantity' | 'select';
  defaultValue: boolean | number | string;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string; label: string }[];
  priceType: 'fixed' | 'per-unit' | 'modifier';
  price: number;
  isDiscount?: boolean;
}

export interface ServiceType {
  id: string;
  name: string;
  section: ServiceSection;
  iconName: string;
  description: string;
  mediaTypes: ('photography' | 'videography')[];
  baseHourlyRate: number;
  defaultDuration: number;
  minimumHours: number;
  options: ServiceOption[];
  popular?: boolean;
}

// ============================================================================
// SERVICE DEFINITIONS BY SECTION
// ============================================================================

export const SERVICE_TYPES: ServiceType[] = [
  // === PORTRAITS ===
  {
    id: 'portrait-individual',
    name: 'Individual Portrait',
    section: 'portraits',
    iconName: 'user',
    description: 'Personal portraits, headshots, dating profiles',
    mediaTypes: ['photography'],
    baseHourlyRate: 800,
    defaultDuration: 1,
    minimumHours: 1,
    popular: true,
    options: [
      { id: 'retouch', label: 'Magazine-grade retouch', type: 'toggle', defaultValue: true, priceType: 'fixed', price: 0 },
      { id: 'skip-retouch', label: 'Skip retouching (discount)', type: 'toggle', defaultValue: false, priceType: 'modifier', price: -200, isDiscount: true },
      { id: 'images', label: 'Final images', type: 'quantity', defaultValue: 20, min: 10, max: 50, step: 5, priceType: 'per-unit', price: 25 },
    ],
  },
  {
    id: 'portrait-couple',
    name: 'Couples Shoot',
    section: 'portraits',
    iconName: 'heart',
    description: 'Romantic couples, engagements, anniversaries',
    mediaTypes: ['photography'],
    baseHourlyRate: 900,
    defaultDuration: 1,
    minimumHours: 1,
    options: [
      { id: 'retouch', label: 'Magazine-grade retouch', type: 'toggle', defaultValue: true, priceType: 'fixed', price: 0 },
      { id: 'images', label: 'Final images', type: 'quantity', defaultValue: 25, min: 15, max: 60, step: 5, priceType: 'per-unit', price: 25 },
    ],
  },
  {
    id: 'portrait-family',
    name: 'Family Portrait',
    section: 'portraits',
    iconName: 'users',
    description: 'Family groups, generations, lifestyle',
    mediaTypes: ['photography'],
    baseHourlyRate: 1000,
    defaultDuration: 1,
    minimumHours: 1,
    options: [
      { id: 'images', label: 'Final images', type: 'quantity', defaultValue: 30, min: 20, max: 80, step: 5, priceType: 'per-unit', price: 20 },
    ],
  },
  {
    id: 'portrait-boudoir',
    name: 'Boudoir',
    section: 'portraits',
    iconName: 'sparkles',
    description: 'Intimate, tasteful boudoir photography',
    mediaTypes: ['photography'],
    baseHourlyRate: 1200,
    defaultDuration: 2,
    minimumHours: 2,
    options: [
      { id: 'retouch', label: 'Full body retouch', type: 'toggle', defaultValue: true, priceType: 'fixed', price: 0 },
      { id: 'images', label: 'Final images', type: 'quantity', defaultValue: 25, min: 15, max: 50, step: 5, priceType: 'per-unit', price: 30 },
    ],
  },

  // === WEDDINGS ===
  {
    id: 'wedding-photo',
    name: 'Wedding Photography',
    section: 'weddings',
    iconName: 'camera',
    description: 'Full wedding day coverage',
    mediaTypes: ['photography'],
    baseHourlyRate: 0,
    defaultDuration: 8,
    minimumHours: 4,
    popular: true,
    options: [
      { id: 'lead-photo', label: 'Lead photographer', type: 'toggle', defaultValue: true, priceType: 'fixed', price: 12000 },
      { id: 'second-photo', label: '2nd photographer', type: 'toggle', defaultValue: false, priceType: 'fixed', price: 6000 },
      { id: 'drone', label: 'Drone coverage', type: 'toggle', defaultValue: false, priceType: 'fixed', price: 3500 },
    ],
  },
  {
    id: 'wedding-video',
    name: 'Wedding Videography',
    section: 'weddings',
    iconName: 'video',
    description: 'Cinematic wedding films',
    mediaTypes: ['videography'],
    baseHourlyRate: 0,
    defaultDuration: 8,
    minimumHours: 4,
    popular: true,
    options: [
      { id: 'videographer', label: 'Videographer', type: 'toggle', defaultValue: true, priceType: 'fixed', price: 15000 },
      { id: 'drone', label: 'Drone footage', type: 'toggle', defaultValue: false, priceType: 'fixed', price: 3500 },
      { id: 'same-day', label: 'Same-day edit', type: 'toggle', defaultValue: false, priceType: 'fixed', price: 5000 },
    ],
  },
  {
    id: 'wedding-combo',
    name: 'Photo + Video Package',
    section: 'weddings',
    iconName: 'film',
    description: 'Complete wedding coverage',
    mediaTypes: ['photography', 'videography'],
    baseHourlyRate: 0,
    defaultDuration: 10,
    minimumHours: 6,
    options: [
      { id: 'lead-photo', label: 'Lead photographer', type: 'toggle', defaultValue: true, priceType: 'fixed', price: 12000 },
      { id: 'videographer', label: 'Videographer', type: 'toggle', defaultValue: true, priceType: 'fixed', price: 15000 },
      { id: 'second-photo', label: '2nd photographer', type: 'toggle', defaultValue: false, priceType: 'fixed', price: 6000 },
      { id: 'drone', label: 'Drone coverage', type: 'toggle', defaultValue: false, priceType: 'fixed', price: 3500 },
    ],
  },

  // === PRODUCTS & BRANDS ===
  {
    id: 'product-ecommerce',
    name: 'E-commerce Photos',
    section: 'products',
    iconName: 'package',
    description: 'White background product shots',
    mediaTypes: ['photography'],
    baseHourlyRate: 0,
    defaultDuration: 2,
    minimumHours: 2,
    options: [
      { id: 'products', label: 'Number of products', type: 'quantity', defaultValue: 10, min: 1, max: 50, step: 1, priceType: 'per-unit', price: 150 },
      { id: 'angles', label: 'Multiple angles per product', type: 'toggle', defaultValue: false, priceType: 'modifier', price: 50 },
    ],
  },
  {
    id: 'product-hero',
    name: 'Hero Product Shots',
    section: 'products',
    iconName: 'star',
    description: 'Styled creative product photography',
    mediaTypes: ['photography'],
    baseHourlyRate: 0,
    defaultDuration: 3,
    minimumHours: 2,
    popular: true,
    options: [
      { id: 'products', label: 'Number of setups', type: 'quantity', defaultValue: 5, min: 1, max: 20, step: 1, priceType: 'per-unit', price: 350 },
    ],
  },
  {
    id: 'product-lifestyle',
    name: 'Lifestyle Product',
    section: 'products',
    iconName: 'image',
    description: 'Products in real-life settings',
    mediaTypes: ['photography'],
    baseHourlyRate: 0,
    defaultDuration: 4,
    minimumHours: 2,
    options: [
      { id: 'ai-models', label: 'AI model placement', type: 'toggle', defaultValue: false, priceType: 'per-unit', price: 250 },
      { id: 'real-models', label: 'Real model shoot', type: 'toggle', defaultValue: false, priceType: 'fixed', price: 2500 },
      { id: 'products', label: 'Products featured', type: 'quantity', defaultValue: 5, min: 1, max: 20, step: 1, priceType: 'per-unit', price: 300 },
    ],
  },
  {
    id: 'product-video',
    name: 'Product Video',
    section: 'products',
    iconName: 'video',
    description: 'Product showcase videos',
    mediaTypes: ['videography'],
    baseHourlyRate: 0,
    defaultDuration: 4,
    minimumHours: 2,
    options: [
      { id: 'videos', label: 'Number of videos', type: 'quantity', defaultValue: 3, min: 1, max: 10, step: 1, priceType: 'per-unit', price: 800 },
    ],
  },

  // === CORPORATE ===
  {
    id: 'corporate-headshots',
    name: 'Corporate Headshots',
    section: 'corporate',
    iconName: 'briefcase',
    description: 'Professional headshots for teams',
    mediaTypes: ['photography'],
    baseHourlyRate: 1000,
    defaultDuration: 2,
    minimumHours: 1,
    popular: true,
    options: [
      { id: 'people', label: 'Number of people', type: 'quantity', defaultValue: 5, min: 1, max: 50, step: 1, priceType: 'per-unit', price: 200 },
      { id: 'retouch', label: 'Professional retouch', type: 'toggle', defaultValue: true, priceType: 'fixed', price: 0 },
    ],
  },
  {
    id: 'corporate-video',
    name: 'Corporate Video',
    section: 'corporate',
    iconName: 'film',
    description: 'Promo videos, testimonials, training',
    mediaTypes: ['videography'],
    baseHourlyRate: 1800,
    defaultDuration: 4,
    minimumHours: 2,
    options: [
      { id: 'drone', label: 'Drone footage', type: 'toggle', defaultValue: false, priceType: 'fixed', price: 2500 },
      { id: 'voiceover', label: 'Professional voice-over', type: 'toggle', defaultValue: false, priceType: 'fixed', price: 1500 },
      { id: 'script', label: 'Script writing', type: 'toggle', defaultValue: false, priceType: 'fixed', price: 2000 },
    ],
  },
  {
    id: 'corporate-branding',
    name: 'Brand Photography',
    section: 'corporate',
    iconName: 'image',
    description: 'Team, office, culture photography',
    mediaTypes: ['photography'],
    baseHourlyRate: 1200,
    defaultDuration: 4,
    minimumHours: 2,
    options: [
      { id: 'locations', label: 'Multiple locations', type: 'toggle', defaultValue: false, priceType: 'fixed', price: 500 },
    ],
  },

  // === EVENTS ===
  {
    id: 'event-photo',
    name: 'Event Photography',
    section: 'events',
    iconName: 'camera',
    description: 'Conferences, launches, parties',
    mediaTypes: ['photography'],
    baseHourlyRate: 1200,
    defaultDuration: 3,
    minimumHours: 2,
    popular: true,
    options: [
      { id: 'second-shooter', label: 'Second photographer', type: 'toggle', defaultValue: false, priceType: 'fixed', price: 2500 },
    ],
  },
  {
    id: 'event-video',
    name: 'Event Videography',
    section: 'events',
    iconName: 'video',
    description: 'Event highlights and coverage',
    mediaTypes: ['videography'],
    baseHourlyRate: 1500,
    defaultDuration: 3,
    minimumHours: 2,
    options: [
      { id: 'highlights', label: 'Highlight reel', type: 'toggle', defaultValue: true, priceType: 'fixed', price: 0 },
      { id: 'full-coverage', label: 'Full event edit', type: 'toggle', defaultValue: false, priceType: 'fixed', price: 3000 },
    ],
  },

  // === GRADUATION ===
  {
    id: 'matric-dance',
    name: 'Matric Dance',
    section: 'graduation',
    iconName: 'sparkles',
    description: 'Matric farewell photography',
    mediaTypes: ['photography'],
    baseHourlyRate: 600,
    defaultDuration: 1,
    minimumHours: 1,
    popular: true,
    options: [
      { id: 'images', label: 'Final images', type: 'quantity', defaultValue: 15, min: 10, max: 30, step: 5, priceType: 'per-unit', price: 20 },
      { id: 'couple', label: 'Couple shoot', type: 'toggle', defaultValue: false, priceType: 'fixed', price: 200 },
    ],
  },
  {
    id: 'graduation-ceremony',
    name: 'Graduation Ceremony',
    section: 'graduation',
    iconName: 'award',
    description: 'University/school graduation coverage',
    mediaTypes: ['photography'],
    baseHourlyRate: 800,
    defaultDuration: 2,
    minimumHours: 1,
    options: [
      { id: 'family', label: 'Family group shots', type: 'toggle', defaultValue: true, priceType: 'fixed', price: 0 },
    ],
  },

  // === SOCIAL MEDIA ===
  {
    id: 'social-reels',
    name: 'Reels & TikToks',
    section: 'social',
    iconName: 'video',
    description: 'Short-form vertical video content',
    mediaTypes: ['videography'],
    baseHourlyRate: 0,
    defaultDuration: 2,
    minimumHours: 2,
    popular: true,
    options: [
      { id: 'videos', label: 'Number of videos', type: 'quantity', defaultValue: 5, min: 3, max: 15, step: 1, priceType: 'per-unit', price: 500 },
    ],
  },
  {
    id: 'social-content',
    name: 'Content Day',
    section: 'social',
    iconName: 'image',
    description: 'Mixed photo & video content creation',
    mediaTypes: ['photography', 'videography'],
    baseHourlyRate: 1500,
    defaultDuration: 4,
    minimumHours: 2,
    options: [
      { id: 'photos', label: 'Photo content', type: 'toggle', defaultValue: true, priceType: 'fixed', price: 0 },
      { id: 'videos', label: 'Video content', type: 'toggle', defaultValue: true, priceType: 'fixed', price: 0 },
    ],
  },
  {
    id: 'influencer',
    name: 'Influencer Shoot',
    section: 'social',
    iconName: 'star',
    description: 'Content for influencers & creators',
    mediaTypes: ['photography', 'videography'],
    baseHourlyRate: 1200,
    defaultDuration: 2,
    minimumHours: 1,
    options: [
      { id: 'locations', label: 'Multiple outfit changes', type: 'toggle', defaultValue: true, priceType: 'fixed', price: 0 },
      { id: 'bts', label: 'Behind-the-scenes content', type: 'toggle', defaultValue: false, priceType: 'fixed', price: 500 },
    ],
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export const WEEKDAY_DISCOUNT_PERCENT = 10;

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function getTravelCost(zoneId: string, date: Date): number {
  const zone = LOCATION_ZONES.find(z => z.id === zoneId);
  if (!zone) return 0;
  const tier = isWeekend(date) ? zone.weekendTravelTier : zone.weekdayTravelTier;
  return TRAVEL_COSTS[tier] || 0;
}

export function formatDuration(hours: number): string {
  if (hours === 0) return '';
  if (hours < 1) return `${hours * 60} min`;
  if (hours === 1) return '1 hour';
  if (hours % 1 === 0) return `${hours} hours`;
  return `${Math.floor(hours)}h ${(hours % 1) * 60}m`;
}

export function getServiceById(id: string): ServiceType | undefined {
  return SERVICE_TYPES.find(s => s.id === id);
}

export function getServicesBySection(section: ServiceSection): ServiceType[] {
  return SERVICE_TYPES.filter(s => s.section === section);
}

// ============================================================================
// QUOTE CALCULATION
// ============================================================================

export interface QuoteInputs {
  date: Date | null;
  startTime: string;
  locationZoneId: string;
  locationDetails?: string;
  /** Map of serviceId -> optionValues */
  selectedServices: Record<string, Record<string, boolean | number | string>>;
  globalDuration: number;
}

export interface StaffInputs {
  externalPhotographer: boolean;
  externalShootingCost: number;
  externalTravelCost: number;
  applyDiscount: boolean;
  discountPercent: number;
}

export interface QuoteLineItem {
  serviceId: string;
  serviceName: string;
  label: string;
  amount: number;
  isDiscount?: boolean;
}

export interface QuoteBreakdown {
  lineItems: QuoteLineItem[];
  subtotal: number;
  travelCost: number;
  externalCosts: number;
  weekdayDiscount: number;
  customDiscount: number;
  total: number;
  isWeekend: boolean;
  requiresCustomQuote?: boolean;
}

export function calculateQuote(
  inputs: QuoteInputs,
  staffInputs?: StaffInputs
): QuoteBreakdown | null {
  const { date, locationZoneId, selectedServices, globalDuration } = inputs;

  if (!date || !locationZoneId || Object.keys(selectedServices).length === 0) {
    return null;
  }

  const isWeekendShoot = isWeekend(date);
  const lineItems: QuoteLineItem[] = [];
  let baseTotal = 0;

  // Process each selected service
  for (const [serviceId, optionValues] of Object.entries(selectedServices)) {
    const service = getServiceById(serviceId);
    if (!service) continue;

    // Calculate base cost from hourly rate if applicable
    if (service.baseHourlyRate > 0) {
      const effectiveDuration = Math.max(globalDuration, service.minimumHours);
      const cost = effectiveDuration * service.baseHourlyRate;
      lineItems.push({
        serviceId,
        serviceName: service.name,
        label: `${service.name} (${formatDuration(effectiveDuration)})`,
        amount: cost,
      });
      baseTotal += cost;
    }

    // Process options
    for (const option of service.options) {
      const value = optionValues[option.id] ?? option.defaultValue;

      if (option.type === 'toggle' && value === true && option.price !== 0) {
        lineItems.push({
          serviceId,
          serviceName: service.name,
          label: option.label,
          amount: option.price,
          isDiscount: option.isDiscount,
        });
        baseTotal += option.price;
      } else if (option.type === 'quantity' && typeof value === 'number' && option.priceType === 'per-unit') {
        const itemTotal = value * option.price;
        if (itemTotal > 0) {
          lineItems.push({
            serviceId,
            serviceName: service.name,
            label: `${option.label} × ${value}`,
            amount: itemTotal,
          });
          baseTotal += itemTotal;
        }
      }
    }
  }

  const travelCost = getTravelCost(locationZoneId, date);
  const externalCosts = staffInputs?.externalPhotographer
    ? (staffInputs.externalShootingCost || 0) + (staffInputs.externalTravelCost || 0)
    : 0;

  const subtotal = baseTotal + travelCost + externalCosts;

  const weekdayDiscount = !isWeekendShoot
    ? Math.round(baseTotal * (WEEKDAY_DISCOUNT_PERCENT / 100))
    : 0;

  const customDiscount = staffInputs?.applyDiscount
    ? Math.round(subtotal * ((staffInputs.discountPercent || 0) / 100))
    : 0;

  const total = subtotal - weekdayDiscount - customDiscount;
  const requiresCustomQuote = locationZoneId === 'other' || total === 0;

  return {
    lineItems,
    subtotal: baseTotal,
    travelCost,
    externalCosts,
    weekdayDiscount,
    customDiscount,
    total,
    isWeekend: isWeekendShoot,
    requiresCustomQuote,
  };
}
