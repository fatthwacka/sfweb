// Example: Slyfox Frontend Integration with Modified n8n Webhook
// This demonstrates how to call the modified workflow from the Slyfox admin interface

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface ContentGenerationResult {
  success: boolean;
  content?: {
    title: string;
    summary: string;
    extractedText: string;
    images: string[];
    generatedContent: string;
  };
  error?: string;
}

export function ContentRipperTool() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ContentGenerationResult | null>(null);

  const handleRipContent = async () => {
    if (!url) {
      toast.error('Please enter a URL');
      return;
    }

    if (!url.startsWith('http')) {
      toast.error('Please enter a valid URL starting with http:// or https://');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Call the modified n8n workflow webhook
      const response = await fetch('http://168.231.86.89:5678/webhook/rip-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setResult(data);
        toast.success('Content generated successfully!');
      } else {
        throw new Error(data.error || 'Failed to generate content');
      }

    } catch (error) {
      console.error('Error calling n8n workflow:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate content');
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow-sm border">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">AI Content Generator</h3>
        <p className="text-sm text-muted-foreground">
          Extract content from any webpage and generate AI-enhanced articles using Gemini
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="https://example.com/article-to-extract"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
            className="flex-1"
          />
          <Button 
            onClick={handleRipContent}
            disabled={loading || !url}
          >
            {loading ? 'Generating...' : 'Rip & Generate'}
          </Button>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
            Processing content with AI... This may take a few minutes.
          </div>
        )}
      </div>

      {result && (
        <div className="space-y-4 border-t pt-4">
          {result.success && result.content ? (
            <>
              <div className="space-y-2">
                <h4 className="font-medium text-green-700">✅ Content Generated Successfully</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Generated Title:</label>
                    <p className="text-sm bg-gray-50 p-2 rounded">{result.content.title}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Summary:</label>
                    <p className="text-sm bg-gray-50 p-2 rounded">{result.content.summary}</p>
                  </div>

                  {result.content.images && result.content.images.length > 0 && (
                    <div>
                      <label className="text-sm font-medium">Extracted Images:</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                        {result.content.images.map((img, idx) => (
                          <img 
                            key={idx} 
                            src={img} 
                            alt={`Extracted ${idx + 1}`}
                            className="w-full h-20 object-cover rounded border"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium">AI-Generated Content:</label>
                    <div className="text-sm bg-gray-50 p-3 rounded max-h-60 overflow-y-auto">
                      <pre className="whitespace-pre-wrap">{result.content.generatedContent}</pre>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Copy Content
                    </Button>
                    <Button variant="outline" size="sm">
                      Save as Draft
                    </Button>
                    <Button size="sm">
                      Publish to Blog
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-red-600">
              <h4 className="font-medium">❌ Error</h4>
              <p className="text-sm">{result.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Alternative: Backend proxy approach (recommended for production)
// This would go in your Express server routes

/*
// server/routes.ts - Add this route
app.post('/api/n8n/rip-content', async (req, res) => {
  const { url } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Valid URL is required' });
  }

  try {
    // Proxy to n8n webhook with error handling
    const response = await fetch('http://168.231.86.89:5678/webhook/rip-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
      timeout: 300000, // 5 minute timeout for long-running workflow
    });

    if (!response.ok) {
      throw new Error(`n8n workflow failed: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('n8n workflow error:', error);
    res.status(500).json({
      error: 'Failed to process content',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Then in frontend, call:
// fetch('/api/n8n/rip-content', { method: 'POST', body: JSON.stringify({ url }) })
*/