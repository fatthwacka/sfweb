/**
 * FeedbackPanel - Inline comprehensive feedback collection for social content
 *
 * Architecture:
 * - NOT a modal - designed to sit as a dedicated panel in the page layout
 * - Fully expanded by default (no multi-stage process)
 * - Summary section: Overall rating + common issues + optional text (for quick feedback)
 * - Per-section feedback: Hook, Body, CTA, Hashtags each with rating + issues + text
 * - Efficient: Users can give summary-only OR detailed per-section feedback
 * - All ratings 1-9 scale for skill evolution compatibility
 */

import { useState, useCallback } from 'react';
import { ChevronDown, ChevronUp, Send, Loader2, Undo2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

type SectionKey = 'hook' | 'body' | 'cta' | 'hashtags';

interface SectionFeedback {
  score: number | null;  // 1-9
  issues: string[];      // Selected quick issues
  otherText: string;     // Custom feedback text
}

interface FeedbackData {
  summary: {
    score: number | null;
    issues: string[];
    otherText: string;
  };
  sections: Record<SectionKey, SectionFeedback>;
}

interface ContentSections {
  hook: string;
  bodyHeader: string;
  body: string;
  cta: string;
  hashtags: string;
}

interface FeedbackPanelProps {
  contentId: string | null;
  sections?: ContentSections;  // Current (possibly modified) content for hybrid tracking
  onFeedbackSubmit?: () => void;
  disabled?: boolean;
}

// Rating emoji scale (1-9)
const RATING_OPTIONS = [
  { value: 1, emoji: '😤', label: 'Terrible' },
  { value: 2, emoji: '😞', label: 'Poor' },
  { value: 3, emoji: '😕', label: 'Bad' },
  { value: 4, emoji: '😐', label: 'Below Avg' },
  { value: 5, emoji: '🙂', label: 'Average' },
  { value: 6, emoji: '😊', label: 'Above Avg' },
  { value: 7, emoji: '👍', label: 'Good' },
  { value: 8, emoji: '🎯', label: 'Great' },
  { value: 9, emoji: '❤️', label: 'Perfect' },
];

// Common issues by section type
const SECTION_ISSUES: Record<SectionKey | 'summary', string[]> = {
  summary: [
    'Off-brand',
    'Wrong tone',
    'Too generic',
    'Not engaging',
    'Wrong audience',
    'Too salesy',
    'Needs polish',
  ],
  hook: [
    'Not attention-grabbing',
    'Too long',
    'Too short',
    'Wrong tone',
    'Cliche/overused',
    'Weak opener',
  ],
  body: [
    'Too wordy',
    'Too brief',
    'Unclear message',
    'Wrong tone',
    'Not valuable',
    'Bad structure',
  ],
  cta: [
    'Too pushy',
    'Too weak',
    'Unclear action',
    'Wrong tone',
    'Not compelling',
    'Generic',
  ],
  hashtags: [
    'Too many',
    'Too few',
    'Irrelevant',
    'Too generic',
    'Missing key tags',
    'Wrong audience',
  ],
};

const SECTION_LABELS: Record<SectionKey, string> = {
  hook: 'Hook',
  body: 'Body',
  cta: 'Call to Action',
  hashtags: 'Hashtags',
};

// Score selector component
function ScoreSelector({
  value,
  onChange
}: {
  value: number | null;
  onChange: (score: number) => void;
}) {
  return (
    <div className="flex gap-1 flex-wrap">
      {RATING_OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          title={`${option.value} - ${option.label}`}
          className={`
            w-8 h-8 rounded-lg text-lg transition-all duration-150
            ${value === option.value
              ? 'bg-purple-500/40 ring-2 ring-purple-400 scale-110'
              : 'bg-[#1a1a2e] hover:bg-[#252540]'
            }
          `}
        >
          {option.emoji}
        </button>
      ))}
    </div>
  );
}

