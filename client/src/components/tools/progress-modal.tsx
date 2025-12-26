import React from 'react';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

interface ProgressModalProps {
  isOpen: boolean;
  progressStage: string;
  isCompleted: boolean;
  hasError: boolean;
}

export function ProgressModal({ isOpen, progressStage, isCompleted, hasError }: ProgressModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-xl p-8 max-w-md w-full mx-4 border border-slate-700 shadow-2xl">
        <div className="text-center space-y-6">
          {/* Status Icon */}
          <div className="flex justify-center">
            {hasError ? (
              <div className="h-16 w-16 rounded-full bg-red-500/20 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            ) : isCompleted ? (
              <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            ) : (
              <div className="relative">
                <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center animate-pulse">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                </div>
                <div className="absolute -top-2 -right-2 h-6 w-6 bg-green-400 rounded-full animate-ping"></div>
              </div>
            )}
          </div>

          {/* Progress Message */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {hasError ? 'Content Creation Failed' : isCompleted ? 'Content Creation Completed!' : 'AI Content Engine Working'}
            </h3>
            <p className="text-lg text-slate-300 font-medium mb-1">
              {progressStage || 'Initializing AI Content Engine...'}
            </p>
            <p className="text-sm text-slate-400">
              {hasError 
                ? 'Something went wrong during content creation'
                : isCompleted 
                  ? 'Your professional content has been generated and saved'
                  : 'Creating engaging content optimized for maximum impact'
              }
            </p>
          </div>

          {/* Progress Bar */}
          {!isCompleted && !hasError && (
            <div className="w-full bg-slate-700 rounded-full h-3">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-1000 animate-pulse" 
                   style={{ width: '75%' }}>
              </div>
            </div>
          )}

          {/* Process Steps */}
          {!isCompleted && !hasError && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-slate-300 bg-slate-800/50 rounded-lg p-2">
                <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Content Analysis</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300 bg-slate-800/50 rounded-lg p-2">
                <div className="h-2 w-2 bg-yellow-400 rounded-full animate-pulse"></div>
                <span>Image Processing</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300 bg-slate-800/50 rounded-lg p-2">
                <div className="h-2 w-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span>AI Generation</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300 bg-slate-800/50 rounded-lg p-2">
                <div className="h-2 w-2 bg-purple-400 rounded-full animate-pulse"></div>
                <span>Quality Check</span>
              </div>
            </div>
          )}

          {/* Completion Message */}
          {isCompleted && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <p className="text-green-400 text-sm">
                ✨ Professional articles generated and saved to your content library
              </p>
            </div>
          )}

          {/* Error Message */}
          {hasError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400 text-sm">
                ❌ Please try again or contact support if the issue persists
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}