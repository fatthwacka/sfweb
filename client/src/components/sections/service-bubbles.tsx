import { motion } from "framer-motion";
import { Camera, Video, Globe, Bot } from "lucide-react";
import { Link } from "wouter";
import { useRef, useEffect, useState, useCallback, forwardRef } from "react";

interface ServiceBubble {
  id: string;
  labelMobile: string;
  labelTablet: string;
  labelDesktop: string;
  tagline: string;
  icon: React.ReactNode;
  link: string;
  colorClass: 'blue' | 'purple' | 'green' | 'orange';
}

const serviceBubbles: ServiceBubble[] = [
  {
    id: 'photo',
    labelMobile: 'Photo',
    labelTablet: 'Pro Photography',
    labelDesktop: 'Professional Photography',
    tagline: '',
    icon: <Camera />,
    link: '/photography',
    colorClass: 'blue'
  },
  {
    id: 'video',
    labelMobile: 'Video',
    labelTablet: 'Pro Videography',
    labelDesktop: 'Cinematic Videography',
    tagline: '',
    icon: <Video />,
    link: '/videography',
    colorClass: 'purple'
  },
  {
    id: 'web-apps',
    labelMobile: 'Web',
    labelTablet: 'Web & Apps',
    labelDesktop: 'Web Development & Apps',
    tagline: '',
    icon: <Globe />,
    link: '/web-apps',
    colorClass: 'green'
  },
  {
    id: 'ai-bots',
    labelMobile: 'AI Apps',
    labelTablet: 'AI Tools',
    labelDesktop: 'AI Business Tools',
    tagline: '',
    icon: <Bot />,
    link: '/tools',
    colorClass: 'orange'
  }
];

// Colour configuration for each service
const colorConfig = {
  blue: {
    border: 'border-blue-600/60',
    bg: 'from-blue-950/30 to-gray-800/65',
    hoverBg: 'hover:from-blue-900/50',
    glow: 'from-blue-500/30 to-indigo-500/30',
    accent: '#3b82f6'
  },
  purple: {
    border: 'border-purple-600/60',
    bg: 'from-purple-950/30 to-gray-800/65',
    hoverBg: 'hover:from-purple-900/50',
    glow: 'from-purple-500/30 to-indigo-500/30',
    accent: '#a855f7'
  },
  green: {
    border: 'border-green-600/60',
    bg: 'from-green-950/30 to-gray-800/65',
    hoverBg: 'hover:from-green-900/50',
    glow: 'from-green-500/30 to-emerald-500/30',
    accent: '#22c55e'
  },
  orange: {
    border: 'border-orange-600/60',
    bg: 'from-orange-950/30 to-gray-800/65',
    hoverBg: 'hover:from-orange-900/50',
    glow: 'from-orange-500/30 to-amber-500/30',
    accent: '#f97316'
  }
};

// ============================================================================
// SVG CONNECTOR LINES - Draws curved lines from buttons to tree
// ============================================================================
interface ConnectorPath {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
}

