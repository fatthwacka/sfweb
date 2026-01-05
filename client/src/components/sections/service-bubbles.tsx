import { motion } from "framer-motion";
import { Camera, Video, Globe, Bot, Brain } from "lucide-react";
import { Link } from "wouter";

interface ServiceBubble {
  id: string;
  label: string;
  icon: React.ReactNode;
  link: string;
  side: 'left' | 'right';
}

const serviceBubbles: ServiceBubble[] = [
  {
    id: 'photo',
    label: 'Photo',
    icon: <Camera className="w-4 h-4" />,
    link: '/photography',
    side: 'left'
  },
  {
    id: 'video', 
    label: 'Video',
    icon: <Video className="w-4 h-4" />,
    link: '/videography',
    side: 'left'
  },
  {
    id: 'web-apps',
    label: 'Web',
    icon: <Globe className="w-4 h-4" />,
    link: '/web-apps',
    side: 'right'
  },
  {
    id: 'ai-bots',
    label: 'AI Apps', 
    icon: <Bot className="w-4 h-4" />,
    link: '/tools',
    side: 'right'
  }
];

export function ServiceBubbles() {
  return (
    <div className="mb-2 mt-0">
      {/* Desktop: simple centered row */}
      <div className="hidden md:flex items-center justify-center gap-4 max-w-4xl mx-auto py-12">
        {serviceBubbles.map((service, index) => (
          <ServiceBubble key={service.id} service={service} index={index} />
        ))}
      </div>

      {/* Mobile/Tablet: centered with overflow for sparkles */}
      <div className="md:hidden overflow-x-auto scrollbar-hide py-12">
        <div className="flex gap-3 justify-center min-w-full px-4">
          {serviceBubbles.map((service, index) => (
            <ServiceBubble key={service.id} service={service} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

interface ServiceBubbleProps {
  service: ServiceBubble;
  index: number;
}

function ServiceBubble({ service, index }: ServiceBubbleProps) {
  return (
    <Link href={service.link}>
      <motion.div
        className="service-bubble-container relative group cursor-pointer"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, duration: 0.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* External sparkles container */}
        <div className="absolute inset-0 pointer-events-none -m-4">
          {/* External sparkle particles - show on hover */}
          <div className="sparkles opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 bg-purple-300 rounded-full"
                style={{
                  left: `${10 + (i * 12)}%`,
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
            {/* Additional corner sparkles */}
            {[...Array(4)].map((_, i) => (
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

        {/* Main bubble button - with subtle colour hints per service */}
        <div className={`service-bubble px-3 py-2 md:px-5 md:py-2.5 font-barlow font-normal rounded-full transition-all duration-300 text-sm whitespace-nowrap flex-shrink-0 relative overflow-hidden border text-gray-200 hover:border-purple-400/60 hover:bg-gradient-to-r hover:from-purple-900/40 hover:via-indigo-800/30 hover:to-purple-700/40 hover:text-white flex items-center gap-1.5 ${
          service.id === 'photo' ? 'bg-gradient-to-r from-blue-950/30 to-gray-800/65 border-blue-600/60 hover:from-blue-900/50' :
          service.id === 'video' ? 'bg-gradient-to-r from-purple-950/30 to-gray-800/65 border-purple-600/60 hover:from-purple-900/50' :
          service.id === 'web-apps' ? 'bg-gradient-to-r from-green-950/30 to-gray-800/65 border-green-600/60 hover:from-green-900/50' :
          'bg-gradient-to-r from-orange-950/30 to-gray-800/65 border-orange-600/60 hover:from-orange-900/50'
        }`}>
          
          {/* Enhanced shimmer effect - purple streak */}
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
          
          {/* Content */}
          <div className="relative z-10 flex items-center gap-2">
            {service.icon}
            <span>{service.label}</span>
          </div>
        </div>
        
        {/* Enhanced glow effect on hover */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/30 to-indigo-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg -z-10" />
      </motion.div>
    </Link>
  );
}