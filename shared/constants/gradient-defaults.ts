/**
 * Default gradient configurations for all site sections
 * These values serve as fallbacks when no custom values exist in the database
 * Current as of September 2025 - extracted from production config
 */

interface GradientConfig {
  startColor: string;
  middleColor: string;
  endColor: string;
  direction: string;
  opacity?: number;
  textColors?: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
  };
}

export const GRADIENT_DEFAULTS: Record<string, GradientConfig> = {
  // Homepage Sections
  hero: {
    startColor: "#1e293b",
    middleColor: "#334155",
    endColor: "#0f172a",
    direction: "135deg"
  },

  services: {
    startColor: "#1f2c41",
    middleColor: "#595959",
    endColor: "#212c28",
    direction: "135deg",
    textColors: {
      primary: "#fefbfb",
      secondary: "#e2eaf3",
      tertiary: "#e8eef7"
    }
  },

  testimonials: {
    startColor: "#3b3a3a",
    middleColor: "#334155",
    endColor: "#5b5b62",
    direction: "135deg",
    opacity: 0.1,
    textColors: {
      primary: "#f7eded",
      secondary: "#e2e7ee",
      tertiary: "#97a8be"
    }
  },

  privateGallery: {
    startColor: "#808080",
    middleColor: "#334155",
    endColor: "#a6aba7",
    direction: "135deg",
    textColors: {
      primary: "#fcfcfc",
      secondary: "#ecf1f8",
      tertiary: "#94a3b8"
    }
  },

  portfolio: {
    startColor: "#cddaee",
    middleColor: "#081b30",
    endColor: "#6e6a81",
    direction: "135deg"
  },

  contact: {
    startColor: "#747b8b",
    middleColor: "#1e293b",
    endColor: "#334155",
    direction: "45deg",
    textColors: {
      secondary: "#e5eaf0"
    }
  },

  // About Page Sections
  aboutHero: {
    startColor: "#1e293b",
    middleColor: "#334155",
    endColor: "#0f172a",
    direction: "135deg",
    opacity: 1,
    textColors: {
      primary: "#dd3131",
      secondary: "#22569b",
      tertiary: "#c41c97"
    }
  },

  aboutStory: {
    startColor: "#442808",
    middleColor: "#170e07",
    endColor: "#966136",
    direction: "135deg",
    opacity: 1,
    textColors: {
      primary: "#ffffff",
      secondary: "#e2e8f0",
      tertiary: "#94a3b8"
    }
  },

  aboutValues: {
    startColor: "#1c2f4f",
    middleColor: "#334155",
    endColor: "#111a2c",
    direction: "135deg",
    opacity: 1,
    textColors: {
      primary: "#ffffff",
      secondary: "#e2e8f0",
      tertiary: "#94a3b8"
    }
  },

  aboutTeam: {
    startColor: "#1a242d",
    middleColor: "#27142f",
    endColor: "#0c1427",
    direction: "135deg",
    opacity: 1,
    textColors: {
      primary: "#fafbff",
      secondary: "#e2e8f0",
      tertiary: "#94a3b8"
    }
  }
};

export type GradientSectionKey = keyof typeof GRADIENT_DEFAULTS;

/**
 * Get default gradient configuration for a section
 */
export function getDefaultGradient(sectionKey: string): GradientConfig {
  return GRADIENT_DEFAULTS[sectionKey] || GRADIENT_DEFAULTS.services; // Fallback to services if section not found
}

/**
 * Get all available section keys
 */
export function getAvailableSections(): string[] {
  return Object.keys(GRADIENT_DEFAULTS);
}