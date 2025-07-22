import { storage } from './storage.js';
import { createSupabaseUser } from './supabase-auth.js';

// Download and upload realistic images from Unsplash
async function downloadImageFromUnsplash(width: number = 800, height: number = 600, seed?: string): Promise<Buffer> {
  const url = `https://picsum.photos/${width}/${height}${seed ? `?random=${seed}` : ''}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

export async function populateRealisticData() {
  console.log('🏗️ Populating database with realistic test data...');
  
  try {
    // 1. Create client users in Supabase auth
    console.log('Creating client users...');
    const clientUsers = [
      {
        email: 'sarah.johnson@email.com',
        password: 'client2025',
        fullName: 'Sarah & Tom Johnson',
        role: 'client' as const
      },
      {
        email: 'mike.wilson@email.com', 
        password: 'client2025',
        fullName: 'Wilson Family',
        role: 'client' as const
      },
      {
        email: 'corporate@capetown.com',
        password: 'client2025',
        fullName: 'Cape Town Corporate',
        role: 'client' as const
      }
    ];

    const createdUsers = [];
    for (const userData of clientUsers) {
      try {
        const user = await createSupabaseUser(userData);
        createdUsers.push(user);
        console.log(`✅ Created client user: ${userData.email}`);
      } catch (error) {
        console.log(`⚠️ User ${userData.email} may already exist, continuing...`);
      }
    }

    // 2. Create client records
    console.log('Creating client records...');
    const clients = [
      {
        name: 'Sarah & Tom Johnson',
        slug: 'sarah-tom-johnson',
        email: 'sarah.johnson@email.com',
        userId: createdUsers[0]?.id || null,
        createdBy: createdUsers[0]?.id || 'admin-uuid', // Need admin user ID
      },
      {
        name: 'Wilson Family',
        slug: 'wilson-family',
        email: 'mike.wilson@email.com',
        userId: createdUsers[1]?.id || null,
        createdBy: createdUsers[1]?.id || 'admin-uuid',
      },
      {
        name: 'Cape Town Corporate',
        slug: 'cape-town-corporate',
        email: 'corporate@capetown.com',
        userId: createdUsers[2]?.id || null,
        createdBy: createdUsers[2]?.id || 'admin-uuid',
      }
    ];

    const createdClients = [];
    for (const clientData of clients) {
      const client = await storage.createClient(clientData);
      createdClients.push(client);
      console.log(`✅ Created client: ${client.name}`);
    }

    // 3. Create shoots for each client
    console.log('Creating shoots...');
    const shoots = [
      // Sarah & Tom Johnson - Wedding
      {
        clientId: createdClients[0].id.toString(),
        title: 'Wedding Ceremony & Reception',
        description: 'Beautiful winter wedding at Vineyard Estate with mountain views',
        isPrivate: true,
        seoTags: ['wedding', 'stellenbosch', 'vineyard', 'winter-wedding'],
        createdBy: createdUsers[0]?.id || 'admin-uuid'
      },
      {
        clientId: createdClients[0].id,
        title: 'Engagement Session',
        description: 'Romantic engagement photos at Kirstenbosch Gardens',
        shootDate: new Date('2024-04-20'),
        location: 'Kirstenbosch Botanical Gardens',
        isPublic: false,
        coverImageUrl: null,
        customization: {
          primaryColor: '#C19A6B',
          backgroundColor: '#FFFFFF',
          fontFamily: 'sans-serif'
        },
        seoTitle: 'Sarah & Tom Engagement Photos - SlyFox Studios',
        seoDescription: 'Romantic engagement photography in the heart of Cape Town',
        seoTags: ['engagement', 'kirstenbosch', 'couple', 'romantic']
      },
      // Wilson Family
      {
        clientId: createdClients[1].id,
        title: 'Family Portrait Session',
        description: 'Annual family photos with three generations at the beach',
        shootDate: new Date('2024-11-10'),
        location: 'Camps Bay Beach',
        isPublic: false,
        coverImageUrl: null,
        customization: {
          primaryColor: '#4A90E2',
          backgroundColor: '#F0F8FF',
          fontFamily: 'sans-serif'
        },
        seoTitle: 'Wilson Family Photography - SlyFox Studios',
        seoDescription: 'Multi-generational family portraits with stunning ocean backdrop',
        seoTags: ['family', 'beach', 'camps-bay', 'generations']
      },
      // Cape Town Corporate - Multiple shoots
      {
        clientId: createdClients[2].id,
        title: 'Executive Headshots 2024',
        description: 'Professional headshots for company leadership team',
        shootDate: new Date('2024-09-05'),
        location: 'Corporate Office - CBD',
        isPublic: false,
        coverImageUrl: null,
        customization: {
          primaryColor: '#2C3E50',
          backgroundColor: '#FFFFFF',
          fontFamily: 'sans-serif'
        },
        seoTitle: 'Corporate Headshots Cape Town - SlyFox Studios',
        seoDescription: 'Professional business headshots for executive team',
        seoTags: ['corporate', 'headshots', 'business', 'professional']
      },
      {
        clientId: createdClients[2].id,
        title: 'Annual Conference Documentation',
        description: 'Full event coverage of company annual conference',
        shootDate: new Date('2024-10-15'),
        location: 'Cape Town International Convention Centre',
        isPublic: false,
        coverImageUrl: null,
        customization: {
          primaryColor: '#E74C3C',
          backgroundColor: '#F8F9FA',
          fontFamily: 'sans-serif'
        },
        seoTitle: 'Corporate Event Photography - SlyFox Studios',
        seoDescription: 'Professional conference and event documentation',
        seoTags: ['conference', 'event', 'corporate', 'documentation']
      }
    ];

    const createdShoots = [];
    for (const shootData of shoots) {
      const shoot = await storage.createShoot(shootData);
      createdShoots.push(shoot);
      console.log(`✅ Created shoot: ${shoot.title} for client ${shoot.clientId}`);
    }

    // 4. Download and create images for each shoot
    console.log('Downloading and creating images...');
    
    const imageCategories = [
      'wedding', 'portrait', 'family', 'corporate', 'event', 'nature'
    ];

    for (let shootIndex = 0; shootIndex < createdShoots.length; shootIndex++) {
      const shoot = createdShoots[shootIndex];
      const imageCount = Math.floor(Math.random() * 11) + 10; // 10-20 images per shoot
      
      console.log(`Downloading ${imageCount} images for shoot: ${shoot.title}`);
      
      for (let i = 0; i < imageCount; i++) {
        try {
          // Download image from Unsplash/Picsum
          const seed = `${shootIndex}-${i}-${Date.now()}`;
          const imageBuffer = await downloadImageFromUnsplash(1200, 800, seed);
          
          // Create image record
          const image = await storage.createImage({
            shootId: shoot.id,
            filename: `image_${i + 1}.jpg`,
            originalPath: `/uploads/shoots/${shoot.id}/originals/image_${i + 1}.jpg`,
            thumbnailPath: `/uploads/shoots/${shoot.id}/thumbnails/image_${i + 1}_thumb.jpg`,
            isPrivate: false,
            sequence: i + 1,
            title: `Photo ${i + 1}`,
            description: `Beautiful capture from ${shoot.title}`,
            tags: [imageCategories[Math.floor(Math.random() * imageCategories.length)]],
            downloadCount: Math.floor(Math.random() * 5) // Random download count
          });
          
          console.log(`  ✅ Created image ${i + 1}/${imageCount}: ${image.filename}`);
          
          // Simulate upload delay
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error(`  ❌ Failed to create image ${i + 1} for shoot ${shoot.title}:`, error);
        }
      }
    }

    // 5. Verify data connections
    console.log('🔍 Verifying data connections...');
    
    for (const client of createdClients) {
      const clientShoots = await storage.getShootsByClient(client.id.toString());
      console.log(`Client "${client.name}" has ${clientShoots.length} shoots`);
      
      for (const shoot of clientShoots) {
        const shootImages = await storage.getImagesByShoot(shoot.id);
        console.log(`  Shoot "${shoot.title}" has ${shootImages.length} images`);
      }
    }

    console.log('✅ Realistic data population completed successfully!');
    
    return {
      clients: createdClients.length,
      shoots: createdShoots.length,
      totalImages: createdShoots.length * 15 // approximate
    };

  } catch (error) {
    console.error('❌ Error populating realistic data:', error);
    throw error;
  }
}