// Issue chips component
function IssueChips({
  issues,
  selected,
  onToggle,
}: {
  issues: string[];
  selected: string[];
  onToggle: (issue: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {issues.map((issue) => {
        const isSelected = selected.includes(issue);
        return (
          <button
            key={issue}
            onClick={() => onToggle(issue)}
            className={`
              px-2.5 py-1 text-xs rounded-full transition-colors
              ${isSelected
                ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                : 'bg-gray-700 text-gray-400 border border-gray-600 hover:border-gray-500'
              }
            `}
          >
            {issue}
          </button>
        );
      })}
    </div>
  );
}

// Section feedback component
function SectionFeedbackBlock({
  sectionKey,
  label,
  feedback,
  onUpdate,
  defaultExpanded = false,
}: {
  sectionKey: SectionKey;
  label: string;
  feedback: SectionFeedback;
  onUpdate: (updates: Partial<SectionFeedback>) => void;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [showOther, setShowOther] = useState(feedback.otherText.length > 0);

  const hasInput = feedback.score !== null || feedback.issues.length > 0 || feedback.otherText.length > 0;

  const toggleIssue = (issue: string) => {
    const newIssues = feedback.issues.includes(issue)
      ? feedback.issues.filter(i => i !== issue)
      : [...feedback.issues, issue];
    onUpdate({ issues: newIssues });
  };

  return (
    <div className={`border rounded-lg transition-colors ${
      hasInput ? 'border-purple-500/30 bg-purple-500/5' : 'border-gray-700 bg-gray-800/50'
    }`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-300">{label}</span>
          {hasInput && (
            <span className="text-xs text-purple-400">
              {feedback.score && `${feedback.score}/9`}
              {feedback.issues.length > 0 && ` • ${feedback.issues.length} issues`}
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3">
          {/* Score */}
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Score (optional)</label>
            <ScoreSelector
              value={feedback.score}
              onChange={(score) => onUpdate({ score })}
            />
          </div>

          {/* Quick issues */}
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Quick feedback (click to select)</label>
            <IssueChips
              issues={SECTION_ISSUES[sectionKey]}
              selected={feedback.issues}
              onToggle={toggleIssue}
            />
          </div>

          {/* Other toggle + text */}
          <div>
            <button
              onClick={() => setShowOther(!showOther)}
              className={`text-xs transition-colors ${
                showOther ? 'text-purple-400' : 'text-gray-500 hover:text-gray-400'
              }`}
            >
              {showOther ? '− Hide' : '+ Add'} specific feedback
            </button>

            {showOther && (
              <Textarea
                value={feedback.otherText}
                onChange={(e) => onUpdate({ otherText: e.target.value })}
                placeholder={`What specifically about the ${label.toLowerCase()}?`}
                className="mt-2 min-h-[60px] bg-gray-900 border-gray-700 text-sm"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function FeedbackPanel({ contentId, sections, onFeedbackSubmit, disabled = false }: FeedbackPanelProps) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionCount, setSubmissionCount] = useState(0);  // Track iterations for training
  const [showSections, setShowSections] = useState(false);
  const [showSummaryOther, setShowSummaryOther] = useState(false);
  const [undoTimeout, setUndoTimeout] = useState<NodeJS.Timeout | null>(null);

  const [feedbackData, setFeedbackData] = useState<FeedbackData>({
    summary: {
      score: null,
      issues: [],
      otherText: '',
    },
    sections: {
      hook: { score: null, issues: [], otherText: '' },
      body: { score: null, issues: [], otherText: '' },
      cta: { score: null, issues: [], otherText: '' },
      hashtags: { score: null, issues: [], otherText: '' },
    },
  });

  const resetForm = useCallback(() => {
    setFeedbackData({
      summary: { score: null, issues: [], otherText: '' },
      sections: {
        hook: { score: null, issues: [], otherText: '' },
        body: { score: null, issues: [], otherText: '' },
        cta: { score: null, issues: [], otherText: '' },
        hashtags: { score: null, issues: [], otherText: '' },
      },
    });
    setShowSections(false);
    setShowSummaryOther(false);
  }, []);

  const updateSummary = useCallback((updates: Partial<typeof feedbackData.summary>) => {
    setFeedbackData(prev => ({
      ...prev,
      summary: { ...prev.summary, ...updates },
    }));
  }, []);

  const updateSection = useCallback((section: SectionKey, updates: Partial<SectionFeedback>) => {
    setFeedbackData(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        [section]: { ...prev.sections[section], ...updates },
      },
    }));
  }, []);

  const toggleSummaryIssue = (issue: string) => {
    const newIssues = feedbackData.summary.issues.includes(issue)
      ? feedbackData.summary.issues.filter(i => i !== issue)
      : [...feedbackData.summary.issues, issue];
    updateSummary({ issues: newIssues });
  };

  const hasSummaryFeedback = feedbackData.summary.score !== null ||
    feedbackData.summary.issues.length > 0 ||
    feedbackData.summary.otherText.length > 0;

  const hasSectionFeedback = Object.values(feedbackData.sections).some(
    s => s.score !== null || s.issues.length > 0 || s.otherText.length > 0
  );

  const canSubmit = hasSummaryFeedback || hasSectionFeedback;

  const handleUndo = useCallback(() => {
    if (undoTimeout) {
      clearTimeout(undoTimeout);
      setUndoTimeout(null);
    }
    setSubmitted(false);
    // Keep the form data so user can modify and resubmit
  }, [undoTimeout]);

  const handleSubmit = async () => {
    if (!canSubmit || !contentId) return;

    setSubmitting(true);
    const iterationNumber = submissionCount + 1;

    try {
      const response = await fetch('/api/social-content/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId,
          iterationNumber,  // Track which iteration this is (1st, 2nd, 3rd rating)
          // Include current sections content for hybrid tracking (original vs modified)
          finalContent: sections ? {
            hook: sections.hook,
            bodyHeader: sections.bodyHeader,
            body: sections.body,
            cta: sections.cta,
            hashtags: sections.hashtags,
          } : undefined,
          detailedFeedback: {
            summary: feedbackData.summary,
            sectionRatings: {
              hook: feedbackData.sections.hook.score,
              body: feedbackData.sections.body.score,
              cta: feedbackData.sections.cta.score,
              hashtags: feedbackData.sections.hashtags.score,
            },
            sectionIssues: {
              hook: feedbackData.sections.hook.issues,
              body: feedbackData.sections.body.issues,
              cta: feedbackData.sections.cta.issues,
              hashtags: feedbackData.sections.hashtags.issues,
            },
            sectionComments: {
              hook: feedbackData.sections.hook.otherText,
              body: feedbackData.sections.body.otherText,
              cta: feedbackData.sections.cta.otherText,
              hashtags: feedbackData.sections.hashtags.otherText,
            },
            tags: feedbackData.summary.issues,
            comment: feedbackData.summary.otherText,
          },
          // Also set quick feedback from summary for backward compatibility
          quickFeedback: feedbackData.summary.score ? {
            rating: feedbackData.summary.score >= 8 ? 'excellent' :
                    feedbackData.summary.score >= 6 ? 'good' :
                    feedbackData.summary.score >= 4 ? 'neutral' : 'poor',
            issue: feedbackData.summary.issues[0] || undefined,
          } : undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit feedback');

      setSubmitted(true);
      setSubmissionCount(iterationNumber);  // Increment after successful submission
      onFeedbackSubmit?.();

      // Auto-reset after 10 seconds
      const timeout = setTimeout(() => {
        setSubmitted(false);
        resetForm();
        setUndoTimeout(null);
      }, 10000);
      setUndoTimeout(timeout);

    } catch (error) {
      console.error('Feedback submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // No content yet
  if (!contentId) {
    return (
      <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
        <div className="text-center text-gray-500 text-sm py-6">
          Generate content above to provide feedback
        </div>
      </div>
    );
  }

  // Submitted state - allow re-rating for iterative training
  if (submitted) {
    const scoreLabel = feedbackData.summary.score
      ? RATING_OPTIONS.find(r => r.value === feedbackData.summary.score)
      : null;

    return (
      <div className="p-4 bg-gradient-to-r from-green-500/10 to-gray-800/50 border border-green-500/30 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-green-400 text-lg">✓</span>
            <div>
              <span className="text-sm text-green-400 font-medium">
                Feedback #{submissionCount} saved
              </span>
              {scoreLabel && (
                <span className="text-sm text-gray-400 ml-2">
                  {scoreLabel.emoji} {scoreLabel.label}
                </span>
              )}
              {feedbackData.summary.issues.length > 0 && (
                <span className="text-xs text-gray-500 ml-2">
                  • {feedbackData.summary.issues.length} issues noted
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (undoTimeout) clearTimeout(undoTimeout);
                setUndoTimeout(null);
                setSubmitted(false);
                // Keep form data for iterative refinement
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 rounded transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              Rate Again
            </button>
            <button
              onClick={handleUndo}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 rounded transition-colors"
            >
              <Undo2 className="h-3 w-3" />
              Undo
            </button>
          </div>
        </div>
        {submissionCount > 1 && (
          <p className="text-xs text-gray-500 mt-2">
            💡 Iterative ratings help train the AI. Edit content above, then rate again to show what works better.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={`p-4 bg-gray-800/50 border border-gray-700 rounded-lg space-y-4 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <Label className="text-sm text-purple-400 font-medium">Rate This Content</Label>
        <span className="text-xs text-gray-500">
          {hasSummaryFeedback && 'Overall '}
          {hasSummaryFeedback && hasSectionFeedback && '+ '}
          {hasSectionFeedback && 'Sections '}
          {!canSubmit && 'Select rating or issues to submit'}
        </span>
      </div>

      {/* Summary Section - Always visible */}
      <div className="space-y-3">
        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">Overall Rating</h3>

        {/* Overall Score */}
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">
            How good was this content? (1-9)
          </label>
          <ScoreSelector
            value={feedbackData.summary.score}
            onChange={(score) => updateSummary({ score })}
          />
        </div>

        {/* Summary Quick Issues */}
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">
            Quick feedback (click to select multiple)
          </label>
          <IssueChips
            issues={SECTION_ISSUES.summary}
            selected={feedbackData.summary.issues}
            onToggle={toggleSummaryIssue}
          />
        </div>

        {/* Summary Other */}
        <div>
          <button
            onClick={() => setShowSummaryOther(!showSummaryOther)}
            className={`text-xs transition-colors ${
              showSummaryOther ? 'text-purple-400' : 'text-gray-500 hover:text-gray-400'
            }`}
          >
            {showSummaryOther ? '− Hide' : '+ Add'} specific comments
          </button>

          {showSummaryOther && (
            <Textarea
              value={feedbackData.summary.otherText}
              onChange={(e) => updateSummary({ otherText: e.target.value })}
              placeholder="Any other feedback about the overall content?"
              className="mt-2 min-h-[80px] bg-gray-900 border-gray-700 text-sm"
            />
          )}
        </div>
      </div>

      {/* Section Toggle */}
      <div className="pt-2 border-t border-gray-700">
        <button
          onClick={() => setShowSections(!showSections)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
        >
          {showSections ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          {showSections ? 'Hide' : 'Show'} per-section feedback
          <span className="text-xs text-gray-600">(optional, for detailed improvement)</span>
        </button>
      </div>

      {/* Per-Section Feedback */}
      {showSections && (
        <div className="space-y-2">
          {(Object.keys(SECTION_LABELS) as SectionKey[]).map((key) => (
            <SectionFeedbackBlock
              key={key}
              sectionKey={key}
              label={SECTION_LABELS[key]}
              feedback={feedbackData.sections[key]}
              onUpdate={(updates) => updateSection(key, updates)}
            />
          ))}
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-3 border-t border-gray-700">
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-40"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Submit Feedback
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default FeedbackPanel;
