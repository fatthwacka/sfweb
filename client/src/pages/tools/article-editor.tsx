/**
 * Article Editor - Web-based Airtable Article Editor
 * Converts the working mini_apps_tools/airtable.html to use site UI components
 * Uses client-side Airtable operations for maximum reliability (like the HTML version)
 */

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Upload, ArrowLeft, ArrowRight } from 'lucide-react';

import { Navigation } from '@/components/layout/navigation';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Types (matching the HTML version exactly)
interface AirtableArticle {
  id: string;
  'Article Number'?: number;
  Headline?: string;
  Hook?: string;
  Content?: string;
  'Focus Angle'?: string;
  'Image Placement'?: string;
  'Image URL'?: string;
  Status?: string;
  Client?: string;
  'Source Title'?: string;
  'Generated Date'?: string;
  Hashtags?: string;
  [key: string]: any;
}

interface AirtableConfig {
  airtable: {
    token: string;
    baseId: string;
    tableId: string;
  };
  imgbb: {
    apiKey: string;
  };
}

interface Filters {
  status: string;
  client: string;
  sourceTitle: string;
}

export default function ArticleEditor() {
  // State (matching HTML version)
  const [articles, setArticles] = useState<AirtableArticle[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentArticle, setCurrentArticle] = useState<AirtableArticle | null>(null);
  const [isModified, setIsModified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [jumpToNumber, setJumpToNumber] = useState('');
  const [initialLoad, setInitialLoad] = useState(true);

  // Configuration state
  const [config, setConfig] = useState<AirtableConfig | null>(null);
  
  // Dynamic filter options (from ALL articles, not filtered)
  const [availableClients, setAvailableClients] = useState<string[]>([]);
  const [availableSourceTitles, setAvailableSourceTitles] = useState<string[]>([]);
  const [allArticles, setAllArticles] = useState<AirtableArticle[]>([]); // Unfiltered articles for option extraction
  
  // Filters (matching HTML version)
  const [filters, setFilters] = useState<Filters>({
    status: 'All',
    client: 'All',
    sourceTitle: 'All'
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(0);

  // Load configuration on mount
  useEffect(() => {
    loadConfiguration();
  }, []);

  // Fetch all articles once to populate filter options
  useEffect(() => {
    if (config && allArticles.length === 0) {
      fetchAllArticlesForOptions();
    }
  }, [config]);

  // Fetch filtered articles when filters change (matching HTML logic)
  useEffect(() => {
    if (config) {
      fetchArticles();
    }
  }, [filters, config]);

  // Apply search filtering to ALL articles (not just filtered ones) - search ALL fields
  const filteredArticles = searchQuery.trim() 
    ? allArticles.filter(article => {
        const searchLower = searchQuery.toLowerCase();
        // Search through ALL article fields
        return Object.values(article).some(value => 
          value && typeof value === 'string' && 
          value.toLowerCase().includes(searchLower)
        ) || 
        // Also search article number
        (article['Article Number'] && 
         article['Article Number'].toString().includes(searchQuery.trim()));
      })
    : articles;

  // Update navigation to use filtered articles
  const displayArticles = filteredArticles;
  const displayCurrentIndex = searchQuery.trim() 
    ? selectedSearchIndex
    : currentIndex;
  const displayCurrentArticle = searchQuery.trim()
    ? (displayArticles.length > selectedSearchIndex ? displayArticles[selectedSearchIndex] : null)
    : currentArticle;

  // Reset search selection when query changes
  useEffect(() => {
    setSelectedSearchIndex(0);
  }, [searchQuery]);

  // Search navigation functions
  const handleSearchPrev = () => {
    if (selectedSearchIndex > 0) {
      setSelectedSearchIndex(selectedSearchIndex - 1);
    }
  };

  const handleSearchNext = () => {
    if (selectedSearchIndex < displayArticles.length - 1) {
      setSelectedSearchIndex(selectedSearchIndex + 1);
    }
  };

  const selectSearchResult = (index: number) => {
    setSelectedSearchIndex(index);
  };

  const loadConfiguration = async () => {
    try {
      // For now, use a simple auth token (enhance later with proper auth)
      const response = await fetch('/api/airtable/config', {
        headers: {
          'Authorization': 'Bearer temp-token' // TODO: Replace with real auth
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load configuration');
      }

      const configData = await response.json();
      setConfig(configData);
    } catch (err) {
      console.error('Configuration error:', err);
      setError('Failed to load configuration. Please check your permissions.');
    }
  };

  // Fetch all articles (no filters) to populate filter dropdowns - handle pagination
  const fetchAllArticlesForOptions = async () => {
    if (!config) return;

    try {
      let allRecords: any[] = [];
      let offset: string | undefined = undefined;

      // Fetch all pages of results
      do {
        let url = `https://api.airtable.com/v0/${config.airtable.baseId}/${config.airtable.tableId}`;
        const urlParams = new URLSearchParams();

        // Add sorting by most recent first
        urlParams.append('sort[0][field]', 'Generated Date');
        urlParams.append('sort[0][direction]', 'desc');
        
        // Add offset if we have one (pagination)
        if (offset) {
          urlParams.append('offset', offset);
        }

        url += `?${urlParams.toString()}`;

        // Direct client-side fetch to get ALL articles
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${config.airtable.token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          console.warn(`Failed to fetch all articles for options: ${response.status}`);
          return;
        }

        const data = await response.json();
        allRecords = allRecords.concat(data.records);
        offset = data.offset; // Airtable provides offset for next page
        
        console.log(`Fetched ${data.records.length} articles, total: ${allRecords.length}, has more: ${!!offset}`);
      } while (offset);

      const formattedArticles = allRecords.map((record: any) => ({
        id: record.id,
        ...record.fields
      }));

      // Store all articles for option extraction
      setAllArticles(formattedArticles);

      // Extract unique clients from ALL articles
      const uniqueClients = Array.from(new Set(
        formattedArticles
          .map(article => article.Client)
          .filter(client => client && client.trim() !== '')
      )).sort();
      setAvailableClients(uniqueClients);

      // Extract unique source titles from ALL articles
      const uniqueSourceTitles = Array.from(new Set(
        formattedArticles
          .map(article => article['Source Title'])
          .filter(title => title && title.trim() !== '')
      )).sort();
      setAvailableSourceTitles(uniqueSourceTitles);

      console.log('Filter options populated:', {
        clients: uniqueClients,
        sourceTitles: uniqueSourceTitles.length,
        totalArticles: formattedArticles.length
      });

    } catch (err: any) {
      console.warn('Failed to load filter options:', err.message);
    }
  };

  // Fetch articles (direct client-side call like HTML version) - handle pagination
  const fetchArticles = async () => {
    if (!config) return;

    try {
      setLoading(true);
      setError(null);
      
      // Build filter formula (exact same logic as HTML)
      const filterConditions = [];
      if (filters.status !== 'All') {
        filterConditions.push(`{Status}='${filters.status}'`);
      }
      if (filters.client !== 'All') {
        filterConditions.push(`{Client}='${filters.client}'`);
      }
      if (filters.sourceTitle !== 'All') {
        filterConditions.push(`{Source Title}='${filters.sourceTitle}'`);
      }
      
      console.log('Applied filters:', { filters, filterConditions });
      
      let allRecords: any[] = [];
      let offset: string | undefined = undefined;

      // Fetch all pages of filtered results
      do {
        let url = `https://api.airtable.com/v0/${config.airtable.baseId}/${config.airtable.tableId}`;
        const urlParams = new URLSearchParams();

        // Add sorting by most recent first (matching HTML)
        urlParams.append('sort[0][field]', 'Generated Date');
        urlParams.append('sort[0][direction]', 'desc');

        if (filterConditions.length > 0) {
          const filterFormula = filterConditions.length === 1 
            ? filterConditions[0]
            : `AND(${filterConditions.join(',')})`;
          urlParams.append('filterByFormula', filterFormula);
        }
        
        // Add offset if we have one (pagination)
        if (offset) {
          urlParams.append('offset', offset);
        }

        url += `?${urlParams.toString()}`;

        // Direct client-side fetch (exactly like HTML version)
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${config.airtable.token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch articles: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        allRecords = allRecords.concat(data.records);
        offset = data.offset; // Airtable provides offset for next page
        
        console.log(`Fetched ${data.records.length} filtered articles, total: ${allRecords.length}, has more: ${!!offset}`);
      } while (offset);

      const formattedArticles = allRecords.map((record: any) => ({
        id: record.id,
        ...record.fields
      }));

      if (formattedArticles.length === 0) {
        // Handle empty results (same logic as HTML)
        if (initialLoad) {
          setError('No articles found with default filters. Showing all articles.');
          setFilters({ status: 'All', client: 'All', sourceTitle: 'All' });            
          setInitialLoad(false);
          return;
        } else {
          setError('No articles found matching current filters. Try adjusting your filter settings.');
          if (articles.length === 0) {
            setArticles([]);
            setCurrentArticle(null);
            setCurrentIndex(0);
          }
        }
      } else {
        setArticles(formattedArticles);
        setCurrentArticle({...formattedArticles[0]});
        setCurrentIndex(0);
        setInitialLoad(false);
      }
    } catch (err: any) {
      setError(`Failed to load articles: ${err.message}`);
      console.error('Error fetching articles:', err);
    } finally {
      setLoading(false);
    }
  };

  // Navigation functions (matching HTML logic)
  const goToArticle = (index: number) => {
    if (index >= 0 && index < articles.length) {
      setCurrentIndex(index);
      setCurrentArticle({...articles[index]});
      setIsModified(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      goToArticle(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < articles.length - 1) {
      goToArticle(currentIndex + 1);
    }
  };

  const handleJumpToArticle = () => {
    const articleNumber = parseInt(jumpToNumber);
    if (!articleNumber || articleNumber < 1) {
      setError('Please enter a valid article number');
      return;
    }

    const targetArticle = articles.find(article => article['Article Number'] === articleNumber);
    if (!targetArticle) {
      setError(`Article ${articleNumber} not found`);
      return;
    }

    const targetIndex = articles.findIndex(article => article['Article Number'] === articleNumber);
    goToArticle(targetIndex);
    setJumpToNumber('');
    setError(null);
  };

  // Field change handler
  const handleFieldChange = (field: string, value: string) => {
    setCurrentArticle(prev => prev ? {
      ...prev,
      [field]: value
    } : null);
    setIsModified(true);
  };

  // Filter change handler
  const handleFilterChange = (filterType: keyof Filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Image upload functionality (matching HTML version exactly)
  const uploadImageToImgBB = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    
    if (!config?.imgbb?.apiKey) {
      throw new Error('ImgBB API key not configured');
    }
    
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${config.imgbb.apiKey}`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload image to ImgBB');
    }
    
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error?.message || 'Upload failed');
    }
    
    return data.data.url;
  };

  // Image compression function
  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        const maxDimension = 1920;
        let { width, height } = img;
        
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Failed to compress image'));
          }
        }, 'image/jpeg', 0.8); // 80% quality
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }
    
    if (file.size > 20 * 1024 * 1024) {
      setError('Image must be less than 20MB');
      return;
    }
    
    try {
      setUploadingImage(true);
      setError(null);
      
      // Compress image if it's large
      let processedFile = file;
      if (file.size > 500 * 1024) { // Compress if > 500KB
        console.log(`Compressing image from ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        processedFile = await compressImage(file);
        console.log(`Compressed to ${(processedFile.size / 1024).toFixed(2)}KB`);
      }
      
      const imageUrl = await uploadImageToImgBB(processedFile);
      handleFieldChange('Image URL', imageUrl);
      
      console.log('Image uploaded successfully:', imageUrl);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(`Failed to upload image: ${err.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleImageUpload(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleImageUpload(files[0]);
    }
  };

  // Save article (mimicking HTML version exactly)
  const saveArticle = async (status = 'Edited') => {
    if (!currentArticle?.id || !config) return;

    try {
      const isPublishing = status === 'Published';
      if (isPublishing) {
        setPublishing(true);
      } else {
        setSaving(true);
      }
      setError(null);

      const { id, ...fields } = currentArticle;
      
      // Clean up fields - remove computed/read-only fields and undefined values (matching HTML)
      const cleanFields: any = {};
      const readOnlyFields = ['Article Number', 'Generated Date'];
      
      Object.keys(fields).forEach(key => {
        if (fields[key] !== undefined && 
            fields[key] !== null && 
            !readOnlyFields.includes(key)) {
          cleanFields[key] = fields[key];
        }
      });

      // Add status update
      cleanFields['Status'] = status;
      
      console.log('Starting save process...');
      console.log('Saving fields:', cleanFields);
      
      // Direct client-side PATCH (exactly like HTML version)
      const response = await fetch(`https://api.airtable.com/v0/${config.airtable.baseId}/${config.airtable.tableId}/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${config.airtable.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: cleanFields
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Save error response:', errorData);
        throw new Error(`Failed to save article: ${response.status} ${response.statusText} - ${errorData}`);
      }

      const updatedRecord = await response.json();
      console.log('Save successful!');
      
      // Update local state
      const updatedArticles = articles.map(article => 
        article.id === id ? { id: updatedRecord.id, ...updatedRecord.fields } : article
      );
      setArticles(updatedArticles);
      setCurrentArticle({ id: updatedRecord.id, ...updatedRecord.fields });
      setIsModified(false);

      // Show success feedback
      if (isPublishing) {
        setPublishSuccess(true);
        setTimeout(() => {
          setPublishSuccess(false);
        }, 2000);
      } else {
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
        }, 2000);
      }

    } catch (err: any) {
      console.error('Save failed with error:', err);
      setError(`Failed to ${status === 'Published' ? 'publish' : 'save'} article: ${err.message}`);
    } finally {
      setSaving(false);
      setPublishing(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Navigation />
        <div className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-white text-lg">Loading articles...</span>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Error state (when no articles and error)
  if (error && articles.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Navigation />
        <div className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="bg-slate-800/50 border-slate-600 backdrop-blur-sm max-w-md w-full mx-4">
              <CardContent className="p-6">
                <Alert className="bg-red-900/50 border-red-600 text-red-200 mb-4">
                  <AlertDescription>
                    {error}
                  </AlertDescription>
                </Alert>
                <Button 
                  onClick={fetchArticles}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navigation />
      
      <div className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
        {/* Header with Integrated Filters */}
        <Card className="bg-slate-800/50 border-slate-600 backdrop-blur-sm mb-6">
          <CardHeader>
            <div className="flex flex-col space-y-4">
              {/* Top Row - Title and Navigation */}
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold text-orange-400">Article Editor</CardTitle>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-slate-300">
                    Article {displayCurrentArticle?.['Article Number'] || 'N/A'} | {displayCurrentIndex + 1} of {displayArticles.length}
                    {searchQuery && ` (filtered)`}
                  </span>
                  
                  {/* Jump to article section */}
                  <div className="flex items-center space-x-2">
                    <Label className="text-sm text-slate-300">Jump to:</Label>
                    <Input
                      type="number"
                      value={jumpToNumber}
                      onChange={(e) => setJumpToNumber(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleJumpToArticle();
                        }
                      }}
                      placeholder="#"
                      className="w-16"
                    />
                    <Button
                      onClick={handleJumpToArticle}
                      size="sm"
                    >
                      Go
                    </Button>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={searchQuery ? handleSearchPrev : handlePrev}
                      disabled={searchQuery ? selectedSearchIndex === 0 : currentIndex === 0}
                      variant="outline"
                      size="sm"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={searchQuery ? handleSearchNext : handleNext}
                      disabled={searchQuery ? selectedSearchIndex === displayArticles.length - 1 : currentIndex === articles.length - 1}
                      variant="outline"
                      size="sm"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Bottom Row - Filters and Search */}
              <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-600">
                {/* Search Filter */}
                <div className="flex items-center space-x-2 min-w-0">
                  <Label className="text-sm text-slate-300 whitespace-nowrap">Search:</Label>
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search headlines, content..."
                    className="w-64 min-w-0"
                  />
                  {searchQuery && (
                    <Button
                      onClick={() => setSearchQuery('')}
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-white"
                    >
                      Clear
                    </Button>
                  )}
                </div>

                {/* Status Filter */}
                <div className="flex items-center space-x-2">
                  <Label className="text-sm text-slate-300 whitespace-nowrap">Status:</Label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => handleFilterChange('status', value)}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All</SelectItem>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Published">Published</SelectItem>
                      <SelectItem value="Edited">Edited</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Client Filter */}
                <div className="flex items-center space-x-2">
                  <Label className="text-sm text-slate-300 whitespace-nowrap">Client:</Label>
                  <Select
                    value={filters.client}
                    onValueChange={(value) => handleFilterChange('client', value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All</SelectItem>
                      {availableClients.map(client => (
                        <SelectItem key={client} value={client}>{client}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Source Title Filter */}
                <div className="flex items-center space-x-2">
                  <Label className="text-sm text-slate-300 whitespace-nowrap">Source:</Label>
                  <Select
                    value={filters.sourceTitle}
                    onValueChange={(value) => handleFilterChange('sourceTitle', value)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All</SelectItem>
                      {availableSourceTitles.map(title => (
                        <SelectItem key={title} value={title}>{title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Search Results List */}
        {searchQuery && displayArticles.length > 0 && (
          <Card className="bg-slate-800/50 border-slate-600 backdrop-blur-sm mb-6">
            <CardHeader>
              <CardTitle className="text-lg text-blue-400">
                🔍 Search Results ({displayArticles.length} found)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {displayArticles.map((article, index) => (
                  <div
                    key={article.id}
                    onClick={() => selectSearchResult(index)}
                    className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                      index === selectedSearchIndex 
                        ? 'bg-blue-600/30 border border-blue-500' 
                        : 'bg-slate-700/30 hover:bg-slate-600/50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-orange-400">
                            #{article['Article Number'] || 'N/A'}
                          </span>
                          <span className="text-xs text-slate-400">
                            {article.Client || 'No Client'}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            article.Status === 'Published' ? 'bg-green-600/20 text-green-300' :
                            article.Status === 'Edited' ? 'bg-blue-600/20 text-blue-300' :
                            article.Status === 'Draft' ? 'bg-yellow-600/20 text-yellow-300' :
                            'bg-slate-600/20 text-slate-300'
                          }`}>
                            {article.Status || 'Unknown'}
                          </span>
                        </div>
                        <h4 className="text-sm font-medium text-white truncate">
                          {article.Headline || 'No Headline'}
                        </h4>
                        <p className="text-xs text-slate-300 truncate mt-1">
                          {article.Hook || 'No hook...'}
                        </p>
                      </div>
                      {index === selectedSearchIndex && (
                        <div className="flex items-center text-blue-400 ml-2">
                          <span className="text-xs">Viewing</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty Search Results */}
        {searchQuery && displayArticles.length === 0 && (
          <Card className="bg-slate-800/50 border-slate-600 backdrop-blur-sm mb-6">
            <CardContent className="p-6 text-center">
              <div className="text-slate-400">
                <p>No articles found for "{searchQuery}"</p>
                <Button
                  onClick={() => setSearchQuery('')}
                  variant="ghost"
                  className="mt-2 text-blue-400 hover:text-blue-300"
                >
                  Clear search
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Alert className="mb-6">
            <AlertDescription>
              {error}
              <Button 
                onClick={() => setError(null)}
                variant="ghost"
                size="sm"
                className="ml-4"
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        {displayCurrentArticle && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Form Fields */}
            <div className="space-y-6">
              <Card className="bg-slate-800/50 border-slate-600 backdrop-blur-sm">
                <CardContent className="p-6 space-y-4">
                  
                  {/* Headline */}
                  <div className="space-y-2">
                    <Label htmlFor="headline" className="text-slate-300">Headline</Label>
                    <Input
                      id="headline"
                      value={displayCurrentArticle.Headline || ''}
                      onChange={(e) => handleFieldChange('Headline', e.target.value)}
                      placeholder="Enter headline..."
                      disabled={!!searchQuery}
                    />
                  </div>

                  {/* Hook */}
                  <div className="space-y-2">
                    <Label htmlFor="hook" className="text-slate-300">Hook</Label>
                    <Textarea
                      id="hook"
                      value={displayCurrentArticle.Hook || ''}
                      onChange={(e) => handleFieldChange('Hook', e.target.value)}
                      rows={3}
                      placeholder="Enter hook..."
                      disabled={!!searchQuery}
                    />
                  </div>

                  {/* Content - Large */}
                  <div className="space-y-2">
                    <Label htmlFor="content" className="text-slate-300">Content</Label>
                    <Textarea
                      id="content"
                      value={displayCurrentArticle.Content || ''}
                      onChange={(e) => handleFieldChange('Content', e.target.value)}
                      rows={18}
                      placeholder="Enter content..."
                      className="text-sm"
                      disabled={!!searchQuery}
                    />
                  </div>

                  {/* Focus Angle */}
                  <div className="space-y-2">
                    <Label htmlFor="focus-angle" className="text-slate-300">Focus Angle</Label>
                    <Input
                      id="focus-angle"
                      value={displayCurrentArticle['Focus Angle'] || ''}
                      onChange={(e) => handleFieldChange('Focus Angle', e.target.value)}
                      placeholder="Enter focus angle..."
                      disabled={!!searchQuery}
                    />
                  </div>

                  {/* Image Placement */}
                  <div className="space-y-2">
                    <Label htmlFor="image-placement" className="text-slate-300">Image Placement</Label>
                    <Input
                      id="image-placement"
                      value={displayCurrentArticle['Image Placement'] || ''}
                      onChange={(e) => handleFieldChange('Image Placement', e.target.value)}
                      placeholder="Enter image placement..."
                      disabled={!!searchQuery}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons - Moved to left column for better space usage */}
              <Card className="bg-slate-800/50 border-slate-600 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex flex-col space-y-4 lg:flex-row lg:justify-between lg:space-y-0">
                    <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                      <Button 
                        variant="destructive"
                        disabled={deleting}
                        className="w-full sm:w-auto"
                      >
                        {deleting ? 'DELETING...' : 'DELETE'}
                      </Button>
                      <Button 
                        variant="outline"
                        disabled={rejecting}
                        className="border-orange-500 text-orange-600 hover:bg-orange-50 w-full sm:w-auto"
                      >
                        {rejecting ? 'REJECTING...' : 'REJECT'}
                      </Button>
                    </div>
                    <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                      <Button 
                        variant="outline"
                        disabled={!isModified || saving || publishing || !!searchQuery}
                        onClick={() => saveArticle('Edited')}
                        className={`border-orange-500 text-orange-400 hover:bg-orange-500/10 w-full sm:w-auto ${
                          saveSuccess ? 'bg-green-600 text-white border-green-600' : ''
                        }`}
                      >
                        {saving ? 'SAVING...' : saveSuccess ? 'SAVED!' : 'SAVE CHANGES'}
                      </Button>
                      <Button 
                        disabled={!isModified || saving || publishing || !!searchQuery}
                        onClick={() => saveArticle('Published')}
                        className={`bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto ${
                          publishSuccess ? 'bg-green-600' : ''
                        }`}
                      >
                        {publishing ? 'PUBLISHING...' : publishSuccess ? 'PUBLISHED!' : 'PUBLISH'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Image & Filters */}
            <div className="space-y-6">
              {/* Image Section */}
              <Card className="bg-slate-800/50 border-slate-600 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-orange-400">Image</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Image Upload Area - TODO: Implement drag & drop */}
                  <div 
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 min-h-[120px] flex items-center justify-center ${
                      dragOver 
                        ? 'border-orange-400 bg-orange-400/10' 
                        : 'border-slate-500 bg-slate-700/30'
                    } hover:border-slate-400`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    {uploadingImage ? (
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin mb-2"></div>
                        <span className="text-slate-300">Uploading image...</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Upload className="mx-auto h-12 w-12 text-slate-400" />
                        <div>
                          <label className="cursor-pointer text-orange-400 hover:text-orange-300 font-medium">
                            <span>Click to upload</span>
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={handleFileInput}
                            />
                          </label>
                          <span className="text-slate-400"> or drag and drop</span>
                        </div>
                        <p className="text-sm text-slate-400 opacity-75">PNG, JPG, GIF up to 20MB (auto-compressed)</p>
                      </div>
                    )}
                  </div>

                  {/* Image URL Input */}
                  <div className="flex space-x-2">
                    <Input
                      value={displayCurrentArticle['Image URL'] || ''}
                      onChange={(e) => handleFieldChange('Image URL', e.target.value)}
                      placeholder="Or paste image URL..."
                      className="flex-1"
                      disabled={!!searchQuery}
                    />
                    <Button variant="outline" size="sm" title="Previous image">
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" title="Next image">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Image Preview */}
                  <div className="border border-slate-600 rounded-lg overflow-hidden bg-slate-700/30">
                    {displayCurrentArticle['Image URL'] ? (
                      <img 
                        src={displayCurrentArticle['Image URL']} 
                        alt="Article image"
                        className="w-full h-auto object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=';
                        }}
                      />
                    ) : (
                      <div className="h-40 bg-slate-700/50 flex items-center justify-center">
                        <span className="text-slate-400">No image</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        )}

        </div>
      </div>

      <Footer />
    </div>
  );
}