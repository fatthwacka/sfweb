import { 
  profiles, users, clients, shoots, images, packages, analytics, favorites, bookings,
  type Profile, type InsertProfile,
  type User, type InsertUser, 
  type Client, type InsertClient,
  type Shoot, type InsertShoot,
  type Image, type InsertImage,
  type Package, type InsertPackage,
  type Analytics, type InsertAnalytics,
  type Favorite, type InsertFavorite,
  type Booking, type InsertBooking,
  type UpdateShootCustomization
} from "@shared/schema";

export interface IStorage {
  // Profiles (main user system - UUIDs)
  getProfile(id: string): Promise<Profile | undefined>;
  getProfileByEmail(email: string): Promise<Profile | undefined>;
  getAllProfiles(): Promise<Profile[]>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(id: string, updates: Partial<InsertProfile>): Promise<Profile | undefined>;
  deleteProfile(id: string): Promise<boolean>;
  
  // Legacy Users (for backwards compatibility)
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Clients (integers)
  getClient(id: number): Promise<Client | undefined>;
  getClientBySlug(slug: string): Promise<Client | undefined>;
  getClients(): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, updates: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;
  
  // Shoots (UUIDs)
  getShoot(id: string): Promise<Shoot | undefined>;
  getShootsByClient(clientId: string): Promise<Shoot[]>;
  getPublicShoots(): Promise<Shoot[]>;
  createShoot(shoot: InsertShoot): Promise<Shoot>;
  updateShoot(id: string, updates: Partial<InsertShoot>): Promise<Shoot | undefined>;
  updateShootCustomization(id: string, data: UpdateShootCustomization): Promise<Shoot | undefined>;
  deleteShoot(id: string): Promise<boolean>;
  
  // Images (UUIDs)
  getImage(id: string): Promise<Image | undefined>;
  getImagesByShoot(shootId: string): Promise<Image[]>;
  createImage(image: InsertImage): Promise<Image>;
  updateImage(id: string, updates: Partial<InsertImage>): Promise<Image | undefined>;
  deleteImage(id: string): Promise<boolean>;
  
  // Packages (UUIDs)
  getPackages(): Promise<Package[]>;
  getPackagesByCategory(category: string): Promise<Package[]>;
  createPackage(pkg: InsertPackage): Promise<Package>;
  
  // Analytics (UUIDs)
  createAnalytics(analytics: InsertAnalytics): Promise<Analytics>;
  getAnalyticsByUser(userId: string): Promise<Analytics[]>;
  
  // Favorites (UUIDs)
  getFavoritesByUser(userId: string): Promise<Favorite[]>;
  createFavorite(favorite: InsertFavorite): Promise<Favorite>;
  deleteFavorite(userId: string, imageId: string): Promise<boolean>;
  
  // Bookings (integers)
  createBooking(booking: InsertBooking): Promise<Booking>;
  getBookings(): Promise<Booking[]>;
  updateBooking(id: number, updates: Partial<InsertBooking>): Promise<Booking | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private clients: Map<string, Client> = new Map();
  private shoots: Map<string, Shoot> = new Map();
  private images: Map<string, Image> = new Map();
  private packages: Map<number, Package> = new Map();
  private analytics: Map<string, Analytics> = new Map();
  private favorites: Map<string, Favorite> = new Map();
  private bookings: Map<string, Booking> = new Map();
  
  private currentUserId = 1;
  private currentClientId = 1;
  private currentShootId = 1;
  private currentImageId = 1;
  private currentPackageId = 1;
  private currentAnalyticsId = 1;
  private currentFavoriteId = 1;
  private currentBookingId = 1;

  constructor() {
    this.initializeTestData();
  }

