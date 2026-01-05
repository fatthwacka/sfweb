import React from 'react';

interface ContentClient {
  id: string;
  name: string;
  slug: string;
  email?: string;
  website_url?: string;
  industry?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ContentGenerationPanelProps {
  client: ContentClient;
}

export default function ContentGenerationPanel({ client }: ContentGenerationPanelProps) {
  return (
    <div className="space-y-3 p-4 bg-gray-700 border border-gray-600 rounded-lg">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-salmon mb-2">Content Generation</h2>
        <p className="text-sm text-gray-400">AI content creation workflows and generation controls</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quick Generate */}
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-600 flex flex-col h-full">
          <div className="text-center mb-3 flex-grow">
            <div className="text-2xl mb-2">🚀</div>
            <h3 className="text-lg font-semibold text-cyan mb-1">Quick Generate</h3>
            <p className="text-xs text-gray-400">Generate content using existing brand profile</p>
          </div>
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm mt-auto">
            Start Generation
          </button>
        </div>

        {/* Batch Processing */}
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-600 flex flex-col h-full">
          <div className="text-center mb-3 flex-grow">
            <div className="text-2xl mb-2">📊</div>
            <h3 className="text-lg font-semibold text-cyan mb-1">Batch Processing</h3>
            <p className="text-xs text-gray-400">Generate multiple content pieces simultaneously</p>
          </div>
          <button className="w-full bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm border border-gray-600 mt-auto">
            Setup Batch
          </button>
        </div>

        {/* Scheduled Content */}
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-600 flex flex-col h-full">
          <div className="text-center mb-3 flex-grow">
            <div className="text-2xl mb-2">📅</div>
            <h3 className="text-lg font-semibold text-cyan mb-1">Schedule Content</h3>
            <p className="text-xs text-gray-400">Plan and automate content generation</p>
          </div>
          <button className="w-full bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm border border-gray-600 mt-auto">
            View Schedule
          </button>
        </div>
      </div>
    </div>
  );
}