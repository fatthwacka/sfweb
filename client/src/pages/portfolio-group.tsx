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

  // Single client-focused query - streamlined approach with optimised batch fetching
  const { data: clientResponse, isLoading, error } = useQuery({
    queryKey: ['portfolio-client', parameterValue],
    queryFn: async () => {
      console.log('🔍 PortfolioGroup: Finding client for parameter:', parameterValue);

      let clientEmail: string;
      let clientName: string;
      let clientShoots: any[];

      // OPTIMISATION: Fetch all shoots ONCE at the start (was called 3 times before)
      const allShoots = await supabaseOperations.shoots.getAll();
      console.log('✅ PortfolioGroup: Retrieved', allShoots.length, 'total shoots from Supabase (single query)');

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

        // Filter shoots for this client (excluding private)
        clientShoots = allShoots.filter(shoot =>
          shoot.client_id === clientEmail && !(shoot as any).is_private
        );

        if (clientShoots.length === 0) {
          console.log('❌ No public shoots found for client email:', clientEmail);
          throw new Error('No galleries found for client');
        }

        console.log('🎯 Found', clientShoots.length, 'shoots for client:', clientEmail);
      } else {
        // CASE 2: /project/:groupName - Find shoots by group_name
        console.log('🔍 Project route: Finding shoots for group_name:', parameterValue);

        // Find shoots with this group_name (handle URL slug to title conversion)
        clientShoots = allShoots.filter(shoot => {
          const shootGroupName = (shoot as any).group_name || (shoot as any).groupName;
          if (!shootGroupName) return false;

          // Convert group name to URL slug for comparison (lowercase, spaces to hyphens)
          const shootSlug = shootGroupName.toLowerCase().replace(/\s+/g, '-');
          return shootSlug === parameterValue && !(shoot as any).is_private;
        });

        if (clientShoots.length === 0) {
          console.log('❌ No public shoots found for group_name:', parameterValue);
          throw new Error('Project not found');
        }

        // Use actual group name as display name
        clientEmail = 'project'; // Dummy value since we don't need it
        const actualGroupName = (clientShoots[0] as any).group_name || (clientShoots[0] as any).groupName;
        clientName = actualGroupName || parameterValue;
        console.log('🎯 Found', clientShoots.length, 'shoots for group_name:', parameterValue);
        console.log('✅ Using actual group name as display name:', clientName);
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
      
      // COVER IMAGES & METADATA - OPTIMISED: batch fetch by IDs (was fetching ALL images)
      const bannerImageIds = clientShoots
        .map(shoot => (shoot as any).banner_image_id)
        .filter(Boolean);

      let bannerImages: any[] = [];
      if (bannerImageIds.length > 0) {
        console.log('🖼️ PortfolioGroup: Batch fetching', bannerImageIds.length, 'banner images by ID');
        bannerImages = await supabaseOperations.images.getByIds(bannerImageIds);
        console.log('✅ PortfolioGroup: Retrieved', bannerImages.length, 'banner images (direct lookup)');
      }

      // COVER VIDEOS - OPTIMISED: single batch query (was N+1 sequential queries)
      const videoShoots = clientShoots.filter(shoot => (shoot as any).media_type === 'video');

      let coverVideosMap: Record<string, any> = {};
      if (videoShoots.length > 0) {
        console.log('🎥 PortfolioGroup: Batch fetching videos for', videoShoots.length, 'video galleries (single query)');

        // Batch fetch all videos for all video shoots in one query
        const videoShootIds = videoShoots.map(shoot => shoot.id);
        const allVideos = await supabaseOperations.videos.getByShootIds(videoShootIds);

        // Group videos by shoot and pick cover video for each
        for (const shoot of videoShoots) {
          const shootVideos = allVideos.filter(video => video.shootId === shoot.id);
          if (shootVideos.length > 0) {
            // Prioritize featured videos, otherwise take first video
            const coverVideo = shootVideos.find(video => video.featuredVideo) || shootVideos[0];
            coverVideosMap[shoot.id] = coverVideo;
          }
        }
        console.log('✅ PortfolioGroup: Mapped cover videos for', Object.keys(coverVideosMap).length, 'video galleries');
      }
      
      // FINAL PORTFOLIO ITEMS - add cover images and metadata to portfolio items  
      const finalPortfolioItems = portfolioItems.map(item => {
        if (item.isGroup) {
          // Bundle - prioritize photo shoots for cover images
          const photoShoots = item.shoots.filter((s: any) => s.media_type !== 'video');
          const videoShoots = item.shoots.filter((s: any) => s.media_type === 'video');
          const firstShoot = photoShoots.length > 0 ? photoShoots[0] : item.shoots[0];
          const imageCount = photoShoots.length;
          const videoCount = videoShoots.length;
          
          const bannerImageId = (firstShoot as any).banner_image_id;
          const bannerImage = bannerImages.find(img => img.id === bannerImageId);
          const coverImageUrl = bannerImage?.storage_path ? ImageUrl.forViewing(bannerImage.storage_path) : undefined;
          
          // For video galleries, add cover video info (only for video-only groups)
          let coverVideoInfo = undefined;
          const mediaType = (firstShoot as any).media_type;
          if (mediaType === 'video' && imageCount === 0) {
            // Only add video info for video-only groups (no mixed media)
            const coverVideo = coverVideosMap[firstShoot.id];
            if (coverVideo) {
              coverVideoInfo = {
                id: coverVideo.id,
                storagePath: coverVideo.storagePath,
                optimizedPath: coverVideo.optimizedPath,
                thumbnailPath: coverVideo.thumbnailPath,
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
                storagePath: coverVideo.storagePath,
                optimizedPath: coverVideo.optimizedPath,
                thumbnailPath: coverVideo.thumbnailPath,
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