function ServiceConnectors({
  containerRef,
  mobileRefs,
  tabletRefs,
  desktopRefs,
  treeRef
}: {
  containerRef: React.RefObject<HTMLDivElement>;
  mobileRefs: React.RefObject<(HTMLDivElement | null)[]>;
  tabletRefs: React.RefObject<(HTMLDivElement | null)[]>;
  desktopRefs: React.RefObject<(HTMLDivElement | null)[]>;
  treeRef: React.RefObject<HTMLDivElement>;
}) {
  const [paths, setPaths] = useState<ConnectorPath[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const calculatePaths = useCallback(() => {
    if (!containerRef.current || !treeRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const treeRect = treeRef.current.getBoundingClientRect();

    // Tree target point (top centre of tree)
    const treeX = treeRect.left + treeRect.width / 2 - containerRect.left;
    const treeY = treeRect.top - containerRect.top;

    // Determine which breakpoint is active by checking which buttons are visible
    // NOTE: Connector lines currently only enabled for mobile (desktop/tablet disabled for now)
    let activeRefs: (HTMLDivElement | null)[] = [];

    // Desktop connectors disabled for now
    // if (desktopRefs.current && desktopRefs.current[0]) {
    //   const rect = desktopRefs.current[0].getBoundingClientRect();
    //   if (rect.width > 0 && rect.height > 0) {
    //     activeRefs = desktopRefs.current;
    //   }
    // }

    // Tablet connectors disabled for now
    // if (activeRefs.length === 0 && tabletRefs.current && tabletRefs.current[0]) {
    //   const rect = tabletRefs.current[0].getBoundingClientRect();
    //   if (rect.width > 0 && rect.height > 0) {
    //     activeRefs = tabletRefs.current;
    //   }
    // }

    // Check mobile (< 768px) - only active breakpoint for connectors
    if (mobileRefs.current && mobileRefs.current[0]) {
      const rect = mobileRefs.current[0].getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        activeRefs = mobileRefs.current;
      }
    }

    if (activeRefs.length === 0) return;

    const newPaths: ConnectorPath[] = [];
    const colors = [colorConfig.blue.accent, colorConfig.purple.accent, colorConfig.green.accent, colorConfig.orange.accent];

    activeRefs.forEach((buttonEl, index) => {
      if (!buttonEl) return;

      const buttonRect = buttonEl.getBoundingClientRect();
      // Skip if button is not visible
      if (buttonRect.width === 0 || buttonRect.height === 0) return;

      // Start from bottom centre of each button
      const startX = buttonRect.left + buttonRect.width / 2 - containerRect.left;
      const startY = buttonRect.bottom - containerRect.top;

      newPaths.push({
        startX,
        startY,
        endX: treeX,
        endY: treeY,
        color: colors[index] || '#ffffff'
      });
    });

    setPaths(newPaths);
    setDimensions({
      width: containerRect.width,
      height: containerRect.height
    });
  }, [containerRef, mobileRefs, tabletRefs, desktopRefs, treeRef]);

  useEffect(() => {
    // Initial calculation after a short delay to ensure DOM is ready
    const timer = setTimeout(calculatePaths, 100);

    // Set up ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      calculatePaths();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Also listen for window resize
    window.addEventListener('resize', calculatePaths);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      window.removeEventListener('resize', calculatePaths);
    };
  }, [calculatePaths, containerRef]);

  // Generate smooth Bézier curve path
  const generateCurvePath = (path: ConnectorPath): string => {
    const { startX, startY, endX, endY } = path;

    // Calculate vertical distance
    const verticalDist = endY - startY;

    // Control points for smooth S-curve
    // First control point: straight down from start
    const cp1X = startX;
    const cp1Y = startY + verticalDist * 0.4;

    // Second control point: above end, horizontally aligned with end
    const cp2X = endX;
    const cp2Y = endY - verticalDist * 0.3;

    return `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
  };

  if (paths.length === 0 || dimensions.width === 0) return null;

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-0"
      width={dimensions.width}
      height={dimensions.height}
      style={{ overflow: 'visible' }}
    >
      <defs>
        {paths.map((path, index) => (
          <linearGradient
            key={`gradient-${index}`}
            id={`line-gradient-${index}`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor={path.color} stopOpacity="0.6" />
            <stop offset="100%" stopColor={path.color} stopOpacity="0.2" />
          </linearGradient>
        ))}
      </defs>
      {paths.map((path, index) => (
        <motion.path
          key={index}
          d={generateCurvePath(path)}
          fill="none"
          stroke={`url(#line-gradient-${index})`}
          strokeWidth="1.5"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            pathLength: { delay: 0.5 + index * 0.15, duration: 0.8, ease: "easeOut" },
            opacity: { delay: 0.5 + index * 0.15, duration: 0.3 }
          }}
        />
      ))}
    </svg>
  );
}

// ============================================================================
// MAIN COMPONENT - Now with refs for connectors
// ============================================================================
interface ServiceBubblesProps {
  treeRef?: React.RefObject<HTMLDivElement>;
}

