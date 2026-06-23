/**
 * Quote Generator - Clean Apple-style design
 *
 * 6 category cards with expandable settings
 * Settings preserved when switching between cards
 */

import { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Minus,
  Plus,
} from 'lucide-react';
import { useLocation } from 'wouter';
import { format, isWeekend } from 'date-fns';

// Inline style helpers for colors that Tailwind might purge
const TEAL_BG = 'rgba(20, 184, 166, 0.2)'; // teal-500 at 20%
const TEAL_BG_LIGHT = 'rgba(20, 184, 166, 0.1)'; // teal-500 at 10%
const TEAL_BORDER = 'rgba(20, 184, 166, 0.3)';
const TEAL_TEXT = 'rgb(45, 212, 191)'; // teal-400
const VIOLET_BG = 'rgba(139, 92, 246, 0.2)'; // violet-500 at 20%
const VIOLET_TEXT = 'rgb(167, 139, 250)'; // violet-400

import { Navigation } from '@/components/layout/navigation';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { GradientBackground } from '@/components/common/gradient-background';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES & CONFIG
// ============================================================================

interface CategoryOption {
  id: string;
  label: string;
  price: number;
  type: 'toggle' | 'quantity';
  defaultValue: boolean | number;
  min?: number;
  max?: number;
}

interface Category {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  options: CategoryOption[];
}

const CATEGORIES: Category[] = [
  {
    id: 'portraits',
    title: 'Portraits',
    subtitle: 'Headshots, model Z cards, fashion, lifestyle, personal branding',
    color: 'rose',
    options: [
      { id: 'individual', label: 'Individual portrait', price: 800, type: 'toggle', defaultValue: true },
      { id: 'couple', label: 'Couple shoot', price: 900, type: 'toggle', defaultValue: false },
      { id: 'family', label: 'Family portrait', price: 1000, type: 'toggle', defaultValue: false },
      { id: 'boudoir', label: 'Boudoir session', price: 1200, type: 'toggle', defaultValue: false },
      { id: 'retouch', label: 'Magazine retouch', price: 0, type: 'toggle', defaultValue: true },
      { id: 'images', label: 'Final images', price: 25, type: 'quantity', defaultValue: 20, min: 10, max: 50 },
    ],
  },
  {
    id: 'wedding',
    title: 'Wedding',
    subtitle: 'Weddings, engagements, maternity, newborn, proposal shoots',
    color: 'red',
    options: [
      { id: 'lead-photo', label: 'Lead photographer', price: 12000, type: 'toggle', defaultValue: true },
      { id: 'second-photo', label: '2nd photographer', price: 6000, type: 'toggle', defaultValue: false },
      { id: 'videographer', label: 'Videographer', price: 15000, type: 'toggle', defaultValue: false },
      { id: 'drone', label: 'Drone coverage', price: 3500, type: 'toggle', defaultValue: false },
      { id: 'same-day', label: 'Same-day edit', price: 5000, type: 'toggle', defaultValue: false },
    ],
  },
  {
    id: 'corporate',
    title: 'Corporate',
    subtitle: 'Team photos, office interiors, conferences, executive portraits',
    color: 'blue',
    options: [
      { id: 'headshots', label: 'Headshots', price: 200, type: 'toggle', defaultValue: true },
      { id: 'team-photo', label: 'Team photography', price: 1500, type: 'toggle', defaultValue: false },
      { id: 'corporate-video', label: 'Corporate video', price: 5000, type: 'toggle', defaultValue: false },
      { id: 'drone', label: 'Drone footage', price: 2500, type: 'toggle', defaultValue: false },
      { id: 'people', label: 'Number of people', price: 150, type: 'quantity', defaultValue: 5, min: 1, max: 50 },
    ],
  },
  {
    id: 'product',
    title: 'Product',
    subtitle: 'E-commerce, catalogue, packshots, flatlay, 360° spins',
    color: 'amber',
    options: [
      { id: 'white-bg', label: 'White background', price: 150, type: 'toggle', defaultValue: true },
      { id: 'hero', label: 'Hero shots', price: 350, type: 'toggle', defaultValue: false },
      { id: 'lifestyle', label: 'Lifestyle images', price: 300, type: 'toggle', defaultValue: false },
      { id: 'video', label: 'Product video', price: 800, type: 'toggle', defaultValue: false },
      { id: 'products', label: 'Number of products', price: 0, type: 'quantity', defaultValue: 10, min: 1, max: 50 },
    ],
  },
  {
    id: 'event',
    title: 'Event',
    subtitle: 'Conferences, parties, launches, exhibitions, sports',
    color: 'purple',
    options: [
      { id: 'photography', label: 'Event photography', price: 1200, type: 'toggle', defaultValue: true },
      { id: 'videography', label: 'Event videography', price: 1500, type: 'toggle', defaultValue: false },
      { id: 'second', label: 'Second photographer', price: 2500, type: 'toggle', defaultValue: false },
      { id: 'highlights', label: 'Highlight reel', price: 2000, type: 'toggle', defaultValue: false },
    ],
  },
  {
    id: 'social',
    title: 'Social Media',
    subtitle: 'Reels, TikToks, stories, content days, influencer packages',
    color: 'teal',
    options: [
      { id: 'reels', label: 'Reels & TikToks', price: 500, type: 'toggle', defaultValue: true },
      { id: 'photos', label: 'Photo content', price: 400, type: 'toggle', defaultValue: true },
      { id: 'stories', label: 'Stories content', price: 300, type: 'toggle', defaultValue: false },
      { id: 'count', label: 'Number of pieces', price: 0, type: 'quantity', defaultValue: 5, min: 3, max: 20 },
    ],
  },
];

