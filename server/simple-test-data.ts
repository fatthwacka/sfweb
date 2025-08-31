import { storage } from './storage.js';

export async function createSimpleTestData() {
  console.log('🔧 Creating simple test data...');
  
  try {
    // Get admin user ID
    const adminId = '070dae19-d4ce-4fe0-b3d4-a090fa3ece3a';
    
    // 1. Create test clients
    console.log('Creating clients...');
    const client1 = await storage.createClient({
      name: 'Sarah & Tom Johnson',
      slug: 'sarah-tom-wedding',
      email: 'sarah.johnson@email.com',
      userId: null,
      createdBy: adminId
    });
    
    const client2 = await storage.createClient({
      name: 'Wilson Family',
      slug: 'wilson-family-portraits',
      email: 'mike.wilson@email.com',
      userId: null,
      createdBy: adminId
    });
    
    const client3 = await storage.createClient({
      name: 'Durban Corporate',
      slug: 'durban-corporate-headshots',
      email: 'corporate@durban.com',
      userId: null,
      createdBy: adminId
    });
    
    console.log(`✅ Created ${3} clients`);
    
    // 2. Create shoots for each client
    console.log('Creating shoots...');
    const shoots = [];
    
    // Sarah & Tom - Wedding shoots
    const weddingShoot = await storage.createShoot({
      clientId: client1.id.toString(),
      title: 'Wedding Ceremony & Reception',
      description: 'Beautiful winter wedding at Stellenbosch vineyard with mountain views',
      isPrivate: true,
      seoTags: ['wedding', 'stellenbosch', 'vineyard'],
      createdBy: adminId
    });
    shoots.push(weddingShoot);
    
    const engagementShoot = await storage.createShoot({
      clientId: client1.id.toString(),
      title: 'Engagement Session',
      description: 'Romantic engagement photos at Durban Botanic Gardens Gardens',
      isPrivate: true,
      seoTags: ['engagement', 'durban botanic gardens', 'couple'],
      createdBy: adminId
    });
    shoots.push(engagementShoot);
    
    // Wilson Family - Portrait session
    const familyShoot = await storage.createShoot({
      clientId: client2.id.toString(),
      title: 'Family Portrait Session',
      description: 'Multi-generational family photos at uShaka Beach Beach',
      isPrivate: true,
      seoTags: ['family', 'beach', 'portraits'],
      createdBy: adminId
    });
    shoots.push(familyShoot);
    
    // Corporate - Headshots and Event
    const headshotShoot = await storage.createShoot({
      clientId: client3.id.toString(),
      title: 'Executive Headshots 2024',
      description: 'Professional headshots for company leadership team',
      isPrivate: true,
      seoTags: ['corporate', 'headshots', 'professional'],
      createdBy: adminId
    });
    shoots.push(headshotShoot);
    
    const eventShoot = await storage.createShoot({
      clientId: client3.id.toString(),
      title: 'Annual Conference Coverage',
      description: 'Full event documentation of company annual conference',
      isPrivate: true,
      seoTags: ['conference', 'event', 'corporate'],
      createdBy: adminId
    });
    shoots.push(eventShoot);
    
    console.log(`✅ Created ${shoots.length} shoots`);
    
    // 3. Create test images for each shoot
    console.log('Creating test images...');
    let totalImages = 0;
    
    // Create 10-15 images per shoot using Unsplash URLs
    const unsplashImages = [
      'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
      'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800',
      'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800',
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800',
      'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=800',
      'https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?w=800',
      'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800',
      'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=800',
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800',
      'https://images.unsplash.com/photo-1502635385003-ee1e6a1a742d?w=800',
      'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800',
      'https://images.unsplash.com/photo-1525258804970-b6bd2c24e514?w=800',
      'https://images.unsplash.com/photo-1455849318743-b2233052fcff?w=800',
      'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800',
      'https://images.unsplash.com/photo-1519741347686-c1e0aadf4611?w=800'
    ];
    
    for (let shootIndex = 0; shootIndex < shoots.length; shootIndex++) {
      const shoot = shoots[shootIndex];
      const imageCount = Math.floor(Math.random() * 6) + 10; // 10-15 images
      
      for (let i = 0; i < imageCount; i++) {
        const imageUrl = unsplashImages[i % unsplashImages.length];
        
        try {
          await storage.createImage({
            shootId: shoot.id,
            filename: `photo_${i + 1}.jpg`,
            storagePath: imageUrl,
            originalName: `DSC_${String(i + 1).padStart(4, '0')}.jpg`,
            fileSize: Math.floor(Math.random() * 2000000) + 500000, // 0.5-2.5MB
            isPrivate: false,
            uploadOrder: i + 1,
            downloadCount: Math.floor(Math.random() * 10)
          });
          totalImages++;
        } catch (error) {
          console.error(`Failed to create image ${i + 1} for shoot ${shoot.title}:`, error);
        }
      }
      
      console.log(`  ✅ Created ${imageCount} images for "${shoot.title}"`);
    }
    
    console.log(`✅ Created ${totalImages} total images`);
    
    // 4. Verify connections
    console.log('🔍 Verifying data connections...');
    
    const allClients = await storage.getClients();
    console.log(`Found ${allClients.length} clients in database`);
    
    for (const client of allClients) {
      const clientShoots = await storage.getShootsByClient(client.id.toString());
      console.log(`  Client "${client.name}" has ${clientShoots.length} shoots`);
      
      for (const shoot of clientShoots) {
        const shootImages = await storage.getImagesByShoot(shoot.id);
        console.log(`    Shoot "${shoot.title}" has ${shootImages.length} images`);
      }
    }
    
    return {
      clients: allClients.length,
      shoots: shoots.length,
      images: totalImages
    };
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    throw error;
  }
}