import { db } from "../server/db";
import { users, clients, shoots, images } from "../shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function seedData() {
  console.log("Starting database seed...");

  try {
    // Create test users
    const hashedPassword = await bcrypt.hash("password123", 10);
    
    const [staffUser] = await db.insert(users).values({
      email: "admin@slyfoxstudios.co.za",
      password: hashedPassword,
      role: "staff"
    }).returning();

    const [clientUser] = await db.insert(users).values({
      email: "client@example.com",
      password: hashedPassword,
      role: "client"
    }).returning();

    console.log("✓ Created users");

    // Create test clients
    const [testClient] = await db.insert(clients).values({
      name: "Sarah Johnson",
      email: "sarah@example.com",
      phone: "+27 83 123 4567",
      address: "123 Main Street, Cape Town, 8001",
      slug: "sarah-johnson",
      userId: clientUser.id
    }).returning();

    const [testClient2] = await db.insert(clients).values({
      name: "Michael Smith",
      email: "michael@example.com", 
      phone: "+27 82 987 6543",
      address: "456 Oak Avenue, Stellenbosch, 7600",
      slug: "michael-smith",
      userId: clientUser.id
    }).returning();

    console.log("✓ Created clients");

    // Create test shoots with gallery customization settings
    const [portraitShoot] = await db.insert(shoots).values({
      clientId: testClient.id,
      title: "Sarah's Portrait Session",
      description: "A beautiful outdoor portrait session in Kirstenbosch Gardens",
      shootType: "photography",
      shootDate: new Date("2024-01-15"),
      location: "Kirstenbosch Botanical Gardens, Cape Town",
      notes: "Golden hour session with natural lighting",
      customSlug: "sarah-portraits-2024",
      customTitle: "Golden Hour Portraits",
      isPrivate: false,
      backgroundColor: "white",
      layoutType: "masonry",
      borderRadius: 12,
      imagePadding: 8,
      seoTags: "portrait photography cape town kirstenbosch natural light"
    }).returning();

    const [weddingShoot] = await db.insert(shoots).values({
      clientId: testClient2.id,
      title: "Michael & Emma's Wedding",
      description: "A romantic wedding celebration at La Paris Estate",
      shootType: "photography",
      shootDate: new Date("2024-02-20"),
      location: "La Paris Estate, Franschhoek",
      notes: "Full day coverage from prep to reception",
      customSlug: "michael-emma-wedding",
      customTitle: "A Love Story in Franschhoek",
      isPrivate: false,
      backgroundColor: "black",
      layoutType: "square",
      borderRadius: 6,
      imagePadding: 4,
      seoTags: "wedding photography franschhoek la paris estate"
    }).returning();

    const [familyShoot] = await db.insert(shoots).values({
      clientId: testClient.id,
      title: "Johnson Family Photos",
      description: "Annual family portrait session at the beach",
      shootType: "photography", 
      shootDate: new Date("2024-03-10"),
      location: "Camps Bay Beach, Cape Town",
      notes: "Beach session during sunset",
      customSlug: "johnson-family-2024",
      customTitle: "Family Moments by the Sea",
      isPrivate: false,
      backgroundColor: "dark-grey",
      layoutType: "masonry",
      borderRadius: 20,
      imagePadding: 12,
      seoTags: "family photography camps bay beach sunset cape town"
    }).returning();

    console.log("✓ Created shoots");

    // Create test images with placeholder URLs that will work
    const sampleImages = [
      // Portrait shoot images
      {
        shootId: portraitShoot.id,
        filename: "sarah-portrait-01.jpg",
        storagePath: "https://picsum.photos/400/600?random=1",
        thumbnailPath: "https://picsum.photos/200/300?random=1",
        sequence: 0,
        isPrivate: false,
        downloadCount: 0
      },
      {
        shootId: portraitShoot.id,
        filename: "sarah-portrait-02.jpg", 
        storagePath: "https://picsum.photos/600/400?random=2",
        thumbnailPath: "https://picsum.photos/300/200?random=2",
        sequence: 1,
        isPrivate: false,
        downloadCount: 0
      },
      {
        shootId: portraitShoot.id,
        filename: "sarah-portrait-03.jpg",
        storagePath: "https://picsum.photos/500/700?random=3", 
        thumbnailPath: "https://picsum.photos/250/350?random=3",
        sequence: 2,
        isPrivate: false,
        downloadCount: 0
      },
      {
        shootId: portraitShoot.id,
        filename: "sarah-portrait-04.jpg",
        storagePath: "https://picsum.photos/450/600?random=4",
        thumbnailPath: "https://picsum.photos/225/300?random=4",
        sequence: 3,
        isPrivate: false,
        downloadCount: 0
      },
      
      // Wedding shoot images
      {
        shootId: weddingShoot.id,
        filename: "wedding-ceremony-01.jpg",
        storagePath: "https://picsum.photos/800/600?random=5",
        thumbnailPath: "https://picsum.photos/400/300?random=5",
        sequence: 0,
        isPrivate: false,
        downloadCount: 0
      },
      {
        shootId: weddingShoot.id,
        filename: "wedding-ceremony-02.jpg",
        storagePath: "https://picsum.photos/600/800?random=6", 
        thumbnailPath: "https://picsum.photos/300/400?random=6",
        sequence: 1,
        isPrivate: false,
        downloadCount: 0
      },
      {
        shootId: weddingShoot.id,
        filename: "wedding-reception-01.jpg",
        storagePath: "https://picsum.photos/700/500?random=7",
        thumbnailPath: "https://picsum.photos/350/250?random=7", 
        sequence: 2,
        isPrivate: false,
        downloadCount: 0
      },
      {
        shootId: weddingShoot.id,
        filename: "wedding-couples-01.jpg",
        storagePath: "https://picsum.photos/600/900?random=8",
        thumbnailPath: "https://picsum.photos/300/450?random=8",
        sequence: 3,
        isPrivate: false,
        downloadCount: 0
      },
      {
        shootId: weddingShoot.id,
        filename: "wedding-details-01.jpg",
        storagePath: "https://picsum.photos/500/500?random=9", 
        thumbnailPath: "https://picsum.photos/250/250?random=9",
        sequence: 4,
        isPrivate: false,
        downloadCount: 0
      },
      {
        shootId: weddingShoot.id,
        filename: "wedding-dance-01.jpg",
        storagePath: "https://picsum.photos/750/600?random=10",
        thumbnailPath: "https://picsum.photos/375/300?random=10",
        sequence: 5,
        isPrivate: false,
        downloadCount: 0
      },

      // Family shoot images
      {
        shootId: familyShoot.id,
        filename: "family-group-01.jpg",
        storagePath: "https://picsum.photos/800/550?random=11",
        thumbnailPath: "https://picsum.photos/400/275?random=11", 
        sequence: 0,
        isPrivate: false,
        downloadCount: 0
      },
      {
        shootId: familyShoot.id,
        filename: "family-candid-01.jpg",
        storagePath: "https://picsum.photos/600/800?random=12",
        thumbnailPath: "https://picsum.photos/300/400?random=12",
        sequence: 1,
        isPrivate: false,
        downloadCount: 0
      },
      {
        shootId: familyShoot.id,
        filename: "family-beach-01.jpg",
        storagePath: "https://picsum.photos/900/600?random=13",
        thumbnailPath: "https://picsum.photos/450/300?random=13",
        sequence: 2, 
        isPrivate: false,
        downloadCount: 0
      },
      {
        shootId: familyShoot.id,
        filename: "family-sunset-01.jpg",
        storagePath: "https://picsum.photos/700/700?random=14",
        thumbnailPath: "https://picsum.photos/350/350?random=14",
        sequence: 3,
        isPrivate: false,
        downloadCount: 0
      }
    ];

    await db.insert(images).values(sampleImages);

    // Set cover images for shoots
    const portraitImages = await db.select().from(images).where(eq(images.shootId, portraitShoot.id));
    const weddingImages = await db.select().from(images).where(eq(images.shootId, weddingShoot.id));
    const familyImages = await db.select().from(images).where(eq(images.shootId, familyShoot.id));

    await db.update(shoots).set({
      albumCoverId: portraitImages[0]?.id
    }).where(eq(shoots.id, portraitShoot.id));

    await db.update(shoots).set({
      albumCoverId: weddingImages[0]?.id  
    }).where(eq(shoots.id, weddingShoot.id));

    await db.update(shoots).set({
      albumCoverId: familyImages[0]?.id
    }).where(eq(shoots.id, familyShoot.id));

    console.log("✓ Created sample images and set cover images");
    console.log("\n🎉 Database seeded successfully!");
    console.log("\nTest accounts:");
    console.log("- Staff: admin@slyfoxstudios.co.za / password123");
    console.log("- Client: client@example.com / password123");
    console.log("\nSample galleries created with different customization settings:");
    console.log("- Portrait session (masonry layout, white background)");
    console.log("- Wedding photos (square layout, black background)"); 
    console.log("- Family photos (masonry layout, dark grey background)");

  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedData().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { seedData };