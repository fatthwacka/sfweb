import React from 'react';

// Homepage section editors
export { HeroSectionEditor } from './hero-section-editor';
export { ServicesOverviewEditor } from './services-overview-editor';

// Placeholder exports for remaining sections
// These will be implemented in the next phase

export function PortfolioShowcaseEditor({ onChange, onSave }: { onChange: (data: any) => void; onSave: () => void }) {
  return (
    <div className="p-8 text-center text-gray-400 border-2 border-dashed border-gray-600 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Portfolio Showcase Editor</h3>
      <p className="text-sm">Integration with existing featured work system coming soon...</p>
      <p className="text-xs mt-2">This will combine your current gallery selection with enhanced styling controls.</p>
    </div>
  );
}

export function ClientAccessEditor({ onChange, onSave }: { onChange: (data: any) => void; onSave: () => void }) {
  return (
    <div className="p-8 text-center text-gray-400 border-2 border-dashed border-gray-600 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Client Gallery Access Editor</h3>
      <p className="text-sm">Client portal section customization coming soon...</p>
    </div>
  );
}

export function TestimonialsEditor({ onChange, onSave }: { onChange: (data: any) => void; onSave: () => void }) {
  return (
    <div className="p-8 text-center text-gray-400 border-2 border-dashed border-gray-600 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Testimonials Editor</h3>
      <p className="text-sm">Testimonials management coming soon...</p>
    </div>
  );
}

export function ContactSectionEditor({ onChange, onSave }: { onChange: (data: any) => void; onSave: () => void }) {
  return (
    <div className="p-8 text-center text-gray-400 border-2 border-dashed border-gray-600 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Contact Section Editor</h3>
      <p className="text-sm">Contact form and business info customization coming soon...</p>
    </div>
  );
}

export function PageSEOEditor({ onChange, onSave }: { onChange: (data: any) => void; onSave: () => void }) {
  return (
    <div className="p-8 text-center text-gray-400 border-2 border-dashed border-gray-600 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Page SEO Editor</h3>
      <p className="text-sm">SEO settings and meta tag management coming soon...</p>
    </div>
  );
}