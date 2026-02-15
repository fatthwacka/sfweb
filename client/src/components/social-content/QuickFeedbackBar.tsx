/**
 * QuickFeedbackBar - Entry point for content feedback
 *
 * Two modes:
 * 1. Quick mode: Click emoji for instant 1-click rating (excellent/good/neutral/poor)
 * 2. Detailed mode: Click "More feedback" to open comprehensive FeedbackPanel
 *
 * Features:
 * - 4 emoji icons for quick rating
 * - Opens FeedbackPanel for detailed per-section feedback
 * - 10-second undo functionality
 * - Submits feedback to backend
 */

import { useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import FeedbackPanel from './FeedbackPanel';

type QuickRating = 'excellent' | 'good' | 'neutral' | 'poor';

interface QuickFeedbackBarProps {
  contentId: string | null;
  onFeedbackSubmit?: (rating: QuickRating, issue?: string) => void;
  disabled?: boolean;
}

const RATING_CONFIG = {
  excellent: { icon: '❤️', label: 'Excellent', score: 9, tooltip: 'Perfect - would publish as-is' },
  good: { icon: '👍', label: 'Good', score: 7, tooltip: 'Good - minor tweaks needed' },
  neutral: { icon: '😐', label: 'Neutral', score: 5, tooltip: 'OK - needs work' },
  poor: { icon: '👎', label: 'Poor', score: 2, tooltip: 'Poor - wouldn\'t use' }
} as const;

export function QuickFeedbackBar({
  contentId,
  onFeedbackSubmit,
  disabled = false
}: QuickFeedbackBarProps) {
  const [selectedRating, setSelectedRating] = useState<QuickRating | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [undoTimeout, setUndoTimeout] = useState<NodeJS.Timeout | null>(null);
  const [previousRating, setPreviousRating] = useState<QuickRating | null>(null);
  const [showDetailedPanel, setShowDetailedPanel] = useState(false);
  const [detailedSubmitted, setDetailedSubmitted] = useState(false);

  const handleRatingClick = async (rating: QuickRating) => {
    if (disabled || !contentId || submitting) return;

    setSelectedRating(rating);
    setSubmitting(true);

    try {
      const response = await fetch('/api/social-content/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId,
          quickFeedback: {
            rating,
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      // Store for potential undo
      setPreviousRating(rating);
      setSubmitted(true);

      // Notify parent
      onFeedbackSubmit?.(rating);

      // Start 10-second undo timer
      const timeout = setTimeout(() => {
        setSubmitted(false);
        setPreviousRating(null);
        setUndoTimeout(null);
      }, 10000);
      setUndoTimeout(timeout);

    } catch (error) {
      console.error('Failed to submit feedback:', error);
      setSelectedRating(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUndo = () => {
    if (undoTimeout) {
      clearTimeout(undoTimeout);
      setUndoTimeout(null);
    }
    setSubmitted(false);
    setDetailedSubmitted(false);
    setSelectedRating(null);
    setPreviousRating(null);
  };

  const handleDetailedSubmit = () => {
    setDetailedSubmitted(true);
    setSubmitted(true);
    setShowDetailedPanel(false);
    onFeedbackSubmit?.('good'); // Generic callback

    // Auto-dismiss after 10 seconds
    const timeout = setTimeout(() => {
      setSubmitted(false);
      setDetailedSubmitted(false);
      setUndoTimeout(null);
    }, 10000);
    setUndoTimeout(timeout);
  };

  // Submitted state - show confirmation with undo
  if (submitted) {
    const config = previousRating ? RATING_CONFIG[previousRating] : null;
    return (
      <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-green-500/10 to-transparent rounded-lg border border-green-500/30">
        <span className="text-sm text-green-400">
          {config ? `${config.icon} Feedback saved` : '✓ Detailed feedback saved'}
        </span>
        <button
          onClick={handleUndo}
          className="text-xs text-blue-400 hover:text-blue-300 underline transition-colors"
        >
          Undo (10s)
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-3 flex-wrap">
        {/* Quick rating buttons */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Rate:</span>

          {(Object.entries(RATING_CONFIG) as [QuickRating, typeof RATING_CONFIG[QuickRating]][]).map(
            ([rating, config]) => (
              <button
                key={rating}
                onClick={() => handleRatingClick(rating)}
                disabled={disabled || !contentId || submitting}
                title={config.tooltip}
                className={`
                  px-2.5 py-1.5 rounded-lg text-lg transition-all duration-200
                  ${selectedRating === rating
                    ? 'bg-purple-500/30 ring-2 ring-purple-400 scale-110'
                    : 'bg-[#1a1a2e] hover:bg-[#252540]'
                  }
                  ${(disabled || !contentId) ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {config.icon}
              </button>
            )
          )}
        </div>

        {/* Detailed feedback button */}
        <button
          onClick={() => setShowDetailedPanel(true)}
          disabled={disabled || !contentId}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
            bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white
            transition-colors
            ${(disabled || !contentId) ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <MessageSquarePlus className="h-3.5 w-3.5" />
          More feedback
        </button>
      </div>

      {/* Detailed Feedback Panel */}
      {showDetailedPanel && contentId && (
        <FeedbackPanel
          contentId={contentId}
          onClose={() => setShowDetailedPanel(false)}
          onSubmit={handleDetailedSubmit}
        />
      )}
    </>
  );
}

export default QuickFeedbackBar;