  private async initializeTestData() {
    // Create test users
    const staffUser: User = {
      id: this.currentUserId++,
      email: "admin@slyfoxstudios.co.za",
      password: "hashedpassword123", // In real app this would be hashed
      role: "staff",
      profileImage: null,
      bannerImage: null,
      themePreference: "dark",
      createdAt: new Date()
    };
    this.users.set(staffUser.id, staffUser);

    // Create super admin user (dax@slyfox.co.za)
    const superAdminUser: User = {
      id: this.currentUserId++,
      email: "dax@slyfox.co.za",
      password: "slyfox2025",
      role: "super_admin",
      profileImage: null,
      bannerImage: null,
      themePreference: "dark",
      createdAt: new Date()
    };
    this.users.set(superAdminUser.id, superAdminUser);

    // Create staff user (eben@slyfox.co.za)
    const staffUser2: User = {
      id: this.currentUserId++,
      email: "eben@slyfox.co.za",
      password: "slyfox2025",
      role: "staff",
      profileImage: null,
      bannerImage: null,
      themePreference: "dark",
      createdAt: new Date()
    };
    this.users.set(staffUser2.id, staffUser2);

    // Create client user (demo@slyfox.co.za)
    const clientUser: User = {
      id: this.currentUserId++,
      email: "demo@slyfox.co.za",
      password: "slyfox2025",
      role: "client",
      profileImage: null,
      bannerImage: null,
      themePreference: "dark",
      createdAt: new Date()
    };
    this.users.set(clientUser.id, clientUser);

    // Create Jessica Martinez client user
    const jessicaUser: User = {
      id: this.currentUserId++,
      email: "client2@slyfox.co.za",
      password: "slyfox2025",
      role: "client",
      profileImage: null,
      bannerImage: null,
      themePreference: "dark",
      createdAt: new Date()
    };
    this.users.set(jessicaUser.id, jessicaUser);

    // Create demo client record
    const demoClient: Client = {
      id: this.currentClientId++,
      name: "Demo Client",
      email: "demo@slyfox.co.za",
      phone: "+27 82 555 0123",
      address: "123 Demo Street, Cape Town, 8001",
      slug: "demo-client",
      userId: clientUser.id,
      createdAt: new Date()
    };
    this.clients.set(demoClient.id, demoClient);

    // Create Jessica Martinez client record
    const jessicaClient: Client = {
      id: this.currentClientId++,
      name: "Jessica Martinez",
      email: "client2@slyfox.co.za",
      phone: "+27 82 456 7890",
      address: "123 Beach Road, Umhlanga, Durban",
      slug: "jessica-martinez",
      userId: jessicaUser.id,
      createdAt: new Date()
    };
    this.clients.set(jessicaClient.id, jessicaClient);

    // Create test clients
    const testClient1: Client = {
      id: this.currentClientId++,
      name: "Sarah Johnson",
      email: "sarah@example.com",
      phone: "+27 83 123 4567",
      address: "123 Main Street, Cape Town, 8001",
      slug: "sarah-johnson",
      userId: clientUser.id,
      createdAt: new Date()
    };
    this.clients.set(testClient1.id, testClient1);

    const testClient2: Client = {
      id: this.currentClientId++,
      name: "Michael Smith", 
      email: "michael@example.com",
      phone: "+27 82 987 6543",
      address: "456 Oak Avenue, Stellenbosch, 7600",
      slug: "michael-smith",
      userId: null, // No associated user account
      createdAt: new Date()
    };
    this.clients.set(testClient2.id, testClient2);

    // Create demo client shoot
    const demoShoot: Shoot = {
      id: this.currentShootId++,
      clientId: demoClient.id,
      title: "Demo Portfolio Session",
      description: "A sample gallery showcasing SlyFox Studios' photography work",
      shootType: "photography",
      shootDate: new Date("2024-01-20"),
      location: "V&A Waterfront, Cape Town",
      notes: "Demo shoot for client gallery testing",
      customSlug: "demo-portfolio-2024",
      customTitle: "SlyFox Demo Gallery",
      isPrivate: false,
      backgroundColor: "white",
      layoutType: "masonry",
      borderRadius: 12,
      imagePadding: 8,
      albumCoverId: null,
      viewCount: 0,
      seoTags: "demo portfolio photography cape town slyfox studios",
      createdAt: new Date()
    };
    this.shoots.set(demoShoot.id, demoShoot);

    // Create test shoots with different customization settings
    const portraitShoot: Shoot = {
      id: this.currentShootId++,
      clientId: testClient1.id,
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
      albumCoverId: null,
      viewCount: 0,
      seoTags: "portrait photography cape town kirstenbosch natural light",
      createdAt: new Date()
    };
    this.shoots.set(portraitShoot.id, portraitShoot);

    const weddingShoot: Shoot = {
      id: this.currentShootId++,
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
      albumCoverId: null,
      viewCount: 0,
      seoTags: "wedding photography franschhoek la paris estate",
      createdAt: new Date()
    };
    this.shoots.set(weddingShoot.id, weddingShoot);

    const familyShoot: Shoot = {
      id: this.currentShootId++,
      clientId: testClient1.id,
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
      albumCoverId: null,
      viewCount: 0,
      seoTags: "family photography camps bay beach sunset cape town",
      createdAt: new Date()
    };
    this.shoots.set(familyShoot.id, familyShoot);

    // Create sample images using Unsplash for realistic photography
    const sampleImages = [
      // Portrait shoot images
      { shootId: portraitShoot.id, filename: "sarah-portrait-01.jpg", storagePath: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop&crop=face", sequence: 0 },
      { shootId: portraitShoot.id, filename: "sarah-portrait-02.jpg", storagePath: "https://images.unsplash.com/photo-1506863530036-1efeddceb993?w=600&h=400&fit=crop&crop=face", sequence: 1 },
      { shootId: portraitShoot.id, filename: "sarah-portrait-03.jpg", storagePath: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=500&h=700&fit=crop&crop=face", sequence: 2 },
      { shootId: portraitShoot.id, filename: "sarah-portrait-04.jpg", storagePath: "https://images.unsplash.com/photo-1494790108755-2616b612b8aa?w=450&h=600&fit=crop&crop=face", sequence: 3 },
      
      // Wedding shoot images
      { shootId: weddingShoot.id, filename: "wedding-ceremony-01.jpg", storagePath: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop", sequence: 0 },
      { shootId: weddingShoot.id, filename: "wedding-ceremony-02.jpg", storagePath: "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=600&h=800&fit=crop", sequence: 1 },
      { shootId: weddingShoot.id, filename: "wedding-reception-01.jpg", storagePath: "https://images.unsplash.com/photo-1545291730-faff8ca1d4b0?w=700&h=500&fit=crop", sequence: 2 },
      { shootId: weddingShoot.id, filename: "wedding-couples-01.jpg", storagePath: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&h=900&fit=crop", sequence: 3 },
      { shootId: weddingShoot.id, filename: "wedding-details-01.jpg", storagePath: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=500&h=500&fit=crop", sequence: 4 },
      { shootId: weddingShoot.id, filename: "wedding-dance-01.jpg", storagePath: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=750&h=600&fit=crop", sequence: 5 },

      // Family shoot images  
      { shootId: familyShoot.id, filename: "family-group-01.jpg", storagePath: "https://images.unsplash.com/photo-1511895426328-dc8714efa2d8?w=800&h=550&fit=crop", sequence: 0 },
      { shootId: familyShoot.id, filename: "family-candid-01.jpg", storagePath: "https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=600&h=800&fit=crop", sequence: 1 },
      { shootId: familyShoot.id, filename: "family-beach-01.jpg", storagePath: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=900&h=600&fit=crop", sequence: 2 },
      { shootId: familyShoot.id, filename: "family-sunset-01.jpg", storagePath: "https://images.unsplash.com/photo-1609220136736-443140cffec6?w=700&h=700&fit=crop", sequence: 3 }
    ];

    // Add images to storage
    for (const imgData of sampleImages) {
      const image: Image = {
        id: this.currentImageId++,
        shootId: imgData.shootId,
        filename: imgData.filename,
        storagePath: imgData.storagePath,
        thumbnailPath: imgData.storagePath + "&thumb=true",
        sequence: imgData.sequence,
        isPrivate: false,
        downloadCount: Math.floor(Math.random() * 20),
        createdAt: new Date()
      };
      this.images.set(image.id, image);
    }

    // Set cover images for shoots
    const portraitImages = Array.from(this.images.values()).filter(img => img.shootId === portraitShoot.id);
    const weddingImages = Array.from(this.images.values()).filter(img => img.shootId === weddingShoot.id);
    const familyImages = Array.from(this.images.values()).filter(img => img.shootId === familyShoot.id);

    if (portraitImages[0]) {
      portraitShoot.albumCoverId = portraitImages[0].id;
      this.shoots.set(portraitShoot.id, portraitShoot);
    }
    if (weddingImages[0]) {
      weddingShoot.albumCoverId = weddingImages[0].id;
      this.shoots.set(weddingShoot.id, weddingShoot);
    }
    if (familyImages[0]) {
      familyShoot.albumCoverId = familyImages[0].id;
      this.shoots.set(familyShoot.id, familyShoot);
    }

    // Create sample packages with correct price format (string)
    const packages = [
      { id: this.currentPackageId++, name: "Essential", description: "Perfect for couples and small gatherings", price: "1500.00", features: ["2 hour session", "50 edited photos", "Online gallery", "Print release"], category: "photography", createdAt: new Date() },
      { id: this.currentPackageId++, name: "Premium", description: "Comprehensive coverage for your special day", price: "3500.00", features: ["6 hour session", "150 edited photos", "Online gallery", "Print release", "USB drive"], category: "photography", createdAt: new Date() },
      { id: this.currentPackageId++, name: "Luxury", description: "Full-day premium experience with all extras", price: "5500.00", features: ["8 hour session", "300+ edited photos", "Online gallery", "Print release", "USB drive", "Photo album"], category: "photography", createdAt: new Date() }
    ];

    packages.forEach(pkg => this.packages.set(pkg.id, pkg));

    console.log("✅ Test data initialized with realistic galleries and customization settings");
  }



  private seedData() {
    // Create staff users
    const staffEmails = [
      "dax.tucker@gmail.com",
      "dax@slyfox.co.za", 
      "eben@slyfox.co.za",
      "kyle@slyfox.co.za"
    ];

    staffEmails.forEach(email => {
      const user: User = {
        id: this.currentUserId++,
        email,
        password: "hashed_password",
        role: "staff",
        profileImage: null,
        bannerImage: null,
        themePreference: "dark",
        createdAt: new Date()
      };
      this.users.set(user.id, user);
    });

    // Create sample packages
    const photographyPackages = [
      {
        name: "Essential",
        description: "Perfect for smaller events",
        price: "2500.00",
        features: ["2-3 hour coverage", "50-100 edited photos", "Online gallery", "High-res downloads", "Basic editing"],
        category: "photography"
      },
      {
        name: "Premium", 
        description: "Perfect for weddings & events",
        price: "5500.00",
        features: ["6-8 hour coverage", "200-400 edited photos", "Premium online gallery", "All high-res downloads", "Advanced editing", "USB drive included"],
        category: "photography"
      },
      {
        name: "Elite",
        description: "Complete luxury experience", 
        price: "9500.00",
        features: ["Full day coverage", "500+ edited photos", "Luxury gallery experience", "Multiple format downloads", "Cinema-grade editing", "2 photographers included", "Custom photo album"],
        category: "photography"
      }
    ];

    photographyPackages.forEach(pkg => {
      const packageItem: Package = {
        id: this.currentPackageId++,
        name: pkg.name,
        description: pkg.description,
        price: pkg.price,
        features: pkg.features,
        category: pkg.category,
        createdAt: new Date()
      };
      this.packages.set(packageItem.id, packageItem);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      ...insertUser,
      id: this.currentUserId++,
      profileImage: insertUser.profileImage || null,
      bannerImage: insertUser.bannerImage || null,
      themePreference: insertUser.themePreference || null,
      createdAt: new Date(),
      role: insertUser.role || 'client'
    };
    this.users.set(user.id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  // Client methods
  async getClient(id: number): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async getClientBySlug(slug: string): Promise<Client | undefined> {
    return Array.from(this.clients.values()).find(client => client.slug === slug);
  }

  async getClients(): Promise<Client[]> {
    return Array.from(this.clients.values());
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const slug = insertClient.name.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const client: Client = {
      ...insertClient,
      id: this.currentClientId++,
      slug,
      email: insertClient.email || null,
      phone: insertClient.phone || null,
      address: insertClient.address || null,
      userId: insertClient.userId || null,
      createdAt: new Date()
    };
    this.clients.set(client.id, client);
    return client;
  }

  async updateClient(id: number, updates: Partial<InsertClient>): Promise<Client | undefined> {
    const client = this.clients.get(id);
    if (!client) return undefined;
    
    const updatedClient = { ...client, ...updates };
    this.clients.set(id, updatedClient);
    return updatedClient;
  }

  async deleteClient(id: number): Promise<boolean> {
    return this.clients.delete(id);
  }

  // Shoot methods
  async getShoot(id: number): Promise<Shoot | undefined> {
    return this.shoots.get(id);
  }

  async getShootsByClient(clientId: number): Promise<Shoot[]> {
    return Array.from(this.shoots.values()).filter(shoot => shoot.clientId === clientId);
  }

  async getPublicShoots(): Promise<Shoot[]> {
    return Array.from(this.shoots.values()).filter(shoot => !shoot.isPrivate);
  }

  async createShoot(insertShoot: InsertShoot): Promise<Shoot> {
    const shoot: Shoot = {
      ...insertShoot,
      id: this.currentShootId++,
      description: insertShoot.description || null,
      shootDate: insertShoot.shootDate || null,
      location: insertShoot.location || null,
      notes: insertShoot.notes || null,
      customTitle: insertShoot.customTitle || null,
      albumCoverId: insertShoot.albumCoverId || null,
      seoTags: insertShoot.seoTags || null,
      backgroundColor: insertShoot.backgroundColor || "white",
      layoutType: insertShoot.layoutType || "masonry",
      borderRadius: insertShoot.borderRadius || 8,
      imagePadding: insertShoot.imagePadding || 4,
      isPrivate: insertShoot.isPrivate ?? false,
      viewCount: 0,
      createdAt: new Date()
    };
    this.shoots.set(shoot.id, shoot);
    return shoot;
  }

  async updateShoot(id: number, updates: Partial<InsertShoot>): Promise<Shoot | undefined> {
    const shoot = this.shoots.get(id);
    if (!shoot) return undefined;
    
    const updatedShoot = { ...shoot, ...updates };
    this.shoots.set(id, updatedShoot);
    return updatedShoot;
  }

  async updateShootCustomization(id: number, data: UpdateShootCustomization): Promise<Shoot | undefined> {
    const shoot = this.shoots.get(id);
    if (!shoot) return undefined;
    
    const updatedShoot = { ...shoot, ...data };
    this.shoots.set(id, updatedShoot);
    return updatedShoot;
  }

  async deleteShoot(id: number): Promise<boolean> {
    return this.shoots.delete(id);
  }

  // Image methods
  async getImage(id: number): Promise<Image | undefined> {
    return this.images.get(id);
  }

  async getImagesByShoot(shootId: number): Promise<Image[]> {
    return Array.from(this.images.values())
      .filter(image => image.shootId === shootId)
      .sort((a, b) => a.sequence - b.sequence);
  }

  async createImage(insertImage: InsertImage): Promise<Image> {
    const image: Image = {
      ...insertImage,
      id: this.currentImageId++,
      thumbnailPath: insertImage.thumbnailPath || null,
      isPrivate: insertImage.isPrivate || false,
      sequence: insertImage.sequence || 0,
      downloadCount: 0,
      createdAt: new Date()
    };
    this.images.set(image.id, image);
    return image;
  }

  async updateImage(id: number, updates: Partial<InsertImage>): Promise<Image | undefined> {
    const image = this.images.get(id);
    if (!image) return undefined;
    
    const updatedImage = { ...image, ...updates };
    this.images.set(id, updatedImage);
    return updatedImage;
  }

  async deleteImage(id: number): Promise<boolean> {
    return this.images.delete(id);
  }

  // Package methods
  async getPackages(): Promise<Package[]> {
    return Array.from(this.packages.values());
  }

  async getPackagesByCategory(category: string): Promise<Package[]> {
    try {
      const packages = Array.from(this.packages.values()).filter(pkg => pkg.category === category);
      console.log(`Found ${packages.length} packages for category: ${category}`);
      return packages;
    } catch (error) {
      console.error("Error getting packages by category:", error);
      return [];
    }
  }

  async createPackage(insertPackage: InsertPackage): Promise<Package> {
    const pkg: Package = {
      ...insertPackage,
      id: this.currentPackageId++,
      createdAt: new Date()
    };
    this.packages.set(pkg.id, pkg);
    return pkg;
  }

  // Analytics methods
  async createAnalytics(insertAnalytics: InsertAnalytics): Promise<Analytics> {
    const analytics: Analytics = {
      ...insertAnalytics,
      id: this.currentAnalyticsId++,
      userId: insertAnalytics.userId || null,
      shootId: insertAnalytics.shootId || null,
      timestamp: new Date()
    };
    this.analytics.set(analytics.id, analytics);
    return analytics;
  }

  async getAnalyticsByUser(userId: number): Promise<Analytics[]> {
    return Array.from(this.analytics.values()).filter(a => a.userId === userId);
  }

  // Favorites methods
  async getFavoritesByUser(userId: number): Promise<Favorite[]> {
    return Array.from(this.favorites.values()).filter(f => f.userId === userId);
  }

  async createFavorite(insertFavorite: InsertFavorite): Promise<Favorite> {
    const favorite: Favorite = {
      ...insertFavorite,
      id: this.currentFavoriteId++,
      createdAt: new Date()
    };
    this.favorites.set(favorite.id, favorite);
    return favorite;
  }

  async deleteFavorite(userId: number, imageId: number): Promise<boolean> {
    const favorite = Array.from(this.favorites.values())
      .find(f => f.userId === userId && f.imageId === imageId);
    
    if (favorite) {
      return this.favorites.delete(favorite.id);
    }
    return false;
  }

  // Booking methods
  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const booking: Booking = {
      ...insertBooking,
      id: this.currentBookingId++,
      clientId: insertBooking.clientId || null,
      packageId: insertBooking.packageId || null,
      inquiryData: insertBooking.inquiryData || null,
      status: insertBooking.status || 'pending',
      createdAt: new Date()
    };
    this.bookings.set(booking.id, booking);
    return booking;
  }

  async getBookings(): Promise<Booking[]> {
    return Array.from(this.bookings.values());
  }

  async updateBooking(id: number, updates: Partial<InsertBooking>): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;
    
    const updatedBooking = { ...booking, ...updates };
    this.bookings.set(id, updatedBooking);
    return updatedBooking;
  }
}

import { PostgreSQLStorage } from "./pg-storage";

// Import Supabase storage
import { SupabaseStorage } from "./supabase-storage";

// Export a simple storage instance for now while debugging Supabase
export const storage: IStorage = {
  // User management
  async getAllUsers() { 
    return [
      { id: 1, email: "dax@slyfox.co.za", password: "slyfox2025", role: "staff", profileImage: null, bannerImage: null, themePreference: "dark", createdAt: new Date() },
      { id: 2, email: "eben@slyfox.co.za", password: "slyfox2025", role: "staff", profileImage: null, bannerImage: null, themePreference: "dark", createdAt: new Date() },
      { id: 3, email: "demo@slyfox.co.za", password: "slyfox2025", role: "client", profileImage: null, bannerImage: null, themePreference: "dark", createdAt: new Date() }
    ];
  },
  async getUserByEmail(email: string) {
    const users = await this.getAllUsers();
    return users.find(user => user.email === email);
  },
  async getUserById() { return undefined; },
  async createUser() { throw new Error("Not implemented in fallback storage"); },
  async updateUser() { throw new Error("Not implemented in fallback storage"); },
  async deleteUser() { return false; },

  // Profile management  
  async getAllProfiles() { return []; },
  async getProfileByEmail() { return undefined; },
  async getProfileById() { return undefined; },
  async createProfile() { throw new Error("Not implemented in fallback storage"); },
  async updateProfile() { throw new Error("Not implemented in fallback storage"); },
  async deleteProfile() { return false; },

  // Client management
  async getAllClients() { return []; },
  async getClientBySlug() { return undefined; },
  async getClientById() { return undefined; },
  async createClient() { throw new Error("Not implemented in fallback storage"); },
  async updateClient() { throw new Error("Not implemented in fallback storage"); },
  async deleteClient() { return false; },

  // Shoot management
  async getShootsByClientId() { return []; },
  async getShootById() { return undefined; },
  async getPublicShoots() { return []; },
  async getAllShoots() { return []; },
  async createShoot() { throw new Error("Not implemented in fallback storage"); },
  async updateShoot() { throw new Error("Not implemented in fallback storage"); },
  async deleteShoot() { return false; },

  // Image management
  async getImagesByShootId() { return []; },
  async getImageById() { return undefined; },
  async createImage() { throw new Error("Not implemented in fallback storage"); },
  async updateImageSequence() { return false; },
  async updateAlbumCover() { return false; },
  async deleteImage() { return false; },

  // Package management
  async getPackagesByCategory(category: string) { 
    // Return basic packages for testing
    return [
      {
        id: "1",
        name: "Essential Photography",
        description: "Perfect for small events and portraits",
        price: "299.00",
        features: ["2 hours shooting", "50 edited photos", "Online gallery", "USB delivery"],
        category: "photography",
        isActive: true,
        displayOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "2", 
        name: "Premium Photography",
        description: "Comprehensive coverage for special occasions",
        price: "599.00",
        features: ["4 hours shooting", "150 edited photos", "Online gallery", "Print release", "USB delivery"],
        category: "photography",
        isActive: true,
        displayOrder: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  },
  async getAllPackages() { return await this.getPackagesByCategory("photography"); },
  async getPackageById() { return undefined; },
  async createPackage() { throw new Error("Not implemented in fallback storage"); },
  async updatePackage() { throw new Error("Not implemented in fallback storage"); },
  async deletePackage() { return false; },

  // Analytics and favorites
  async createAnalytics() { throw new Error("Not implemented in fallback storage"); },
  async getAnalyticsByUserId() { return []; },
  async createFavorite() { throw new Error("Not implemented in fallback storage"); },
  async getFavoritesByUserId() { return []; },
  async deleteFavorite() { return false; },

  // Bookings
  async createBooking() { throw new Error("Not implemented in fallback storage"); },
  async getBookings() { return []; },
  async updateBooking() { throw new Error("Not implemented in fallback storage"); }
};
