import { db } from './db.js';
import { profiles, clients, shoots, images, analytics, favorites } from '@shared/schema.js';
import { seedInitialUsers } from './supabase-auth.js';
import { sql } from 'drizzle-orm';

export async function seedCompleteDatabase() {
  console.log('🌱 Starting comprehensive database seeding...');

  try {
    // Step 1: Create users in Supabase auth system
    console.log('Creating users in Supabase auth...');
    await seedInitialUsers();

    // Step 2: Get profile IDs for foreign key references
    const allProfiles = await db.select().from(profiles);
    console.log(`Found ${allProfiles.length} profiles`);

    if (allProfiles.length === 0) {
      throw new Error('No profiles found - user creation may have failed');
    }

    // Find staff and client profiles
    const staffProfiles = allProfiles.filter(p => p.role === 'staff');
    const clientProfiles = allProfiles.filter(p => p.role === 'client');

    if (staffProfiles.length === 0) {
      throw new Error('No staff profiles found');
    }

    // Step 3: Create clients
    console.log('Creating clients...');
    const clientsData = [
      {
        name: 'Sarah & Tom Johnson',
        slug: 'sarah-tom-johnson',
        email: 'sarah.johnson@email.com',
        userId: clientProfiles.find(p => p.email === 'sarah.johnson@email.com')?.id || null,
        createdBy: staffProfiles[0].id
      },
      {
        name: 'Wilson Family',
        slug: 'wilson-family',
        email: 'mike.wilson@email.com',
        userId: clientProfiles.find(p => p.email === 'mike.wilson@email.com')?.id || null,
        createdBy: staffProfiles[1]?.id || staffProfiles[0].id
      },
      {
        name: 'Demo Gallery Client',
        slug: 'demo-gallery',
        email: 'demo@slyfox.co.za',
        userId: clientProfiles.find(p => p.email === 'demo@slyfox.co.za')?.id || null,
        createdBy: staffProfiles[0].id
      },
      {
        name: 'Durban Corporate',
        slug: 'durban-corporate',
        email: 'events@durbancorp.co.za',
        userId: null,
        createdBy: staffProfiles[1]?.id || staffProfiles[0].id
      },
      {
        name: 'Mountain View Wedding',
        slug: 'mountain-view-wedding',
        email: 'info@mountainviewvenue.co.za',
        userId: null,
        createdBy: staffProfiles[0].id
      }
    ];

    const createdClients = await db.insert(clients).values(clientsData).returning();
    console.log(`✅ Created ${createdClients.length} clients`);

    // Step 4: Create shoots
    console.log('Creating shoots...');
    const shootsData = [
      {
        clientId: createdClients[0].id.toString(),
        title: 'Sarah & Tom - Engagement Session',
        description: 'Romantic engagement shoot at uShaka Beach beach during golden hour. Captured their natural chemistry and love story with Durban\'s stunning coastline as backdrop.',
        isPrivate: false,
        seoTags: ['engagement', 'couples', 'ushaka beach', 'beach', 'sunset', 'durban', 'romantic'],
        viewCount: 45,
        createdBy: staffProfiles[0].id
      },
      {
        clientId: createdClients[1].id.toString(),
        title: 'Wilson Family Portrait Session',
        description: 'Fun family portrait session in Durban Botanic Gardens Botanical Gardens. Three generations celebrating grandmother\'s 80th birthday with natural, candid moments.',
        isPrivate: false,
        seoTags: ['family', 'portraits', 'durban botanic gardens', 'generations', 'birthday', 'durban', 'natural'],
        viewCount: 32,
        createdBy: staffProfiles[1]?.id || staffProfiles[0].id
      },
      {
        clientId: createdClients[2].id.toString(),
        title: 'Demo Portfolio Showcase',
        description: 'Curated collection showcasing SlyFox Studios\' diverse photography styles and technical expertise across various genres and lighting conditions.',
        isPrivate: false,
        seoTags: ['portfolio', 'showcase', 'diverse', 'professional', 'studio work', 'outdoor'],
        viewCount: 78,
        createdBy: staffProfiles[0].id
      },
      {
        clientId: createdClients[3].id.toString(),
        title: 'Corporate Event - Annual Gala',
        description: 'Professional documentation of Durban Corporate\'s annual gala dinner. Executive headshots, award presentations, and networking moments captured.',
        isPrivate: true,
        seoTags: ['corporate', 'gala', 'professional', 'headshots', 'awards', 'networking'],
        viewCount: 12,
        createdBy: staffProfiles[1]?.id || staffProfiles[0].id
      },
      {
        clientId: createdClients[4].id.toString(),
        title: 'Mountain View Wedding - Sarah & James',
        description: 'Intimate wedding ceremony overlooking uMhlanga Ridge. Captured ceremony, reception, and couple portraits with dramatic mountain backdrop.',
        isPrivate: false,
        seoTags: ['wedding', 'mountain view', 'table mountain', 'ceremony', 'intimate', 'durban', 'couples'],
        viewCount: 156,
        createdBy: staffProfiles[0].id
      }
    ];

    const createdShoots = await db.insert(shoots).values(shootsData).returning();
    console.log(`✅ Created ${createdShoots.length} shoots`);

    // Step 5: Create images
    console.log('Creating images...');
    const imagesData = [
      // Engagement Session Images
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

      // Family Portrait Images
      {
        shootId: createdShoots[1].id,
        filename: 'family-durban botanic gardens-01.jpg',
        storagePath: 'https://images.unsplash.com/photo-1511895426328-dc8714efa2d8?w=800&h=600&fit=crop',
        originalName: 'family-durban botanic gardens-01.jpg',
        fileSize: 3500000,
        isPrivate: false,
        uploadOrder: 1,
        downloadCount: 18
      },
      {
        shootId: createdShoots[1].id,
        filename: 'family-durban botanic gardens-02.jpg',
        storagePath: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=800&h=600&fit=crop',
        originalName: 'family-durban botanic gardens-02.jpg',
        fileSize: 3100000,
        isPrivate: false,
        uploadOrder: 2,
        downloadCount: 25
      },
      {
        shootId: createdShoots[1].id,
        filename: 'family-durban botanic gardens-03.jpg',
        storagePath: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=600&fit=crop',
        originalName: 'family-durban botanic gardens-03.jpg',
        fileSize: 2700000,
        isPrivate: false,
        uploadOrder: 3,
        downloadCount: 14
      },

      // Portfolio Showcase Images
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
        filename: 'portfolio-landscape-durban-01.jpg',
        storagePath: 'https://images.unsplash.com/photo-1580692270804-1404f9846f96?w=1200&h=800&fit=crop',
        originalName: 'portfolio-landscape-durban-01.jpg',
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

      // Corporate Event Images
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

      // Wedding Images
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

    // Step 6: Update shoot banner images
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

    // Step 7: Create analytics
    console.log('Creating analytics...');
    const analyticsData = [];
    const actionTypes = ['view_image', 'download_image', 'view_gallery', 'share_gallery'];
    
    for (let i = 0; i < 50; i++) {
      const randomClient = clientProfiles[Math.floor(Math.random() * clientProfiles.length)];
      const randomShoot = createdShoots[Math.floor(Math.random() * createdShoots.length)];
      const randomImage = createdImages[Math.floor(Math.random() * createdImages.length)];
      const randomAction = actionTypes[Math.floor(Math.random() * actionTypes.length)];
      
      analyticsData.push({
        userId: randomClient.id,
        shootId: randomShoot.id,
        imageId: randomImage.id,
        actionType: randomAction,
        ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (compatible; SlyFoxApp/1.0)'
      });
    }

    const createdAnalytics = await db.insert(analytics).values(analyticsData).returning();
    console.log(`✅ Created ${createdAnalytics.length} analytics records`);

    // Step 8: Create favorites
    console.log('Creating favorites...');
    const favoritesData = [];
    
    for (let i = 0; i < 20; i++) {
      const randomClient = clientProfiles[Math.floor(Math.random() * clientProfiles.length)];
      const randomImage = createdImages[Math.floor(Math.random() * createdImages.length)];
      
      favoritesData.push({
        userId: randomClient.id,
        imageId: randomImage.id
      });
    }

    const createdFavorites = await db.insert(favorites).values(favoritesData).returning();
    console.log(`✅ Created ${createdFavorites.length} favorites`);

    console.log('🎉 Database seeding completed successfully!');
    
    return {
      profiles: allProfiles.length,
      clients: createdClients.length,
      shoots: createdShoots.length,
      images: createdImages.length,
      analytics: createdAnalytics.length,
      favorites: createdFavorites.length
    };

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
}