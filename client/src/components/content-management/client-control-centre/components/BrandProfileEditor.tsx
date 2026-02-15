import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface BrandProfile {
  id: string;
  client_id?: string;
  // Basic info fields
  brand_description?: string;
  industry_segment?: string;
  products_services?: string;
  content_focus_options?: string[];
  
  // AI enhancement fields
  business_niche?: string;
  color_personality?: string;
  visual_mood?: string;
  target_audience?: string;
  priority_benefits?: string[];
  secondary_benefits?: string[];
  positive_examples?: string[];
  prohibited_terms?: string[];
  
  // Content Guidelines fields
  language?: string;
  region?: string;
  spelling?: string;
  
  voice_tone?: {
    creative: boolean;
    technical: boolean;
    approachable: boolean;
    professional: boolean;
    friendly: boolean;
    authoritative: boolean;
    casual: boolean;
    formal: boolean;
    playful: boolean;
    serious: boolean;
    innovative: boolean;
    traditional: boolean;
  };
  voice_rules?: {
    tone: string;
    humor: string;
    sentence_length: string;
  };
  visual_rules?: {
    style: string;
    primary_color: string;
  };
  
  // Content strategy
  key_messages?: string[];
  forbidden_phrases?: string[];
  preferred_terminology?: Record<string, string>;
  content_themes?: string[];
  target_audience_description?: string;
  content_length_preferences?: Record<string, any>;
  
  // Visual identity
  primary_color?: string;
  secondary_colors?: string[];
  logo_url?: string | null;
  visual_style_notes?: string | null;
  
  // Performance data
  top_performing_content_types?: string[];
  successful_hooks?: string[];
  content_to_avoid?: string[];
  approved_examples?: string[];
  negative_examples?: string[];
  platform_rules?: Record<string, any>;
  
  // Metadata
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface BrandProfileEditorProps {
  clientId: string;
  brandProfile: BrandProfile;
  isOpen: boolean;
  onClose: () => void;
}

export default function BrandProfileEditor({ 
  clientId, 
  brandProfile, 
  isOpen, 
  onClose 
}: BrandProfileEditorProps) {
  const [formData, setFormData] = useState<BrandProfile>(brandProfile);
  const queryClient = useQueryClient();

  // Standardized CSS classes for consistent styling
  const fieldClasses = {
    // Standard input field styling
    input: "flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 text-sm",
    // UNIFIED form element class for identical sizing
    formElement: "w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 text-sm h-8",
    // Unified textarea class
    textarea: "w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 text-sm resize-none",
    // Standard array field container
    arrayContainer: "space-y-2 min-h-[60px]",
    // Standard array item row
    arrayRow: "flex gap-2",
    // Standard section column with minimum height
    sectionColumn: "space-y-3 min-h-[100px]",
    // Standard two-column grid with explicit grid definition
    twoColumnGrid: "grid grid-cols-1 lg:grid-cols-2 gap-6 w-full",
    // Standard label styling
    label: "text-xs font-medium text-gray-400",
    // Standard add button
    addButton: "px-2 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded text-xs",
    // Improved delete button (grey background, red text)
    deleteButton: "px-2 py-1 bg-gray-600 hover:bg-gray-500 text-red-400 rounded text-xs",
    // Standard section header
    sectionHeader: "flex justify-between items-center mb-2"
  };

  // Update form data when brand profile prop changes - SIMPLIFIED
  useEffect(() => {
    // Extract industry_segment from notes field if it exists (products_services now has own column)
    let extractedIndustrySegment = '';
    let cleanedNotes = brandProfile.notes || '';
    
    if (brandProfile.notes && brandProfile.notes.startsWith('Industry: ')) {
      const lines = brandProfile.notes.split('\n');
      const industryLine = lines[0];
      if (industryLine.startsWith('Industry: ')) {
        extractedIndustrySegment = industryLine.replace('Industry: ', '');
        // Remove the industry line from notes
        cleanedNotes = lines.slice(1).join('\n').replace(/^\n+/, ''); // Remove leading newlines
      }
    }
    
    console.log('🔧 Extracting industry_segment from notes (products_services now has own column):');
    console.log('📝 Original notes:', brandProfile.notes);
    console.log('🏭 Extracted industry_segment:', extractedIndustrySegment);
    console.log('📦 Direct products_services:', brandProfile.products_services);
    console.log('✨ Cleaned notes:', cleanedNotes);
    
    // Direct mapping with safe defaults for optional fields
    setFormData({
      ...brandProfile,
      // Fix industry_segment extraction from notes, products_services comes directly from DB
      industry_segment: extractedIndustrySegment,
      products_services: brandProfile.products_services || '',
      notes: cleanedNotes,
      // Ensure array fields have defaults
      key_messages: brandProfile.key_messages || [],
      forbidden_phrases: brandProfile.forbidden_phrases || [],
      priority_benefits: brandProfile.priority_benefits || [],
      secondary_benefits: brandProfile.secondary_benefits || [],
      positive_examples: brandProfile.positive_examples || [],
      negative_examples: brandProfile.negative_examples || [],
      content_themes: brandProfile.content_themes || [],
      secondary_colors: brandProfile.secondary_colors || [],
      content_focus_options: brandProfile.content_focus_options || [],
      // Ensure voice_rules has default structure
      voice_rules: brandProfile.voice_rules || {
        tone: '',
        humor: 'minimal',
        sentence_length: 'medium'
      },
      // Ensure visual_rules has default structure  
      visual_rules: brandProfile.visual_rules || {
        style: '',
        primary_color: ''
      },
      // Ensure voice_tone has default structure
      voice_tone: brandProfile.voice_tone || {
        creative: false,
        technical: false,
        approachable: false,
        professional: false,
        friendly: false,
        authoritative: false,
        casual: false,
        formal: false,
        playful: false,
        serious: false,
        innovative: false,
        traditional: false
      }
    });
  }, [brandProfile]);

  // Save brand profile mutation
  const saveBrandProfile = useMutation({
    mutationFn: async (data: Partial<BrandProfile>) => {
      console.log('🌐 Starting fetch request to:', `/api/content-management/brand-intelligence/clients/${clientId}/brand-profile`);
      console.log('🔍 DEBUGGING: products_services field value:', data.products_services);
      console.log('📦 Request payload:', JSON.stringify(data, null, 2));
      
      const response = await fetch(`/api/content-management/brand-intelligence/clients/${clientId}/brand-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      console.log('📡 Fetch response received:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API error response:', errorText);
        throw new Error(`Failed to save brand profile: ${response.status} ${errorText}`);
      }
      
      const result = await response.json();
      console.log('✅ API success response:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('✅ Mutation success:', data);
      queryClient.invalidateQueries({ queryKey: ['content-client', clientId] });
      onClose();
    },
    onError: (error) => {
      console.error('❌ Mutation error:', error);
      // Don't close the modal on error so user can retry
    },
  });

  const handleSave = () => {
    console.log('🔄 Saving brand profile data:', formData);
    console.log('📝 Form data keys:', Object.keys(formData));
    saveBrandProfile.mutate(formData);
  };

  const handleInputChange = (field: keyof BrandProfile, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleVoiceToneChange = (tone: keyof BrandProfile['voice_tone'], value: boolean) => {
    setFormData(prev => ({
      ...prev,
      voice_tone: {
        ...prev.voice_tone,
        [tone]: value
      }
    }));
  };

  const handleArrayFieldChange = (field: keyof BrandProfile, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[] || []).map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field: keyof BrandProfile) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] as string[] || []), '']
    }));
  };

  const removeArrayItem = (field: keyof BrandProfile, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[] || []).filter((_, i) => i !== index)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-700 border border-gray-600 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <h2 className="text-2xl font-semibold text-salmon">Brand Profile Editor</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold"
          >
            ×
          </button>
        </div>
        
        <div className="p-6">
          <div className="space-y-6">
            

            {/* Basic Info - Two Column */}
            <div className="space-y-3 p-4 bg-gray-800 border border-gray-600 rounded-lg">
              <h3 className="text-lg font-semibold text-salmon mb-3">Business Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 block mb-2">Industry Segment</label>
                  <input
                    value={formData.industry_segment || ''}
                    onChange={(e) => handleInputChange('industry_segment', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400"
                    placeholder="e.g., Photography & Videography, Technology, Healthcare"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-300 block mb-2">Business Niche</label>
                  <input
                    value={formData.business_niche || ''}
                    onChange={(e) => handleInputChange('business_niche', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400"
                    placeholder="e.g., luxury wedding photography, corporate videography"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-300 block mb-2">Products & Services</label>
                <textarea
                  value={formData.products_services || ''}
                  onChange={(e) => handleInputChange('products_services', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400"
                  rows={3}
                  placeholder="List your main products and services..."
                />
              </div>
            </div>

            {/* Content Focus Options */}
            <div className="space-y-3 p-4 bg-gray-800 border border-gray-600 rounded-lg">
              <div className={fieldClasses.sectionHeader}>
                <div>
                  <h3 className="text-lg font-semibold text-salmon">Content Focus Options</h3>
                  <p className="text-xs text-gray-400 mt-1">Categories that appear as pill buttons in Social Content Generator</p>
                </div>
                <button
                  type="button"
                  onClick={() => addArrayItem('content_focus_options')}
                  className={fieldClasses.addButton}
                >
                  + Add Focus
                </button>
              </div>
              <div className={fieldClasses.arrayContainer}>
                {(formData.content_focus_options || []).map((option, index) => (
                  <div key={index} className={fieldClasses.arrayRow}>
                    <input
                      value={option}
                      onChange={(e) => handleArrayFieldChange('content_focus_options', index, e.target.value)}
                      className={fieldClasses.input}
                      placeholder="e.g., weddings, portraits, achievements, pain points"
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem('content_focus_options', index)}
                      className={fieldClasses.deleteButton}
                    >
                      ×
                    </button>
                  </div>
                ))}
                {(formData.content_focus_options || []).length === 0 && (
                  <p className="text-gray-500 text-sm italic">No content focus options defined. Add categories relevant to this brand's content.</p>
                )}
              </div>
            </div>


            {/* Voice Guidelines & Target Audience - Reorganized */}
            <div className="space-y-3 p-4 bg-gray-800 border border-gray-600 rounded-lg">
              <h3 className="text-lg font-semibold text-salmon mb-3">Voice Guidelines & Target Audience</h3>
              
              {/* Target Audience Description - Full Width */}
              <div className="mb-4">
                <label className={fieldClasses.label} style={{marginBottom: '8px', display: 'block'}}>Target Audience Description</label>
                <textarea
                  value={formData.target_audience_description}
                  onChange={(e) => handleInputChange('target_audience_description', e.target.value)}
                  className={fieldClasses.input + " w-full h-20"}
                  placeholder="Describe your ideal customer demographics, psychographics, and needs..."
                />
              </div>

              {/* Two Column Layout for Voice Guidelines and Language Settings */}
              <div className={fieldClasses.twoColumnGrid}>
                {/* Voice Guidelines - Left Column */}
                <div className={fieldClasses.sectionColumn}>
                  <label className={fieldClasses.label} style={{marginBottom: '12px', display: 'block'}}>Voice Guidelines</label>
                  <div className="space-y-3">
                    <div>
                      <label className={fieldClasses.label} style={{marginBottom: '4px', display: 'block'}}>Overall Tone</label>
                      <input
                        value={formData.voice_rules.tone}
                        onChange={(e) => handleInputChange('voice_rules', { ...formData.voice_rules, tone: e.target.value })}
                        className={fieldClasses.formElement}
                        placeholder="e.g., professional, approachable"
                      />
                    </div>
                    <div>
                      <label className={fieldClasses.label} style={{marginBottom: '4px', display: 'block'}}>Humor Level</label>
                      <select
                        value={formData.voice_rules.humor}
                        onChange={(e) => handleInputChange('voice_rules', { ...formData.voice_rules, humor: e.target.value })}
                        className={fieldClasses.formElement}
                      >
                        <option value="none">No Humor</option>
                        <option value="minimal">Minimal</option>
                        <option value="moderate">Moderate</option>
                        <option value="playful">Playful</option>
                      </select>
                    </div>
                    <div>
                      <label className={fieldClasses.label} style={{marginBottom: '4px', display: 'block'}}>Sentence Length</label>
                      <select
                        value={formData.voice_rules.sentence_length}
                        onChange={(e) => handleInputChange('voice_rules', { ...formData.voice_rules, sentence_length: e.target.value })}
                        className={fieldClasses.formElement}
                      >
                        <option value="short">Short & Punchy</option>
                        <option value="medium">Medium</option>
                        <option value="long">Long & Detailed</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Language & Style Guidelines - Right Column */}
                <div className={fieldClasses.sectionColumn}>
                  <label className={fieldClasses.label} style={{marginBottom: '12px', display: 'block'}}>Language & Style Guidelines</label>
                  <div className="space-y-3">
                    <div>
                      <label className={fieldClasses.label} style={{marginBottom: '4px', display: 'block'}}>Language</label>
                      <select
                        value={formData.language || 'english'}
                        onChange={(e) => handleInputChange('language', e.target.value)}
                        className={fieldClasses.formElement}
                      >
                        <option value="english">English</option>
                        <option value="spanish">Spanish</option>
                        <option value="french">French</option>
                        <option value="german">German</option>
                        <option value="italian">Italian</option>
                        <option value="portuguese">Portuguese</option>
                      </select>
                    </div>
                    <div>
                      <label className={fieldClasses.label} style={{marginBottom: '4px', display: 'block'}}>Region</label>
                      <select
                        value={formData.region || 'global'}
                        onChange={(e) => handleInputChange('region', e.target.value)}
                        className={fieldClasses.formElement}
                      >
                        <option value="global">Global</option>
                        <option value="us">United States</option>
                        <option value="uk">United Kingdom</option>
                        <option value="ca">Canada</option>
                        <option value="au">Australia</option>
                        <option value="sa">South Africa</option>
                        <option value="nz">New Zealand</option>
                      </select>
                    </div>
                    <div>
                      <label className={fieldClasses.label} style={{marginBottom: '4px', display: 'block'}}>Spelling</label>
                      <select
                        value={formData.spelling || 'british'}
                        onChange={(e) => handleInputChange('spelling', e.target.value)}
                        className={fieldClasses.formElement}
                      >
                        <option value="british">British English</option>
                        <option value="american">American English</option>
                        <option value="canadian">Canadian English</option>
                        <option value="australian">Australian English</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>


            {/* Visual Style */}
            <div className="space-y-3 p-4 bg-gray-800 border border-gray-600 rounded-lg">
              <h3 className="text-lg font-semibold text-salmon mb-3">Visual Style</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={fieldClasses.label} style={{marginBottom: '8px', display: 'block'}}>Visual Style Description</label>
                  <input
                    value={formData.visual_style_notes || formData.visual_rules?.style || ''}
                    onChange={(e) => handleInputChange('visual_style_notes', e.target.value)}
                    className={fieldClasses.formElement}
                    placeholder="e.g., modern, clean, minimalist, elegant, bold"
                  />
                </div>

                <div>
                  <label className={fieldClasses.label} style={{marginBottom: '8px', display: 'block'}}>Color Personality</label>
                  <input
                    value={formData.color_personality || ''}
                    onChange={(e) => handleInputChange('color_personality', e.target.value)}
                    className={fieldClasses.formElement}
                    placeholder="e.g., warm and inviting, bold and confident"
                  />
                </div>

                <div>
                  <label className={fieldClasses.label} style={{marginBottom: '8px', display: 'block'}}>Visual Mood</label>
                  <input
                    value={formData.visual_mood || ''}
                    onChange={(e) => handleInputChange('visual_mood', e.target.value)}
                    className={fieldClasses.formElement}
                    placeholder="e.g., elegant and romantic, modern and dynamic"
                  />
                </div>
              </div>
            </div>

            {/* Content Strategy & Benefits - Standardized Layout */}
            <div className="space-y-3 p-4 bg-gray-800 border border-gray-600 rounded-lg">
              <h3 className="text-lg font-semibold text-salmon mb-3">Content Strategy & Benefits</h3>
              <div className={fieldClasses.twoColumnGrid}>
                {/* Priority Benefits */}
                <div className={fieldClasses.sectionColumn}>
                  <div className={fieldClasses.sectionHeader}>
                    <label className={fieldClasses.label}>Priority Benefits</label>
                    <button 
                      type="button"
                      onClick={() => addArrayItem('priority_benefits')}
                      className={fieldClasses.addButton}
                    >
                      + Priority
                    </button>
                  </div>
                  <div className={fieldClasses.arrayContainer}>
                    {(formData.priority_benefits || []).map((benefit, index) => (
                      <div key={index} className={fieldClasses.arrayRow}>
                        <input
                          value={benefit}
                          onChange={(e) => handleArrayFieldChange('priority_benefits', index, e.target.value)}
                          className={fieldClasses.input}
                          placeholder="e.g., exceptional quality, creative storytelling"
                        />
                        <button
                          type="button"
                          onClick={() => removeArrayItem('priority_benefits', index)}
                          className={fieldClasses.deleteButton}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Secondary Benefits */}
                <div className={fieldClasses.sectionColumn}>
                  <div className={fieldClasses.sectionHeader}>
                    <label className={fieldClasses.label}>Secondary Benefits</label>
                    <button 
                      type="button"
                      onClick={() => addArrayItem('secondary_benefits')}
                      className={fieldClasses.addButton}
                    >
                      + Secondary
                    </button>
                  </div>
                  <div className={fieldClasses.arrayContainer}>
                    {(formData.secondary_benefits || []).map((benefit, index) => (
                      <div key={index} className={fieldClasses.arrayRow}>
                        <input
                          value={benefit}
                          onChange={(e) => handleArrayFieldChange('secondary_benefits', index, e.target.value)}
                          className={fieldClasses.input}
                          placeholder="e.g., competitive pricing, quick turnaround"
                        />
                        <button
                          type="button"
                          onClick={() => removeArrayItem('secondary_benefits', index)}
                          className={fieldClasses.deleteButton}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
            </div>

            {/* Content Examples - Standardized Layout */}
            <div className="space-y-3 p-4 bg-gray-800 border border-gray-600 rounded-lg">
              <h3 className="text-lg font-semibold text-salmon mb-3">Content Examples</h3>
              <div className={fieldClasses.twoColumnGrid}>
                {/* Positive Examples */}
                <div className={fieldClasses.sectionColumn}>
                  <div className={fieldClasses.sectionHeader}>
                    <label className={fieldClasses.label}>Positive Examples</label>
                    <button 
                      type="button"
                      onClick={() => addArrayItem('positive_examples')}
                      className={fieldClasses.addButton}
                    >
                      + Example
                    </button>
                  </div>
                  <div className={fieldClasses.arrayContainer}>
                    {(formData.positive_examples || []).map((example, index) => (
                      <div key={index} className={fieldClasses.arrayRow}>
                        <input
                          value={example}
                          onChange={(e) => handleArrayFieldChange('positive_examples', index, e.target.value)}
                          className={fieldClasses.input}
                          placeholder="e.g., successful content patterns"
                        />
                        <button
                          type="button"
                          onClick={() => removeArrayItem('positive_examples', index)}
                          className={fieldClasses.deleteButton}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Negative Examples */}
                <div className={fieldClasses.sectionColumn}>
                  <div className={fieldClasses.sectionHeader}>
                    <label className={fieldClasses.label}>Negative Examples</label>
                    <button 
                      type="button"
                      onClick={() => addArrayItem('negative_examples')}
                      className={fieldClasses.addButton}
                    >
                      + Example
                    </button>
                  </div>
                  <div className={fieldClasses.arrayContainer}>
                    {(formData.negative_examples || []).map((example, index) => (
                      <div key={index} className={fieldClasses.arrayRow}>
                        <input
                          value={example}
                          onChange={(e) => handleArrayFieldChange('negative_examples', index, e.target.value)}
                          className={fieldClasses.input}
                          placeholder="e.g., content approaches to avoid"
                        />
                        <button
                          type="button"
                          onClick={() => removeArrayItem('negative_examples', index)}
                          className={fieldClasses.deleteButton}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Phrase Guidelines - Reorganized Layout */}
            <div className="space-y-3 p-4 bg-gray-800 border border-gray-600 rounded-lg">
              <h3 className="text-lg font-semibold text-salmon mb-3">Phrase Guidelines</h3>
              <div className={fieldClasses.twoColumnGrid}>
                {/* Key Messages - Left Column */}
                <div className={fieldClasses.sectionColumn}>
                  <div className={fieldClasses.sectionHeader}>
                    <label className={fieldClasses.label}>Key Messages</label>
                    <button 
                      type="button"
                      onClick={() => addArrayItem('key_messages')}
                      className={fieldClasses.addButton}
                    >
                      + Message
                    </button>
                  </div>
                  <div className={fieldClasses.arrayContainer}>
                    {formData.key_messages.map((message, index) => (
                      <div key={index} className={fieldClasses.arrayRow}>
                        <input
                          value={message}
                          onChange={(e) => handleArrayFieldChange('key_messages', index, e.target.value)}
                          className={fieldClasses.input}
                          placeholder="Enter key brand message..."
                        />
                        <button
                          type="button"
                          onClick={() => removeArrayItem('key_messages', index)}
                          className={fieldClasses.deleteButton}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Forbidden Phrases - Right Column */}
                <div className={fieldClasses.sectionColumn}>
                  <div className={fieldClasses.sectionHeader}>
                    <label className={fieldClasses.label}>Forbidden Phrases</label>
                    <button 
                      type="button"
                      onClick={() => addArrayItem('forbidden_phrases')}
                      className={fieldClasses.addButton}
                    >
                      + Phrase
                    </button>
                  </div>
                  <div className={fieldClasses.arrayContainer}>
                    {formData.forbidden_phrases.map((phrase, index) => (
                      <div key={index} className={fieldClasses.arrayRow}>
                        <input
                          value={phrase}
                          onChange={(e) => handleArrayFieldChange('forbidden_phrases', index, e.target.value)}
                          className={fieldClasses.input}
                          placeholder="Words/phrases to avoid..."
                        />
                        <button
                          type="button"
                          onClick={() => removeArrayItem('forbidden_phrases', index)}
                          className={fieldClasses.deleteButton}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>


          </div>
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-600">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded border border-gray-500"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={saveBrandProfile.isPending}
          >
            {saveBrandProfile.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}