export function ServiceBubbles({ treeRef }: ServiceBubblesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mobileRefs = useRef<(HTMLDivElement | null)[]>([]);
  const tabletRefs = useRef<(HTMLDivElement | null)[]>([]);
  const desktopRefs = useRef<(HTMLDivElement | null)[]>([]);

  return (
    <div className="mb-2 mt-0 relative" ref={containerRef}>
      {/* SVG Connector Lines - only show if treeRef is provided */}
      {treeRef && (
        <ServiceConnectors
          containerRef={containerRef}
          mobileRefs={mobileRefs}
          tabletRefs={tabletRefs}
          desktopRefs={desktopRefs}
          treeRef={treeRef}
        />
      )}

      {/* Mobile: compact pills (< 768px) */}
      <div className="md:hidden overflow-x-auto scrollbar-hide py-8">
        <div className="flex gap-3 justify-center min-w-full px-4">
          {serviceBubbles.map((service, index) => (
            <ServiceBubbleMobile
              key={service.id}
              service={service}
              index={index}
              ref={(el) => { mobileRefs.current[index] = el; }}
            />
          ))}
        </div>
      </div>

      {/* Tablet: larger pills with full names (768px - 1023px) - HIDDEN FOR NOW */}
      {/* <div className="hidden md:flex lg:hidden items-center justify-center gap-5 max-w-4xl mx-auto py-10">
        {serviceBubbles.map((service, index) => (
          <ServiceBubbleTablet
            key={service.id}
            service={service}
            index={index}
            ref={(el) => { tabletRefs.current[index] = el; }}
          />
        ))}
      </div> */}

      {/* Desktop: elegant cards (≥ 1024px) - HIDDEN FOR NOW */}
      {/* <div className="hidden lg:flex items-center justify-center gap-6 max-w-6xl mx-auto py-12">
        {serviceBubbles.map((service, index) => (
          <ServiceBubbleDesktop
            key={service.id}
            service={service}
            index={index}
            ref={(el) => { desktopRefs.current[index] = el; }}
          />
        ))}
      </div> */}
    </div>
  );
}

interface ServiceBubbleProps {
  service: ServiceBubble;
  index: number;
}

