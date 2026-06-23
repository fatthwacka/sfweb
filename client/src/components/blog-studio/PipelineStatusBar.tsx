/**
 * PipelineStatusBar - Visual indicator showing the 3-stage content pipeline
 * [Input Sources (n)] → [Blog Editor] → [Outputs (n active)]
 */

import { ArrowRight, Database, Edit3, Send } from 'lucide-react';
import { useBlogStudio } from './BlogStudioProvider';

export function PipelineStatusBar() {
  const { pipelineState, showInputPanel, setShowInputPanel, showOutputPanel, setShowOutputPanel } = useBlogStudio();

  return (
    <div className="blog-studio-pipeline-bar">
      <button
        onClick={() => setShowInputPanel(!showInputPanel)}
        className={`blog-studio-pipeline-stage ${showInputPanel ? 'active' : ''}`}
      >
        <Database className="w-3.5 h-3.5" />
        <span>Input Sources</span>
        <span className="blog-studio-pipeline-count">
          {pipelineState.activeInputSources}/{pipelineState.inputSourcesCount}
        </span>
      </button>

      <ArrowRight className="w-4 h-4 text-gray-500" />

      <div className="blog-studio-pipeline-stage active editor">
        <Edit3 className="w-3.5 h-3.5" />
        <span>Blog Editor</span>
      </div>

      <ArrowRight className="w-4 h-4 text-gray-500" />

      <button
        onClick={() => setShowOutputPanel(!showOutputPanel)}
        className={`blog-studio-pipeline-stage ${showOutputPanel ? 'active' : ''}`}
      >
        <Send className="w-3.5 h-3.5" />
        <span>Output</span>
        <span className="blog-studio-pipeline-count">
          {pipelineState.activeOutputDestinations}/{pipelineState.outputDestinationsCount}
        </span>
      </button>
    </div>
  );
}
