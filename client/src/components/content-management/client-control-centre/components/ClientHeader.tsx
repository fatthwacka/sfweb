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

interface ClientHeaderProps {
  client: ContentClient;
  onBack: () => void;
}

export default function ClientHeader({ client, onBack }: ClientHeaderProps) {
  return (
    <div className="mb-8">
      {/* Back Button Row */}
      <div className="mb-4">
        <button 
          onClick={onBack}
          className="bg-gray-200 text-gray-700 font-light hover:bg-white hover:text-gray-900 px-3 py-1 rounded"
          title="Back to Dashboard"
        >
          ← Back
        </button>
      </div>
      
      {/* Header Content Row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-salmon">Control Centre: {client.name}</h1>
          <p className="text-xl text-muted-foreground mt-2">
            Brand intelligence and content generation controls
          </p>
        </div>
        <div className="flex gap-3">
          <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg border border-gray-600">
            Edit Brand Profile
          </button>
          <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg">
            Generate Content
          </button>
        </div>
      </div>
    </div>
  );
}