const LOCATIONS = [
  { id: 'studio', label: 'Studio', travel: 0 },
  { id: 'umhlanga', label: 'Umhlanga', travel: 150 },
  { id: 'durban-north', label: 'Durban North', travel: 150 },
  { id: 'durban-central', label: 'Durban Central', travel: 300 },
  { id: 'durban-south', label: 'Durban South', travel: 500 },
  { id: 'westville', label: 'Westville', travel: 300 },
  { id: 'ballito', label: 'Ballito', travel: 500 },
  { id: 'pmb', label: 'PMB / Midlands', travel: 800 },
  { id: 'custom', label: 'Enter later', travel: 0 },
];

// ============================================================================
// CATEGORY CARD
// ============================================================================

interface CategoryCardProps {
  category: Category;
  isActive: boolean;
  isExpanded: boolean;
  settings: Record<string, boolean | number>;
  onActivate: () => void;
  onHeaderClick: () => void;
  onSettingChange: (optionId: string, value: boolean | number) => void;
}

function CategoryCard({
  category,
  isActive,
  isExpanded,
  settings,
  onActivate,
  onHeaderClick,
  onSettingChange,
}: CategoryCardProps) {
  // Use Tailwind classes for standard colors, inline styles for teal
  const isTeal = category.color === 'teal';

  const colorMap: Record<string, { bg: string; border: string; activeBg: string }> = {
    rose: { bg: 'bg-rose-500/10', border: 'border-rose-500/20', activeBg: 'bg-rose-500/20' },
    red: { bg: 'bg-red-500/10', border: 'border-red-500/20', activeBg: 'bg-red-500/20' },
    blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', activeBg: 'bg-blue-500/20' },
    amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', activeBg: 'bg-amber-500/20' },
    purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', activeBg: 'bg-purple-500/20' },
  };
  const colorClasses = colorMap[category.color];

  return (
    <div
      className={cn(
        'rounded-2xl border transition-all duration-200',
        !isTeal && colorClasses?.border,
        !isTeal && (isActive ? colorClasses?.activeBg : colorClasses?.bg)
      )}
      style={isTeal ? {
        backgroundColor: isActive ? TEAL_BG : TEAL_BG_LIGHT,
        borderColor: TEAL_BORDER,
      } : undefined}
    >
      {/* Card Header - Always visible */}
      <button
        onClick={onHeaderClick}
        className="w-full p-5 flex items-center justify-between text-left"
      >
        <div className="flex-1">
          <span className={cn(
            'text-xl font-quicksand font-semibold tracking-tight',
            !isActive && 'text-muted-foreground/60'
          )}>{category.title}</span>
          {isExpanded && (
            <p className="text-xs font-quicksand text-muted-foreground mt-1">{category.subtitle}</p>
          )}
        </div>
        <Switch
          checked={isActive}
          className="data-[state=checked]:bg-salmon"
          onClick={(e) => e.stopPropagation()}
          onCheckedChange={onActivate}
        />
      </button>

      {/* Expanded Settings - always show content, grey out if inactive */}
      {isExpanded && (
        <div className={cn(
          'px-5 pb-5 pt-2 border-t border-white/5 space-y-1',
          !isActive && 'opacity-40'
        )}>
          {category.options.map((option) => {
            const value = settings[option.id] ?? option.defaultValue;

            if (option.type === 'toggle') {
              return (
                <div key={option.id} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-quicksand">{option.label}</span>
                    {option.price > 0 && (
                      <span className="text-xs text-muted-foreground">
                        R{option.price.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <Switch
                    checked={value as boolean}
                    onCheckedChange={(checked) => onSettingChange(option.id, checked)}
                    className="data-[state=checked]:bg-salmon scale-90"
                    disabled={!isActive}
                  />
                </div>
              );
            }

            if (option.type === 'quantity') {
              const numValue = value as number;
              return (
                <div key={option.id} className="flex items-center justify-between py-1">
                  <span className="text-sm font-quicksand">{option.label}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSettingChange(option.id, Math.max(option.min || 1, numValue - 1))}
                      className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors disabled:opacity-50"
                      disabled={!isActive}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center text-sm font-medium">{numValue}</span>
                    <button
                      onClick={() => onSettingChange(option.id, Math.min(option.max || 99, numValue + 1))}
                      className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors disabled:opacity-50"
                      disabled={!isActive}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function QuoteGeneratorCore() {
  // Date selection
  const [dateMode, setDateMode] = useState<'weekday' | 'weekend' | 'date'>('weekday');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Location
  const [locationMode, setLocationMode] = useState<'studio' | 'location'>('studio');
  const [selectedLocation, setSelectedLocation] = useState('studio');
  const [showLocations, setShowLocations] = useState(false);

  // Category states - preserved settings
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set());
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // Initialize all category settings upfront
  const [categorySettings, setCategorySettings] = useState<Record<string, Record<string, boolean | number>>>(() => {
    const initialSettings: Record<string, Record<string, boolean | number>> = {};
    CATEGORIES.forEach(category => {
      const defaults: Record<string, boolean | number> = {};
      category.options.forEach(opt => {
        defaults[opt.id] = opt.defaultValue;
      });
      initialSettings[category.id] = defaults;
    });
    return initialSettings;
  });

  // Get row index for a category
  const getRowIndex = (categoryId: string): number => {
    const index = CATEGORIES.findIndex(c => c.id === categoryId);
    return Math.floor(index / 2);
  };

  // Handle clicking the card header (expand row AND activate)
  const handleHeaderClick = (categoryId: string) => {
    const rowIndex = getRowIndex(categoryId);
    const isCurrentlyExpanded = expandedRow === rowIndex;

    // Toggle expansion
    setExpandedRow(isCurrentlyExpanded ? null : rowIndex);

    // If expanding (not collapsing), also activate the category
    if (!isCurrentlyExpanded && !activeCategories.has(categoryId)) {
      const newActive = new Set(activeCategories);
      newActive.add(categoryId);
      setActiveCategories(newActive);
    }
  };

  // Handle toggling category active state
  const handleCategoryActivate = (categoryId: string) => {
    const newActive = new Set(activeCategories);

    if (newActive.has(categoryId)) {
      newActive.delete(categoryId);
    } else {
      newActive.add(categoryId);
      // Expand the row when activating
      setExpandedRow(getRowIndex(categoryId));
    }

    setActiveCategories(newActive);
  };

  const handleSettingChange = (categoryId: string, optionId: string, value: boolean | number) => {
    setCategorySettings(prev => ({
      ...prev,
      [categoryId]: { ...prev[categoryId], [optionId]: value },
    }));
  };

  // Check if weekday discount applies
  const isWeekdayDiscount = useMemo(() => {
    if (dateMode === 'weekday') return true;
    if (dateMode === 'date' && selectedDate && !isWeekend(selectedDate)) return true;
    return false;
  }, [dateMode, selectedDate]);

  // Calculate total
  const total = useMemo(() => {
    let sum = 0;

    activeCategories.forEach(categoryId => {
      const category = CATEGORIES.find(c => c.id === categoryId);
      const settings = categorySettings[categoryId] || {};

      if (category) {
        category.options.forEach(option => {
          const value = settings[option.id] ?? option.defaultValue;

          if (option.type === 'toggle' && value === true) {
            sum += option.price;
          } else if (option.type === 'quantity' && typeof value === 'number') {
            sum += option.price * value;
          }
        });
      }
    });

    // Add travel
    const location = LOCATIONS.find(l => l.id === selectedLocation);
    if (location) sum += location.travel;

    // Weekday discount (applies for 'weekday' mode OR when picked date is a weekday)
    if (isWeekdayDiscount) {
      sum = Math.round(sum * 0.9);
    }

    return sum;
  }, [activeCategories, categorySettings, selectedLocation, isWeekdayDiscount]);

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-4xl md:text-5xl font-quicksand font-bold tracking-tight">Quote Generator</h1>
        <p className="text-base font-quicksand text-muted-foreground mt-2">Build your custom package</p>
      </div>

      {/* Top Controls - Single container */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Day/Date */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-lg font-quicksand font-semibold">
                Day / Date
              </label>
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-quicksand font-medium transition-colors"
                style={{
                  backgroundColor: isWeekdayDiscount ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  color: isWeekdayDiscount ? 'rgb(74, 222, 128)' : undefined,
                }}
              >
                {isWeekdayDiscount && <span>✓</span>}
                Weekday discounts
              </span>
            </div>
            <div className="flex rounded-xl border border-white/10 overflow-hidden">
              <button
                onClick={() => setDateMode('weekday')}
                className={cn(
                  'flex-1 py-3 text-sm font-quicksand font-medium transition-colors',
                  dateMode === 'weekday' ? 'bg-green-500/20 text-green-400' : 'hover:bg-white/5'
                )}
              >
                Weekday
              </button>
              <button
                onClick={() => setDateMode('weekend')}
                className={cn(
                  'flex-1 py-3 text-sm font-quicksand font-medium transition-colors border-x border-white/10',
                  dateMode === 'weekend' ? 'bg-amber-500/20 text-amber-400' : 'hover:bg-white/5'
                )}
              >
                Weekend
              </button>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <button
                    onClick={() => setDateMode('date')}
                    className={cn(
                      'flex-1 py-3 text-sm font-quicksand font-medium transition-colors',
                      dateMode === 'date' ? 'bg-rose-500/20 text-rose-400' : 'hover:bg-white/5'
                    )}
                  >
                    {dateMode === 'date' && selectedDate
                      ? format(selectedDate, 'dd MMM')
                      : 'Pick Date'}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-background border-white/10" align="center">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate || undefined}
                    onSelect={(date) => {
                      setSelectedDate(date || null);
                      setDateMode('date');
                      setDatePickerOpen(false);
                    }}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label className="text-lg font-quicksand font-semibold">
              Location
            </label>
            <div className="flex rounded-xl border border-white/10 overflow-hidden">
              <button
                onClick={() => {
                  setLocationMode('studio');
                  setSelectedLocation('studio');
                  setShowLocations(false);
                }}
                className="flex-1 py-3 text-sm font-quicksand font-medium transition-colors"
                style={locationMode === 'studio' ? {
                  backgroundColor: VIOLET_BG,
                  color: VIOLET_TEXT,
                } : undefined}
              >
                Studio
              </button>
              <button
                onClick={() => {
                  setLocationMode('location');
                  setSelectedLocation('custom'); // Default to "Enter later"
                  setShowLocations(!showLocations);
                }}
                className="flex-1 py-3 text-sm font-quicksand font-medium transition-colors border-l border-white/10"
                style={locationMode === 'location' ? {
                  backgroundColor: TEAL_BG,
                  color: TEAL_TEXT,
                } : undefined}
              >
                On Location
              </button>
            </div>
          </div>
        </div>

        {/* Location Selector - inside the container */}
        {showLocations && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {LOCATIONS.filter(l => l.id !== 'studio').map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => setSelectedLocation(loc.id)}
                  className="p-3 rounded-lg text-left transition-colors"
                  style={selectedLocation === loc.id ? {
                    backgroundColor: TEAL_BG,
                    color: TEAL_TEXT,
                    boxShadow: `inset 0 0 0 1px ${TEAL_BORDER}`,
                  } : undefined}
                >
                  <span className="block text-sm font-quicksand font-medium">{loc.label}</span>
                  <span className="text-xs font-quicksand opacity-60">R{loc.travel}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Category Cards - 2 column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {CATEGORIES.map((category, index) => (
          <CategoryCard
            key={category.id}
            category={category}
            isActive={activeCategories.has(category.id)}
            isExpanded={expandedRow === Math.floor(index / 2)}
            settings={categorySettings[category.id] || {}}
            onActivate={() => handleCategoryActivate(category.id)}
            onHeaderClick={() => handleHeaderClick(category.id)}
            onSettingChange={(optId, val) => handleSettingChange(category.id, optId, val)}
          />
        ))}
      </div>

      {/* Quote Total */}
      {activeCategories.size > 0 && (
        <div className="rounded-2xl border border-salmon/30 bg-gradient-to-r from-salmon/10 to-transparent p-6">
          <div className="flex items-center justify-between">
            <span className="text-lg font-quicksand font-medium">Estimated Total</span>
            <span className="text-3xl font-quicksand font-bold text-salmon tracking-tight">
              R{total.toLocaleString()}
            </span>
          </div>
          <Button className="w-full mt-5 h-12 text-base font-quicksand font-medium bg-salmon hover:bg-salmon/90">
            Request Quote
          </Button>
        </div>
      )}
    </div>
  );
}

// Default export
export default function QuoteGenerator() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <GradientBackground section="services" className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/tools')}
            className="mb-6 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tools
          </Button>
          <QuoteGeneratorCore />
        </div>
      </GradientBackground>
      <Footer />
    </div>
  );
}
