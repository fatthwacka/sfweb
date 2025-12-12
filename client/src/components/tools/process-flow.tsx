/**
 * Process Flow Component
 * Reusable visual guide showing tool workflow stages
 * Features numbered steps, active state highlighting, and futuristic spinner
 */

import { cn } from '@/lib/utils';

export interface ProcessStep {
  number: number;
  title: string;
}

interface ProcessFlowProps {
  steps: ProcessStep[];
  currentStep: number;
  isProcessing?: boolean;
  processingText?: string;
  className?: string;
}

/**
 * Futuristic spinner component for loading states
 */
export function FuturisticSpinner({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div className={cn('relative', sizeClasses[size], className)}>
      {/* Outer ring */}
      <div className="absolute inset-0 rounded-full border-2 border-cyan/20" />

      {/* Spinning gradient ring */}
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan border-r-salmon animate-spin" />

      {/* Inner pulse */}
      <div className="absolute inset-2 rounded-full bg-gradient-to-br from-cyan/20 to-salmon/20 animate-pulse" />

      {/* Center dot */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-cyan animate-ping" />
      </div>

      {/* Orbiting dots */}
      <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-salmon" />
      </div>
      <div className="absolute inset-0 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }}>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1 h-1 rounded-full bg-cyan" />
      </div>
    </div>
  );
}

/**
 * Full-page loading overlay with futuristic spinner
 */
export function LoadingOverlay({ text = 'Processing...', subText }: { text?: string; subText?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="text-center">
        <FuturisticSpinner size="lg" className="mx-auto mb-6" />
        <p className="text-white text-lg font-medium">{text}</p>
        {subText && <p className="text-gray-400 text-sm mt-2">{subText}</p>}
      </div>
    </div>
  );
}

/**
 * Process Flow - Compact visual workflow guide (single row)
 */
export function ProcessFlow({ steps, currentStep, isProcessing, processingText, className }: ProcessFlowProps) {
  return (
    <div className={cn('tool-card-gradient border border-white/10 rounded-xl px-4 py-3', className)}>
      {/* Steps - always single row */}
      <div className="flex items-center justify-between gap-2">
        {steps.map((step, index) => {
          const isActive = step.number === currentStep;
          const isCompleted = step.number < currentStep;
          const isPending = step.number > currentStep;

          return (
            <div key={step.number} className="flex items-center flex-1">
              {/* Step */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {/* Number badge */}
                <div
                  className={cn(
                    'relative w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 flex-shrink-0',
                    isActive && 'bg-gradient-to-br from-cyan to-salmon text-white shadow-md shadow-cyan/30',
                    isCompleted && 'bg-green-500/20 text-green-400 border border-green-500/50',
                    isPending && 'bg-white/5 text-gray-500 border border-white/10'
                  )}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.number
                  )}

                  {/* Active glow effect */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-full bg-cyan/30 blur-sm animate-pulse" />
                  )}
                </div>

                {/* Title */}
                <span
                  className={cn(
                    'text-xs font-medium transition-colors duration-300 truncate',
                    isActive && 'text-cyan',
                    isCompleted && 'text-green-400',
                    isPending && 'text-gray-500'
                  )}
                >
                  {step.title}
                </span>

                {/* Processing spinner inline */}
                {isActive && isProcessing && (
                  <FuturisticSpinner size="sm" className="flex-shrink-0" />
                )}
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'w-4 sm:w-6 lg:w-8 h-px mx-1 transition-all duration-300 flex-shrink-0',
                    step.number < currentStep && 'bg-green-500/50',
                    step.number === currentStep && 'bg-cyan/50',
                    step.number > currentStep && 'bg-white/10'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Processing status text - compact */}
      {isProcessing && processingText && (
        <div className="mt-2 text-center">
          <p className="text-cyan text-xs animate-pulse">{processingText}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Default process steps for file tools
 */
export const DEFAULT_FILE_TOOL_STEPS: ProcessStep[] = [
  { number: 1, title: 'Select Folder' },
  { number: 2, title: 'Scan' },
  { number: 3, title: 'Review' },
  { number: 4, title: 'Execute' },
];

export default ProcessFlow;
