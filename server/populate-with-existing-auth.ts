import { db } from './db.js';
import { profiles, clients, shoots, images, analytics, favorites } from '@shared/schema.js';
import { sql } from 'drizzle-orm';

// Create realistic dummy data using the existing legacy users system
export async function populateWithExistingAuth() {
  console.log('🌱 Populating database with realistic dummy data...');

  try {
    // Generate proper UUIDs for profiles to match Supabase structure
    const profileUUIDs = [
      'dax12345-1234-4123-a123-123456789012',
      'eben1234-1234-4123-a123-123456789012', 
      'demo1234-1234-4123-a123-123456789012',
      'sara1234-1234-4123-a123-123456789012',
      'mike1234-1234-4123-a123-123456789012'
    ];

    // Step 1: Create profiles manually with fixed UUIDs
    console.log('Creating profiles with fixed UUIDs...');
    const profilesData = [
      {
        id: profileUUIDs[0],
        email: 'dax@slyfox.co.za',
        fullName: 'Dax Tucker',
        role: 'staff',
        themePreference: 'dark'
      },
      {
        id: profileUUIDs[1],
        email: 'eben@slyfox.co.za',
        fullName: 'Eben Schoeman',
        role: 'staff',
        themePreference: 'dark'
      },
      {
        id: profileUUIDs[2],
        email: 'demo@slyfox.co.za',
        fullName: 'Demo Client',
        role: 'client',
        themePreference: 'light'
      },
      {
        id: profileUUIDs[3],
        email: 'sarah.johnson@email.com',
        fullName: 'Sarah Johnson',
        role: 'client',
        themePreference: 'light'
      },
      {
        id: profileUUIDs[4],
        email: 'mike.wilson@email.com',
        fullName: 'Mike Wilson',
        role: 'client',
        themePreference: 'dark'
      }
    ];

    const createdProfiles = await db.insert(profiles).values(profilesData).returning();
    console.log(`✅ Created ${createdProfiles.length} profiles`);

    // Step 2: Create clients
    console.log('Creating clients...');
    const clientsData = [
      {
        name: 'Sarah & Tom Johnson',
        slug: 'sarah-tom-johnson',
        email: 'sarah.johnson@email.com',
        userId: profileUUIDs[3],
        createdBy: profileUUIDs[0]
      },
      {
        name: 'Wilson Family',
        slug: 'wilson-family',
        email: 'mike.wilson@email.com',
        userId: profileUUIDs[4],
        createdBy: profileUUIDs[1]
      },
      {
        name: 'Demo Gallery Client',
        slug: 'demo-gallery',
        email: 'demo@slyfox.co.za',
        userId: profileUUIDs[2],
        createdBy: profileUUIDs[0]
      },
      {
        name: 'Cape Town Corporate',
        slug: 'cape-town-corporate',
        email: 'events@capetowncorp.co.za',
        userId: null,
        createdBy: profileUUIDs[1]
      },
      {
        name: 'Mountain View Wedding',
        slug: 'mountain-view-wedding',
        email: 'info@mountainviewvenue.co.za',
        userId: null,
        createdBy: profileUUIDs[0]
      }
    ];

    const createdClients = await db.insert(clients).values(clientsData).returning();
    console.log(`✅ Created ${createdClients.length} clients`);

    // Step 3: Create shoots
    console.log('Creating shoots...');
    const shootsData = [
      {
        clientId: createdClients[0].id.toString(),
        title: 'Sarah & Tom - Engagement Session',
        description: 'Romantic engagement shoot at Camps Bay beach during golden hour. Captured their natural chemistry and love story with Cape Town\'s stunning coastline as backdrop.',
        isPrivate: false,
        seoTags: ['engagement', 'couples', 'camps bay', 'beach', 'sunset', 'cape town', 'romantic'],
        viewCount: 45,
        createdBy: profileUUIDs[0]
      },
      {
        clientId: createdClients[1].id.toString(),
        title: 'Wilson Family Portrait Session',
        description: 'Fun family portrait session in Kirstenbosch Botanical Gardens. Three generations celebrating grandmother\'s 80th birthday with natural, candid moments.',
        isPrivate: false,
        seoTags: ['family', 'portraits', 'kirstenbosch', 'generations', 'birthday', 'cape town', 'natural'],
        viewCount: 32,
        createdBy: profileUUIDs[1]
      },
      {
        clientId: createdClients[2].id.toString(),
        title: 'Demo Portfolio Showcase',
        description: 'Curated collection showcasing SlyFox Studios\' diverse photography styles and technical expertise across various genres and lighting conditions.',
        isPrivate: false,
        seoTags: ['portfolio', 'showcase', 'diverse', 'professional', 'studio work', 'outdoor'],
        viewCount: 78,
        createdBy: profileUUIDs[0]
      },
      {
        clientId: createdClients[3].id.toString(),
        title: 'Corporate Event - Annual Gala',
        description: 'Professional documentation of Cape Town Corporate\'s annual gala dinner. Executive headshots, award presentations, and networking moments captured.',
        isPrivate: true,
        seoTags: ['corporate', 'gala', 'professional', 'headshots', 'awards', 'networking'],
        viewCount: 12,
        createdBy: profileUUIDs[1]
      },
      {
        clientId: createdClients[4].id.toString(),
        title: 'Mountain View Wedding - Sarah & James',
        description: 'Intimate wedding ceremony overlooking Table Mountain. Captured ceremony, reception, and couple portraits with dramatic mountain backdrop.',
        isPrivate: false,
        seoTags: ['wedding', 'mountain view', 'table mountain', 'ceremony', 'intimate', 'cape town', 'couples'],
        viewCount: 156,
        createdBy: profileUUIDs[0]
      }
    ];

    const createdShoots = await db.insert(shoots).values(shootsData).returning();
    console.log(`✅ Created ${createdShoots.length} shoots`);

    // Step 4: Create images
    console.log('Creating images...');
    const imagesData = [
      // Engagement Session Images (4 images)
      {
        shootId: createdShoots[0].id,
        filename: 'engagement-beach-sunset-01.jpg',
        storagePath: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&h=1200&fit=crop&crop=faces',
        originalName: 'engagement-beach-sunset-01.jpg',
        fileSize: 2500000,
        isPrivate: false,
        uploadOrder: 1,
        downloadCount: 15
      },
      {
        shootId: createdShoots[0].id,
        filename: 'engagement-beach-sunset-02.jpg',
        storagePath: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&h=1200&fit=crop&crop=faces',
        originalName: 'engagement-beach-sunset-02.jpg',
        fileSize: 2800000,
        isPrivate: false,
        uploadOrder: 2,
        downloadCount: 12
      },
      {
        shootId: createdShoots[0].id,
        filename: 'engagement-beach-sunset-03.jpg',
        storagePath: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&h=1200&fit=crop&crop=faces',
        originalName: 'engagement-beach-sunset-03.jpg',
        fileSize: 3200000,
        isPrivate: false,
        uploadOrder: 3,
        downloadCount: 8
      },
      {
        shootId: createdShoots[0].id,
        filename: 'engagement-beach-sunset-04.jpg',
        storagePath: 'https://images.unsplash.com/photo-1545291730-faff8ca1d4b0?w=800&h=1200&fit=crop&crop=faces',
        originalName: 'engagement-beach-sunset-04.jpg',
        fileSize: 2900000,
        isPrivate: false,
        uploadOrder: 4,
        downloadCount: 22
      },

      // Family Portrait Images (3 images)
      {
        shootId: createdShoots[1].id,
        filename: 'family-kirstenbosch-01.jpg',
        storagePath: 'https://images.unsplash.com/photo-1511895426328-dc8714efa2d8?w=800&h=600&fit=crop',
        originalName: 'family-kirstenbosch-01.jpg',
        fileSize: 3500000,
        isPrivate: false,
        uploadOrder: 1,
        downloadCount: 18
      },
      {
        shootId: createdShoots[1].id,
        filename: 'family-kirstenbosch-02.jpg',
        storagePath: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=800&h=600&fit=crop',
        originalName: 'family-kirstenbosch-02.jpg',
        fileSize: 3100000,
        isPrivate: false,
        uploadOrder: 2,
        downloadCount: 25
      },
      {
        shootId: createdShoots[1].id,
        filename: 'family-kirstenbosch-03.jpg',
        storagePath: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=600&fit=crop',
        originalName: 'family-kirstenbosch-03.jpg',
        fileSize: 2700000,
        isPrivate: false,
        uploadOrder: 3,
        downloadCount: 14
      },

      // Portfolio Showcase Images (3 images)
      {
        shootId: createdShoots[2].id,
        filename: 'portfolio-portrait-studio-01.jpg',
        storagePath: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop&crop=face',
        originalName: 'portfolio-portrait-studio-01.jpg',
        fileSize: 2200000,
        isPrivate: false,
        uploadOrder: 1,
        downloadCount: 45
      },
      {
        shootId: createdShoots[2].id,
        filename: 'portfolio-landscape-cape-town-01.jpg',
        storagePath: 'https://images.unsplash.com/photo-1580692270804-1404f9846f96?w=1200&h=800&fit=crop',
        originalName: 'portfolio-landscape-cape-town-01.jpg',
        fileSize: 4200000,
        isPrivate: false,
        uploadOrder: 2,
        downloadCount: 32
      },
      {
        shootId: createdShoots[2].id,
        filename: 'portfolio-wedding-detail-01.jpg',
        storagePath: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=800&h=800&fit=crop',
        originalName: 'portfolio-wedding-detail-01.jpg',
        fileSize: 2800000,
        isPrivate: false,
        uploadOrder: 3,
        downloadCount: 28
      },

      // Corporate Event Images (2 images)
      {
        shootId: createdShoots[3].id,
        filename: 'corporate-gala-presentation-01.jpg',
        storagePath: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&h=800&fit=crop',
        originalName: 'corporate-gala-presentation-01.jpg',
        fileSize: 3800000,
        isPrivate: true,
        uploadOrder: 1,
        downloadCount: 5
      },
      {
        shootId: createdShoots[3].id,
        filename: 'corporate-gala-networking-01.jpg',
        storagePath: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=1200&h=800&fit=crop',
        originalName: 'corporate-gala-networking-01.jpg',
        fileSize: 3400000,
        isPrivate: true,
        uploadOrder: 2,
        downloadCount: 3
      },

      // Wedding Images (2 images)
      {
        shootId: createdShoots[4].id,
        filename: 'wedding-ceremony-mountain-view-01.jpg',
        storagePath: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&h=800&fit=crop',
        originalName: 'wedding-ceremony-mountain-view-01.jpg',
        fileSize: 4500000,
        isPrivate: false,
        uploadOrder: 1,
        downloadCount: 67
      },
      {
        shootId: createdShoots[4].id,
        filename: 'wedding-couple-portraits-01.jpg',
        storagePath: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800&h=1200&fit=crop&crop=faces',
        originalName: 'wedding-couple-portraits-01.jpg',
        fileSize: 3600000,
        isPrivate: false,
        uploadOrder: 2,
        downloadCount: 89
      }
    ];

    const createdImages = await db.insert(images).values(imagesData).returning();
    console.log(`✅ Created ${createdImages.length} images`);

    // Step 5: Update shoot banner images
    console.log('Updating shoot banner images...');
    for (let i = 0; i < createdShoots.length; i++) {
      const shoot = createdShoots[i];
      const shootImages = createdImages.filter(img => img.shootId === shoot.id);
      if (shootImages.length > 0) {
        await db.update(shoots)
          .set({ bannerImageId: shootImages[0].id })
          .where(sql`${shoots.id} = ${shoot.id}`);
      }
    }

    // Step 6: Create analytics (50 records)
    console.log('Creating analytics...');
    const analyticsData = [];
    const actionTypes = ['view_image', 'download_image', 'view_gallery', 'share_gallery'];
    
    for (let i = 0; i < 50; i++) {
      const randomProfile = profileUUIDs[2 + Math.floor(Math.random() * 3)]; // Client profiles only
      const randomShoot = createdShoots[Math.floor(Math.random() * createdShoots.length)];
      const randomImage = createdImages[Math.floor(Math.random() * createdImages.length)];
      const randomAction = actionTypes[Math.floor(Math.random() * actionTypes.length)];
      
      analyticsData.push({
        userId: randomProfile,
        shootId: randomShoot.id,
        imageId: randomImage.id,
        actionType: randomAction,
        ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (compatible; SlyFoxApp/1.0)'
      });
    }

    const createdAnalytics = await db.insert(analytics).values(analyticsData).returning();
    console.log(`✅ Created ${createdAnalytics.length} analytics records`);

    // Step 7: Create favorites (25 records)
    console.log('Creating favorites...');
    const favoritesData = [];
    
    for (let i = 0; i < 25; i++) {
      const randomProfile = profileUUIDs[2 + Math.floor(Math.random() * 3)]; // Client profiles only
      const randomImage = createdImages[Math.floor(Math.random() * createdImages.length)];
      
      favoritesData.push({
        userId: randomProfile,
        imageId: randomImage.id
      });
    }

    const createdFavorites = await db.insert(favorites).values(favoritesData).returning();
    console.log(`✅ Created ${createdFavorites.length} favorites`);

    console.log('🎉 Database population completed successfully!');
    
    return {
      profiles: createdProfiles.length,
      clients: createdClients.length,
      shoots: createdShoots.length,
      images: createdImages.length,
      analytics: createdAnalytics.length,
      favorites: createdFavorites.length
    };

  } catch (error) {
    console.error('❌ Database population failed:', error);
    throw error;
  }
}