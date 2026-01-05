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

interface ClientMetricsProps {
  client: ContentClient;
}

export default function ClientMetrics({ client }: ClientMetricsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="text-center p-3 bg-gray-800 rounded-lg border border-gray-600">
        <div className="text-2xl mb-2">🎯</div>
        <p className="text-sm text-gray-400">BRAND PROFILE</p>
        <p className="text-lg font-semibold text-white">v{(client as any).client_brand_profiles?.[0]?.version || '3'}</p>
      </div>
      
      <div className="text-center p-3 bg-gray-800 rounded-lg border border-gray-600">
        <div className="text-2xl mb-2">📊</div>
        <p className="text-sm text-gray-400">CONTENT GENERATED</p>
        <p className="text-lg font-semibold text-white">24</p>
      </div>
      
      <div className="text-center p-3 bg-gray-800 rounded-lg border border-gray-600">
        <div className="text-2xl mb-2">💸</div>
        <p className="text-sm text-gray-400">THIS MONTH</p>
        <p className="text-lg font-semibold text-white">
          ${(client as any).generation_limits?.current_month_spend?.toFixed(2) || '0.00'}
        </p>
      </div>
      
      <div className="text-center p-3 bg-gray-800 rounded-lg border border-gray-600">
        <div className="text-2xl mb-2">⚡</div>
        <p className="text-sm text-gray-400">GENERATION RATE</p>
        <p className="text-lg font-semibold text-white">2.3/day</p>
      </div>
    </div>
  );
}