// Shared sparkle effects component
function SparkleEffects({ sparkleCount = 8, cornerCount = 4 }: { sparkleCount?: number; cornerCount?: number }) {
  return (
    <div className="absolute inset-0 pointer-events-none -m-4">
      <div className="sparkles opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {/* Main sparkle particles */}
        {[...Array(sparkleCount)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 bg-purple-300 rounded-full"
            style={{
              left: `${10 + (i * (80 / sparkleCount))}%`,
              top: i % 2 === 0 ? '-8px' : '100%',
            }}
            animate={{
              scale: [0, 1.2, 0],
              opacity: [0, 1, 0],
              rotate: [0, 180, 360],
              y: i % 2 === 0 ? [0, -10, 0] : [0, 10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.25,
              ease: "easeInOut"
            }}
          />
        ))}
        {/* Corner sparkles */}
        {[...Array(cornerCount)].map((_, i) => (
          <motion.div
            key={`corner-${i}`}
            className="absolute w-1 h-1 bg-yellow-300 rounded-full"
            style={{
              left: i < 2 ? '-6px' : '100%',
              top: i % 2 === 0 ? '20%' : '80%',
            }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              delay: i * 0.3 + 0.5,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Shared shimmer effect component
function ShimmerEffect() {
  return (
    <motion.div
      className="absolute inset-0 opacity-0 group-hover:opacity-40"
      style={{
        background: 'linear-gradient(45deg, transparent 30%, rgba(168, 85, 247, 0.4) 50%, transparent 70%)',
      }}
      animate={{
        x: ['-100%', '100%'],
      }}
      transition={{
        duration: 1.2,
        repeat: Infinity,
        repeatDelay: 1.5,
        ease: "easeInOut"
      }}
    />
  );
}

// ============================================================================
// MOBILE: Compact pills (< 768px) - Original design preserved
// ============================================================================
const ServiceBubbleMobile = forwardRef<HTMLDivElement, ServiceBubbleProps>(
  ({ service, index }, ref) => {
    const colors = colorConfig[service.colorClass];

    return (
      <Link href={service.link}>
        <motion.div
          ref={ref}
          className="service-bubble-container relative group cursor-pointer"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <SparkleEffects sparkleCount={8} cornerCount={4} />

          <div className={`px-4 py-2 font-barlow font-normal rounded-full transition-all duration-300 text-sm whitespace-nowrap flex-shrink-0 relative overflow-hidden border text-gray-200 hover:border-purple-400/60 hover:bg-gradient-to-r hover:from-purple-900/40 hover:via-indigo-800/30 hover:to-purple-700/40 hover:text-white bg-gradient-to-r ${colors.bg} ${colors.border} ${colors.hoverBg}`}>
            <ShimmerEffect />
            <span className="relative z-10">{service.labelMobile}</span>
          </div>

          <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${colors.glow} opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg -z-10`} />
        </motion.div>
      </Link>
    );
  }
);
ServiceBubbleMobile.displayName = 'ServiceBubbleMobile';

// ============================================================================
// TABLET: Larger pills with full names (768px - 1023px)
// ============================================================================
const ServiceBubbleTablet = forwardRef<HTMLDivElement, ServiceBubbleProps>(
  ({ service, index }, ref) => {
    const colors = colorConfig[service.colorClass];

    return (
      <Link href={service.link}>
        <motion.div
          ref={ref}
          className="service-bubble-container relative group cursor-pointer"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <SparkleEffects sparkleCount={10} cornerCount={4} />

          <div className={`px-6 py-3 font-barlow font-normal rounded-full transition-all duration-300 text-base whitespace-nowrap flex-shrink-0 relative overflow-hidden border text-gray-200 hover:border-purple-400/60 hover:bg-gradient-to-r hover:from-purple-900/40 hover:via-indigo-800/30 hover:to-purple-700/40 hover:text-white flex items-center gap-2.5 bg-gradient-to-r ${colors.bg} ${colors.border} ${colors.hoverBg}`}>
            <ShimmerEffect />
            <div className="relative z-10 flex items-center gap-2.5">
              <span className="w-5 h-5">{service.icon}</span>
              <span className="font-medium">{service.labelTablet}</span>
            </div>
          </div>

          <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${colors.glow} opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg -z-10`} />
        </motion.div>
      </Link>
    );
  }
);
ServiceBubbleTablet.displayName = 'ServiceBubbleTablet';

// ============================================================================
// DESKTOP: Elegant cards (≥ 1024px)
// ============================================================================
const ServiceBubbleDesktop = forwardRef<HTMLDivElement, ServiceBubbleProps>(
  ({ service, index }, ref) => {
    const colors = colorConfig[service.colorClass];

    return (
      <Link href={service.link}>
        <motion.div
          ref={ref}
          className="service-bubble-container relative group cursor-pointer"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.5 }}
          whileHover={{ scale: 1.03, y: -4 }}
          whileTap={{ scale: 0.98 }}
        >
          <SparkleEffects sparkleCount={12} cornerCount={6} />

          <div
            className={`px-8 py-5 font-barlow rounded-2xl transition-all duration-300 relative overflow-hidden border text-gray-200 hover:border-purple-400/60 hover:text-white flex flex-col items-center justify-center gap-3 bg-gradient-to-br ${colors.bg} ${colors.border} min-w-[220px]`}
            style={{
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
            }}
          >
            <ShimmerEffect />

            {/* Icon with glow - centred */}
            <div
              className="relative z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                boxShadow: `0 0 20px ${colors.accent}40, inset 0 0 15px ${colors.accent}20`
              }}
            >
              <div className="w-6 h-6 flex items-center justify-center" style={{ color: colors.accent }}>
                {service.icon}
              </div>
            </div>

            {/* Title */}
            <span className="relative z-10 font-medium text-base text-center">{service.labelDesktop}</span>
          </div>

          {/* Enhanced glow for cards */}
          <div
            className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${colors.glow} opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl -z-10`}
          />
        </motion.div>
      </Link>
    );
  }
);
ServiceBubbleDesktop.displayName = 'ServiceBubbleDesktop';

// ============================================================================
// TREE WITH EFFECTS - Same hover effects as buttons, links to web-apps
// ============================================================================
export const TreeWithEffects = forwardRef<HTMLDivElement>(
  (_, ref) => {
    return (
      <Link href="/web-apps">
        <motion.div
          ref={ref}
          className="relative group cursor-pointer"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Sparkle effects - 36 continuous + 12 on hover */}
          <div className="absolute inset-0 pointer-events-none">
            {/* BASE SPARKLES - 36 always visible (12 inner + 24 outer rings) */}
            <div className="sparkles opacity-80">
              {/* Inner ring - 12 sparkles */}
              {[...Array(12)].map((_, i) => {
                const angle = (i / 12) * 2 * Math.PI;
                const radius = 34;
                const x = 50 + Math.cos(angle) * radius;
                const y = 50 + Math.sin(angle) * radius;
                const colors = ['bg-purple-300', 'bg-yellow-200', 'bg-cyan-200', 'bg-white'];
                const color = colors[i % 4];
                const size = i % 3 === 0 ? 'w-1 h-1' : 'w-0.5 h-0.5';

                return (
                  <motion.div
                    key={`inner-sparkle-${i}`}
                    className={`absolute ${size} ${color} rounded-full`}
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                    }}
                    animate={{
                      scale: [0, 1.2, 0],
                      opacity: [0, 0.8, 0],
                    }}
                    transition={{
                      duration: 2 + (i % 3) * 0.4,
                      repeat: Infinity,
                      delay: i * 0.18,
                      ease: "easeInOut"
                    }}
                  />
                );
              })}
              {/* Outer ring - 24 sparkles */}
              {[...Array(24)].map((_, i) => {
                const angle = (i / 24) * 2 * Math.PI + 0.13;
                const radius = 44 + (i % 3) * 5;
                const x = 50 + Math.cos(angle) * radius;
                const y = 50 + Math.sin(angle) * radius;
                const colors = ['bg-purple-300', 'bg-yellow-200', 'bg-cyan-200', 'bg-white'];
                const color = colors[i % 4];
                const size = i % 4 === 0 ? 'w-1 h-1' : 'w-0.5 h-0.5';

                return (
                  <motion.div
                    key={`outer-sparkle-${i}`}
                    className={`absolute ${size} ${color} rounded-full`}
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                    }}
                    animate={{
                      scale: [0, 1.1, 0],
                      opacity: [0, 0.7, 0],
                    }}
                    transition={{
                      duration: 1.8 + (i % 4) * 0.3,
                      repeat: Infinity,
                      delay: i * 0.1,
                      ease: "easeInOut"
                    }}
                  />
                );
              })}
            </div>

            {/* HOVER SPARKLES - 12 additional sparkles on hover */}
            <div className="sparkles opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {[...Array(12)].map((_, i) => {
                const angle = (i / 12) * 2 * Math.PI + 0.26;
                const radius = 38 + (i % 2) * 10;
                const x = 50 + Math.cos(angle) * radius;
                const y = 50 + Math.sin(angle) * radius;
                const colors = ['bg-purple-300', 'bg-yellow-200', 'bg-cyan-200', 'bg-white'];
                const color = colors[i % 4];
                const size = i % 3 === 0 ? 'w-1.5 h-1.5' : 'w-1 h-1';

                return (
                  <motion.div
                    key={`hover-sparkle-${i}`}
                    className={`absolute ${size} ${color} rounded-full`}
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                    }}
                    animate={{
                      scale: [0, 1.4, 0],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 1.2 + (i % 3) * 0.2,
                      repeat: Infinity,
                      delay: i * 0.1,
                      ease: "easeInOut"
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Tree image with colour shimmer */}
          <div className="relative w-32 h-32">
            {/* Base tree image */}
            <img
              src="/uploads/trees-20.png"
              alt="Analog Intelligence"
              className="w-32 h-32 opacity-90 relative z-10 transition-all duration-300 group-hover:opacity-100"
            />
            {/* Colour shimmer overlay - cycles through colours on hover */}
            <motion.div
              className="absolute inset-0 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3) 0%, rgba(34, 211, 238, 0.3) 50%, rgba(253, 224, 71, 0.2) 100%)',
                mixBlendMode: 'overlay',
                maskImage: 'url(/uploads/trees-20.png)',
                WebkitMaskImage: 'url(/uploads/trees-20.png)',
                maskSize: 'contain',
                WebkitMaskSize: 'contain',
                maskRepeat: 'no-repeat',
                WebkitMaskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskPosition: 'center',
              }}
              animate={{
                background: [
                  'linear-gradient(135deg, rgba(168, 85, 247, 0.35) 0%, rgba(34, 211, 238, 0.25) 50%, rgba(253, 224, 71, 0.2) 100%)',
                  'linear-gradient(135deg, rgba(34, 211, 238, 0.35) 0%, rgba(253, 224, 71, 0.25) 50%, rgba(168, 85, 247, 0.2) 100%)',
                  'linear-gradient(135deg, rgba(253, 224, 71, 0.35) 0%, rgba(168, 85, 247, 0.25) 50%, rgba(34, 211, 238, 0.2) 100%)',
                  'linear-gradient(135deg, rgba(168, 85, 247, 0.35) 0%, rgba(34, 211, 238, 0.25) 50%, rgba(253, 224, 71, 0.2) 100%)',
                ],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
        </motion.div>
      </Link>
    );
  }
);
TreeWithEffects.displayName = 'TreeWithEffects';
