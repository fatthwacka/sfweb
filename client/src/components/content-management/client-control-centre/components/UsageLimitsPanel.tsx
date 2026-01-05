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

interface UsageLimitsPanelProps {
  client: ContentClient;
}

export default function UsageLimitsPanel({ client }: UsageLimitsPanelProps) {
  return (
    <div className="space-y-3 p-4 bg-gray-700 border border-gray-600 rounded-lg">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-salmon mb-2">Usage & Limits</h2>
        <p className="text-sm text-gray-400">Monitor generation usage and manage client limitations</p>
      </div>
      
      <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Monthly Usage */}
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-gray-300">Monthly Usage</p>
              <div className="w-full bg-gray-600 rounded-md h-2">
                <div className="w-[68%] bg-salmon h-full rounded-md"></div>
              </div>
              <p className="text-xs text-gray-400">
                $142.50 / $200.00
              </p>
            </div>

            {/* Content Pieces */}
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-gray-300">Content Pieces</p>
              <p className="text-xl font-semibold text-white">24 / 50</p>
              <p className="text-xs text-gray-400">This month</p>
            </div>

            {/* Video Generation */}
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-gray-300">Video Generation</p>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  (client as any).generation_limits?.video_enabled 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {(client as any).generation_limits?.video_enabled ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>
              <p className="text-xs text-gray-400">3 videos this month</p>
            </div>

            {/* Voice Generation */}
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-gray-300">Voice Generation</p>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  (client as any).generation_limits?.voice_enabled 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {(client as any).generation_limits?.voice_enabled ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>
              <p className="text-xs text-gray-400">1.2 hours generated</p>
            </div>
          </div>

        <div className="mt-6 pt-4 border-t border-gray-600">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm border border-gray-600">
              Adjust Limits
            </button>
            <button className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm border border-gray-600">
              Usage History
            </button>
            <button className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm border border-gray-600">
              Billing Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}