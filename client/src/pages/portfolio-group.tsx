import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { Navigation } from '@/components/layout/navigation';
import { Footer } from '@/components/layout/footer';
import { PortfolioGrid } from '@/components/portfolio/portfolio-grid';
import { ArrowLeft } from 'lucide-react';
import { trackPageView } from '@/lib/analytics';
import { ImageUrl } from '@/lib/image-utils';
import { VideoUrl } from '@/lib/video-utils';
import type { Client } from '@shared/schema';
import { supabaseOperations } from '@/lib/supabase-operations';

export function PortfolioGroup() {
  const { groupName, slug } = useParams();

  // Use slug if available (from /portfolio/client-slug or /project/group-name routes)
  // or groupName (from direct /project route)
  const parameterValue = slug || groupName;

  // Track page view for dynamic portfolio/project pages
  useEffect(() => {
    if (parameterValue) {
      const path = slug ? `/portfolio/${slug}` : `/project/${groupName}`;
      trackPageView(path);
    }
  }, [parameterValue, slug, groupName]);

  // Single client-focused query - streamlined approach
  const { data: clientResponse, isLoading, error } = useQuery({
    queryKey: ['portfolio-client', parameterValue],
    queryFn: async () => {
      console.log('🔍 PortfolioGroup: Finding client for parameter:', parameterValue);
      
      let clientEmail: string;
      let clientName: string;
      
      if (slug) {
        // CASE 1: /portfolio/:slug - Use API to get client by slug (avoids RLS issues)
        console.log('🔍 Portfolio route: Finding client via API for slug:', parameterValue);
        const clientResponse = await fetch(`/api/clients/${parameterValue}`);
        if (!clientResponse.ok) {
          console.log('❌ Client API returned status:', clientResponse.status);
          throw new Error('Client not found');
        }
        
        const apiData = await clientResponse.json();
        const client = apiData.client;
        clientEmail = client.email;
        clientName = client.name;
        console.log('✅ Found client via API:', clientName, 'with email:', clientEmail);
      } else {
        // CASE 2: /project/:groupName - Find shoots by group_name (no clients table needed)
        console.log('🔍 Project route: Finding shoots for group_name:', parameterValue);
        
        // Query all shoots to find ones with this group_name
        const allShoots = await supabaseOperations.shoots.getAll();
        console.log('✅ PortfolioGroup: Retrieved', allShoots.length, 'total shoots from Supabase');
        
        // Find shoots with this group_name (handle URL slug to title conversion)
        const groupShoots = allShoots.filter(shoot => {
          const shootGroupName = (shoot as any).group_name || (shoot as any).groupName;
          if (!shootGroupName) return false;
          
          // Convert group name to URL slug for comparison (lowercase, spaces to hyphens)
          const shootSlug = shootGroupName.toLowerCase().replace(/\s+/g, '-');
          const isMatch = shootSlug === parameterValue && !(shoot as any).is_private;
          
          if (isMatch) {
            console.log(`✅ Match found: "${shootGroupName}" -> "${shootSlug}" === "${parameterValue}"`);
          }
          
          return isMatch;
        });
        
        if (groupShoots.length === 0) {
          console.log('❌ No public shoots found for group_name:', parameterValue);
          throw new Error('Project not found');
        }
        
        // Use actual group name as display name (convert from slug back to title)
        clientEmail = 'project'; // Dummy value since we don't need it
        if (groupShoots.length > 0) {
          // Get the actual group name from the first matching shoot
          const actualGroupName = (groupShoots[0] as any).group_name || (groupShoots[0] as any).groupName;
          clientName = actualGroupName || parameterValue;
        } else {
          clientName = parameterValue;
        }
        console.log('🎯 Found', groupShoots.length, 'shoots for group_name:', parameterValue);
        console.log('✅ Using actual group name as display name:', clientName);
      }
      
      // STEP 2: Get the appropriate shoots based on route type
      let clientShoots: any[];
      
      if (slug) {
        // Portfolio route: Get all shoots for this client
        const allShoots = await supabaseOperations.shoots.getAll();
        console.log('✅ PortfolioGroup: Retrieved', allShoots.length, 'total shoots from Supabase');
        
        // Filter all shoots for this client (excluding private)
        clientShoots = allShoots.filter(shoot => 
          shoot.client_id === clientEmail && !(shoot as any).is_private
        );
        
        if (clientShoots.length === 0) {
          console.log('❌ No public shoots found for client email:', clientEmail);
          throw new Error('No galleries found for client');
        }
        
        console.log('🎯 Found', clientShoots.length, 'shoots for client:', clientEmail);
      } else {
        // Project route: We already have the group shoots from the search above
        const allShoots = await supabaseOperations.shoots.getAll();
        clientShoots = allShoots.filter(shoot => {
          const shootGroupName = (shoot as any).group_name || (shoot as any).groupName;
          if (!shootGroupName) return false;
          
          // Convert group name to URL slug for comparison (lowercase, spaces to hyphens)
          const shootSlug = shootGroupName.toLowerCase().replace(/\s+/g, '-');
          return shootSlug === parameterValue && !(shoot as any).is_private;
        });
        
        console.log('🎯 Project route: Using', clientShoots.length, 'shoots for group_name:', parameterValue);
      }
      
      // SMART DISPLAY LOGIC - different behavior for portfolio vs project routes
      console.log('🗂️ PortfolioGroup: Analyzing', clientShoots.length, 'shoots for display...');
      
      let portfolioItems: any[] = [];
      
      if (slug) {
        // PORTFOLIO ROUTE: Smart bundling logic - only bundle when 2+ albums share same group_name
        console.log('📁 Portfolio route: Applying bundling logic...');
        
        // First, group shoots by group_name (including null/undefined)
        const groupedByGroupName = clientShoots.reduce((groups: Record<string, any[]>, shoot) => {
          const groupName = (shoot as any).group_name || null;
          const key = groupName || `individual_${shoot.id}`; // Individual albums get unique keys
          if (!groups[key]) {
            groups[key] = [];
          }
          groups[key].push(shoot);
          return groups;
        }, {});
        
        // Now determine which groups should be bundled vs shown individually
        Object.entries(groupedByGroupName).forEach(([groupKey, groupShoots]) => {
          if (groupKey.startsWith('individual_')) {
            // Individual album - show as separate item
            const shoot = groupShoots[0];
            portfolioItems.push({
              ...shoot,
              isGroup: false,
              displayTitle: shoot.title || 'Untitled Album'
            });
          } else if (groupShoots.length > 1) {
            // Multiple albums with same group_name - bundle them
            const bundledItem = {
              id: `bundle_${groupKey}`,
              isGroup: true,
              groupName: groupKey,
              title: groupKey,
              shoots: groupShoots,
              displayTitle: groupKey
            };
            portfolioItems.push(bundledItem);
          } else {
            // Single album with a group_name - show individually
            const shoot = groupShoots[0];
            portfolioItems.push({
              ...shoot,
              isGroup: false,
              displayTitle: shoot.title || groupKey
            });
          }
        });
      } else {
        // PROJECT ROUTE: Show all albums in the group as individual items (already filtered by group_name)
        console.log('🎯 Project route: Showing all albums as individual items...');
        portfolioItems = clientShoots.map(shoot => ({
          ...shoot,
          isGroup: false,
          displayTitle: shoot.title || `${parameterValue} Album`
        }));
      }
      
      console.log('🎯 PortfolioGroup: Created', portfolioItems.length, 'portfolio items:', {
        bundles: portfolioItems.filter(item => item.isGroup).length,
        individuals: portfolioItems.filter(item => !item.isGroup).length
      });
      
      // COVER IMAGES & METADATA - fetch for all client shoots
      const bannerImageIds = clientShoots
        .map(shoot => (shoot as any).banner_image_id)
        .filter(Boolean);
      
      let bannerImages: any[] = [];
      if (bannerImageIds.length > 0) {
        console.log('🖼️ PortfolioGroup: Fetching', bannerImageIds.length, 'banner images');
        const allImages = await supabaseOperations.images.getAll();
        bannerImages = allImages.filter(img => bannerImageIds.includes(img.id));
        console.log('✅ PortfolioGroup: Retrieved', bannerImages.length, 'banner images');
      }
      
      // Fetch cover videos for video galleries
      const videoShoots = clientShoots.filter(shoot => (shoot as any).media_type === 'video');
      
      let coverVideosMap: Record<string, any> = {};
      if (videoShoots.length > 0) {
        console.log('🎥 PortfolioGroup: Fetching cover videos for', videoShoots.length, 'video galleries');
        
        // Fetch videos for each video shoot
        for (const shoot of videoShoots) {
          try {
            const shootVideos = await supabaseOperations.videos.getByShoot(shoot.id);
            if (shootVideos.length > 0) {
              // Prioritize featured videos, otherwise take first video
              const coverVideo = shootVideos.find(video => video.featured_video) || shootVideos[0];
              coverVideosMap[shoot.id] = coverVideo;
            }
          } catch (error) {
            console.warn(`Failed to fetch videos for shoot ${shoot.id}:`, error);
          }
        }
        console.log('✅ PortfolioGroup: Retrieved cover videos for', Object.keys(coverVideosMap).length, 'video galleries');
      }
      
      // FINAL PORTFOLIO ITEMS - add cover images and metadata to portfolio items  
      const finalPortfolioItems = portfolioItems.map(item => {
        if (item.isGroup) {
          // Bundle - use first shoot for cover info and calculate counts
          const firstShoot = item.shoots[0];
          const imageCount = item.shoots.filter((s: any) => s.media_type !== 'video').length;
          const videoCount = item.shoots.filter((s: any) => s.media_type === 'video').length;
          
          const bannerImageId = (firstShoot as any).banner_image_id;
          const bannerImage = bannerImages.find(img => img.id === bannerImageId);
          const coverImageUrl = bannerImage?.storage_path ? ImageUrl.forViewing(bannerImage.storage_path) : undefined;
          
          // For video galleries, add cover video info
          let coverVideoInfo = undefined;
          const mediaType = (firstShoot as any).media_type;
          if (mediaType === 'video') {
            const coverVideo = coverVideosMap[firstShoot.id];
            if (coverVideo) {
              coverVideoInfo = {
                id: coverVideo.id,
                storagePath: coverVideo.storage_path,
                optimizedPath: (coverVideo as any).optimized_path,
                thumbnailPath: (coverVideo as any).thumbnail_path,
                filename: coverVideo.filename
              };
            }
          }
          
          return {
            id: item.id,
            title: item.title,
            description: `${imageCount + videoCount} galleries`,
            mediaType: mediaType as 'photo' | 'video',
            customSlug: (firstShoot as any).custom_slug,
            coverImageUrl: coverImageUrl,
            coverVideoInfo: coverVideoInfo,
            isGroup: true,
            groupName: item.groupName,
            shootCount: item.shoots.length,
            shoots: item.shoots.map((shoot: any) => ({
              id: shoot.id,
              title: shoot.title,
              mediaType: (shoot.media_type || 'photo') as 'photo' | 'video',
              customSlug: shoot.custom_slug
            }))
          };
        } else {
          // Individual album
          const bannerImageId = (item as any).banner_image_id;
          const bannerImage = bannerImages.find(img => img.id === bannerImageId);
          const coverImageUrl = bannerImage?.storage_path ? ImageUrl.forViewing(bannerImage.storage_path) : undefined;
          
          // For video galleries, add cover video info
          let coverVideoInfo = undefined;
          const mediaType = (item as any).media_type;
          if (mediaType === 'video') {
            const coverVideo = coverVideosMap[item.id];
            if (coverVideo) {
              coverVideoInfo = {
                id: coverVideo.id,
                storagePath: coverVideo.storage_path,
                optimizedPath: (coverVideo as any).optimized_path,
                thumbnailPath: (coverVideo as any).thumbnail_path,
                filename: coverVideo.filename
              };
            }
          }
          
          return {
            id: item.id,
            title: item.displayTitle,
            description: `${mediaType === 'video' ? 'Video' : 'Photo'} Gallery`,
            mediaType: (mediaType || 'photo') as 'photo' | 'video',
            customSlug: (item as any).custom_slug,
            coverImageUrl: coverImageUrl,
            coverVideoInfo: coverVideoInfo,
            isGroup: false
          };
        }
      });
      
      // Create client response object
      const clientObj = {
        id: clientEmail,
        email: clientEmail,
        slug: slug || clientEmail, // Use slug for portfolio route, email for project route
        name: clientName
      };
      
      return {
        client: clientObj,
        portfolioItems: finalPortfolioItems
      };
    },
    enabled: !!parameterValue,
    retry: false
  });

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="pt-20 pb-16">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-salmon mx-auto"></div>
              <p className="text-gray-400 mt-4">Loading portfolio...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !clientResponse) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="pt-20 pb-16">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-red-400">Portfolio not found</p>
              <a 
                href="/portfolio"
                className="inline-flex items-center gap-2 text-cyan hover:text-cyan-bright mt-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Portfolio
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Single Section - Portfolio Content */}
      <div className="py-20" style={{ background: 'linear-gradient(to bottom, #64748b 0%, #334155 50%, #1e293b 100%)' }}>
        <div className="w-full px-4 sm:px-6 lg:px-8">
          {/* Client Title */}
          <div className="text-center mb-16">
            <h1 className="text-white text-4xl lg:text-5xl font-light mb-6">
              {clientResponse.client.name}
            </h1>
            <p className="text-muted-foreground text-lg lg:text-xl max-w-3xl mx-auto">
              Your portfolio of professional images captured by SlyFox Studio Group
            </p>
          </div>
          
          {/* Client Portfolio Grid */}
          <PortfolioGrid 
            portfolioItems={clientResponse.portfolioItems}
          />
        </div>
      </div>

      <Footer />
    </div>
  );
}