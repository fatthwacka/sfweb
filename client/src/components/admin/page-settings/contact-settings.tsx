import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Code } from 'lucide-react';

export function ContactSettings() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
          <Code className="w-5 h-5 text-cyan-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Contact Information</h2>
          <p className="text-gray-400">Contact information is now hardcoded</p>
        </div>
      </div>

      {/* Simple Notice Card */}
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Code className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <h3 className="text-blue-400 font-medium mb-2">Contact Management Changed</h3>
              <p className="text-gray-300 text-sm mb-3">
                Contact information is now managed directly in the application code.
              </p>
              <div className="space-y-2 text-sm text-gray-300">
                <div><strong>Business:</strong> SlyFox Studios</div>
                <div><strong>Phone:</strong> +27 12 345 6789</div>
                <div><strong>Email:</strong> info@slyfox.co.za</div>
                <div><strong>Location:</strong> Durban, South Africa</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}