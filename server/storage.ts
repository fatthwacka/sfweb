import { 
  profiles, users, clients, shoots, images, videos, packages, analytics, favorites, bookings, localSiteAssets,
  shootPreviews, clientSelections, selectionPackages, previewImages,
  type Profile, type InsertProfile,
  type User, type InsertUser, 
  type Client, type InsertClient,
  type Shoot, type InsertShoot,
  type Image, type InsertImage,
  type Video, type InsertVideo,
  type Package, type InsertPackage,
  type Analytics, type InsertAnalytics,
  type Favorite, type InsertFavorite,
  type Booking, type InsertBooking,
  type LocalSiteAsset, type InsertLocalSiteAsset,
  type ImageClassification,
  type UpdateShootCustomization,
  type ShootPreview, type InsertShootPreview,
  type ClientSelection, type InsertClientSelection,
  type SelectionPackage, type InsertSelectionPackage,
  type PreviewImage, type InsertPreviewImage
} from "@shared/schema";

export interface IStorage {
  // Profiles (main user system - UUIDs)
  getProfile(id: string): Promise<Profile | undefined>;
  getProfileByEmail(email: string): Promise<Profile | undefined>;
  getAllProfiles(): Promise<Profile[]>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(id: string, updates: Partial<InsertProfile>): Promise<Profile | undefined>;
  deleteProfile(id: string): Promise<boolean>;
  
  // Users (for auth compatibility)
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Clients (integers)
  getClient(id: number): Promise<Client | undefined>;
  getClientBySlug(slug: string): Promise<Client | undefined>;
  getClientByEmail(email: string): Promise<Client | undefined>;
  getClients(): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, updates: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;
  
  // Shoots (UUIDs)
  getShoot(id: string): Promise<Shoot | undefined>;
  getShootBySlug(slug: string): Promise<Shoot | undefined>;
  getShootsByClient(clientId: string): Promise<Shoot[]>;
  getShootsByClientEmail(email: string): Promise<Shoot[]>;
  getPublicShoots(): Promise<Shoot[]>;
  getPublicShootsByGroupName(groupName: string): Promise<Shoot[]>;
  getAllShoots(): Promise<Shoot[]>;
  getPortfolioGroups(): Promise<string[]>;
  createShoot(shoot: InsertShoot): Promise<Shoot>;
  updateShoot(id: string, updates: Partial<InsertShoot>): Promise<Shoot | undefined>;
  updateShootCustomization(id: string, data: UpdateShootCustomization): Promise<Shoot | undefined>;
  updateImageSequence(imageId: string, sequence: number): Promise<void>;
  batchUpdateImageSequences(imageSequences: Record<string, number>): Promise<void>;
  incrementShootViewCount(id: string): Promise<void>;
  deleteShoot(id: string): Promise<boolean>;
  
  // Images (UUIDs)
  getImage(id: string): Promise<Image | undefined>;
  getImagesByShoot(shootId: string): Promise<Image[]>;
  getImagesForShoots(shootIds: string[]): Promise<Map<string, Image[]>>; // Optimized batch method
  getImagesByIds(ids: string[]): Promise<Map<string, Image>>; // Batch fetch images by IDs
  getFeaturedImages(): Promise<Image[]>;
  getFeaturedClassifications(): Promise<string[]>;
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
  
  // Local Site Assets (UUIDs)
  getLocalSiteAssets(): Promise<LocalSiteAsset[]>;
  getLocalSiteAssetByKey(assetKey: string): Promise<LocalSiteAsset | undefined>;
  createLocalSiteAsset(asset: InsertLocalSiteAsset): Promise<LocalSiteAsset>;
  updateLocalSiteAsset(assetKey: string, updates: Partial<InsertLocalSiteAsset>): Promise<LocalSiteAsset | undefined>;
  deleteLocalSiteAsset(assetKey: string): Promise<boolean>;
  
  // Featured Images Management
  getFeaturedImages(): Promise<Image[]>;
  getFeaturedImagesByClassification(classification: ImageClassification): Promise<Image[]>;
  updateImageFeaturedStatus(imageIds: string[], featured: boolean): Promise<Image[]>;
  updateImageClassification(imageId: string, classification: ImageClassification): Promise<Image | undefined>;
  updateShootImagesClassification(shootId: string, classification: ImageClassification): Promise<Image[]>;
  bulkUpdateImageClassification(imageIds: string[], classification: ImageClassification): Promise<Image[]>;
  
  // Featured Videos Management
  getFeaturedVideos(): Promise<Video[]>;
  updateVideoFeaturedStatus(videoIds: string[], featured: boolean): Promise<Video[]>;
  setShootCoverVideo(shootId: string, videoId: string): Promise<Video | undefined>;
  getVideosByShoot(shootId: string): Promise<Video[]>;
  getVideosForShoots(shootIds: string[]): Promise<Map<string, Video[]>>; // Optimized batch method
  getCoverVideosForShoots(shootIds: string[]): Promise<Map<string, Video | null>>; // Batch fetch cover videos
  getAllVideos(): Promise<Video[]>;
  
  // Preview Selection System
  getShootPreviewSettings(shootId: string): Promise<ShootPreview | undefined>;
  createShootPreviewSettings(settings: InsertShootPreview): Promise<ShootPreview>;
  updateShootPreviewSettings(id: string, updates: Partial<InsertShootPreview>): Promise<ShootPreview | undefined>;
  getPreviewImages(shootId: string): Promise<any[]>;
  
  getClientSelections(shootId: string): Promise<ClientSelection[]>;
  upsertClientSelection(selection: Partial<InsertClientSelection>): Promise<ClientSelection>;
  batchUpsertClientSelections(selections: Partial<InsertClientSelection>[]): Promise<ClientSelection[]>;
  updateClientSelectionEditingStatus(selectionId: string, editingComplete: boolean, editingCompletedAt: Date | null): Promise<ClientSelection | undefined>;
  clearAllClientSelections(shootId: string, clientId: string): Promise<number>;
  
  getSelectionPackage(shootId: string, clientId: string): Promise<SelectionPackage | undefined>;
  createSelectionPackage(packageData: InsertSelectionPackage): Promise<SelectionPackage>;
  upgradeSelectionPackage(shootId: string, clientId: string, additionalImages: number, purchaseInfo: any): Promise<SelectionPackage>;
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
  private localSiteAssets: Map<string, LocalSiteAsset> = new Map();
  private shootPreviewSettings: Map<string, ShootPreview> = new Map();
  private clientSelections: Map<string, ClientSelection> = new Map();
  private selectionPackages: Map<string, SelectionPackage> = new Map();
  private previewImages: Map<string, PreviewImage> = new Map();
  
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
      address: "123 Demo Street, Durban, 8001",
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
      address: "123 Main Street, Durban, 8001",
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
      location: "V&A Waterfront, Durban",
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
      seoTags: "demo portfolio photography durban slyfox studios",
      createdAt: new Date()
    };
    this.shoots.set(demoShoot.id, demoShoot);

    // Create test shoots with different customization settings
    const portraitShoot: Shoot = {
      id: this.currentShootId++,
      clientId: testClient1.id,
      title: "Sarah's Portrait Session",
      description: "A beautiful outdoor portrait session in Durban Botanic Gardens Gardens",
      shootType: "photography",
      shootDate: new Date("2024-01-15"),
      location: "Durban Botanic Gardens Botanical Gardens, Durban",
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
      seoTags: "portrait photography durban durban botanic gardens natural light",
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
      location: "uShaka Beach Beach, Durban", 
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
      seoTags: "family photography ushaka beach beach sunset durban",
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

    // Initialize local site assets for all 12 asset keys with SEO-optimized names
    const siteAssets = [
      {
        assetKey: 'hero/durban-wedding-photography-slyfox-studios',
        assetType: 'hero',
        filePath: '/assets/hero/durban-wedding-photography-slyfox-studios-ni.jpg',
        altText: 'Professional Durban wedding photography by SlyFox Studios',
        seoKeywords: 'durban-wedding-photography-slyfox-studios',
        isActive: true,
        updatedBy: 'system'
      },
      {
        assetKey: 'hero/professional-photography-services-durban',
        assetType: 'hero',
        filePath: '/assets/hero/professional-photography-services-durban-ni.jpg',
        altText: 'Professional photography services in Durban',
        seoKeywords: 'professional-photography-services-durban',
        isActive: true,
        updatedBy: 'system'
      },
      {
        assetKey: 'hero/durban-wedding-photographer-portfolio',
        assetType: 'hero',
        filePath: '/assets/hero/durban-wedding-photographer-portfolio-ni.jpg',
        altText: 'Durban wedding photographer portfolio showcase',
        seoKeywords: 'durban-wedding-photographer-portfolio',
        isActive: true,
        updatedBy: 'system'
      },
      {
        assetKey: 'hero/portrait-photographer-durban-studio',
        assetType: 'hero',
        filePath: '/assets/hero/portrait-photographer-durban-studio-ni.jpg',
        altText: 'Professional portrait photographer in Durban studio',
        seoKeywords: 'portrait-photographer-durban-studio',
        isActive: true,
        updatedBy: 'system'
      },
      {
        assetKey: 'hero/corporate-photography-durban-business',
        assetType: 'hero',
        filePath: '/assets/hero/corporate-photography-durban-business-ni.jpg',
        altText: 'Corporate photography services for Durban businesses',
        seoKeywords: 'corporate-photography-durban-business',
        isActive: true,
        updatedBy: 'system'
      },
      {
        assetKey: 'hero/event-photographer-durban-professional',
        assetType: 'hero',
        filePath: '/assets/hero/event-photographer-durban-professional-ni.jpg',
        altText: 'Professional event photographer in Durban',
        seoKeywords: 'event-photographer-durban-professional',
        isActive: true,
        updatedBy: 'system'
      },
      {
        assetKey: 'hero/graduation-photography-durban-ceremony',
        assetType: 'hero',
        filePath: '/assets/hero/graduation-photography-durban-ceremony-ni.jpg',
        altText: 'Graduation ceremony photography in Durban',
        seoKeywords: 'graduation-photography-durban-ceremony',
        isActive: true,
        updatedBy: 'system'
      },
      {
        assetKey: 'hero/product-photography-durban-commercial',
        assetType: 'hero',
        filePath: '/assets/hero/product-photography-durban-commercial-ni.jpg',
        altText: 'Commercial product photography services in Durban',
        seoKeywords: 'product-photography-durban-commercial',
        isActive: true,
        updatedBy: 'system'
      },
      {
        assetKey: 'hero/matric-dance-photographer-durban',
        assetType: 'hero',
        filePath: '/assets/hero/matric-dance-photographer-durban-ni.jpg',
        altText: 'Matric dance photographer in Durban',
        seoKeywords: 'matric-dance-photographer-durban',
        isActive: true,
        updatedBy: 'system'
      },
      {
        assetKey: 'backgrounds/photography-studio-durban-texture',
        assetType: 'background',
        filePath: '/assets/backgrounds/photography-studio-durban-texture-ni.jpg',
        altText: 'Durban photography studio background texture',
        seoKeywords: 'photography-studio-durban-texture',
        isActive: true,
        updatedBy: 'system'
      },
      {
        assetKey: 'backgrounds/wedding-photography-background-elegant',
        assetType: 'background',
        filePath: '/assets/backgrounds/wedding-photography-background-elegant-ni.jpg',
        altText: 'Elegant wedding photography background',
        seoKeywords: 'wedding-photography-background-elegant',
        isActive: true,
        updatedBy: 'system'
      },
      {
        assetKey: 'backgrounds/portrait-photography-studio-backdrop',
        assetType: 'background',
        filePath: '/assets/backgrounds/portrait-photography-studio-backdrop-ni.jpg',
        altText: 'Professional portrait photography studio backdrop',
        seoKeywords: 'portrait-photography-studio-backdrop',
        isActive: true,
        updatedBy: 'system'
      }
    ];

    siteAssets.forEach(asset => {
      const localAsset: LocalSiteAsset = {
        id: crypto.randomUUID(),
        assetKey: asset.assetKey,
        assetType: asset.assetType,
        filePath: asset.filePath,
        altText: asset.altText,
        seoKeywords: asset.seoKeywords,
        isActive: asset.isActive,
        createdAt: new Date(),
        updatedAt: new Date(),
        updatedBy: asset.updatedBy
      };
      this.localSiteAssets.set(asset.assetKey, localAsset);
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

  async getClientByEmail(email: string): Promise<Client | undefined> {
    return Array.from(this.clients.values()).find(client => client.email === email);
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

  async getPublicShootsByGroupName(groupName: string): Promise<Shoot[]> {
    return Array.from(this.shoots.values()).filter(
      shoot => !shoot.isPrivate && shoot.groupName?.toLowerCase() === groupName.toLowerCase()
    );
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

  async getImagesForShoots(shootIds: string[]): Promise<Map<string, Image[]>> {
    const imagesByShoot = new Map<string, Image[]>();
    for (const shootId of shootIds) {
      const images = Array.from(this.images.values())
        .filter(image => image.shootId === shootId)
        .sort((a, b) => a.sequence - b.sequence);
      imagesByShoot.set(shootId, images);
    }
    return imagesByShoot;
  }

  async getImagesByIds(ids: string[]): Promise<Map<string, Image>> {
    const imageMap = new Map<string, Image>();
    for (const id of ids) {
      const image = this.images.get(id);
      if (image) {
        imageMap.set(id, image);
      }
    }
    return imageMap;
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

  // Local Site Assets methods
  async getLocalSiteAssets(): Promise<LocalSiteAsset[]> {
    return Array.from(this.localSiteAssets.values());
  }

  async getLocalSiteAssetByKey(assetKey: string): Promise<LocalSiteAsset | undefined> {
    return this.localSiteAssets.get(assetKey);
  }

  async createLocalSiteAsset(asset: InsertLocalSiteAsset): Promise<LocalSiteAsset> {
    const newAsset: LocalSiteAsset = {
      id: crypto.randomUUID(),
      ...asset,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.localSiteAssets.set(asset.assetKey, newAsset);
    return newAsset;
  }

  async updateLocalSiteAsset(assetKey: string, updates: Partial<InsertLocalSiteAsset>): Promise<LocalSiteAsset | undefined> {
    const asset = this.localSiteAssets.get(assetKey);
    if (!asset) return undefined;
    
    const updatedAsset = { 
      ...asset, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.localSiteAssets.set(assetKey, updatedAsset);
    return updatedAsset;
  }

  async deleteLocalSiteAsset(assetKey: string): Promise<boolean> {
    return this.localSiteAssets.delete(assetKey);
  }

  // Featured Images Management methods
  async getFeaturedImages(): Promise<Image[]> {
    return Array.from(this.images.values()).filter(image => image.featuredImage === true);
  }

  async getFeaturedClassifications(): Promise<string[]> {
    const featuredImages = Array.from(this.images.values()).filter(image => image.featuredImage === true);
    const classifications = new Set<string>();
    featuredImages.forEach(image => classifications.add(image.classification));
    return Array.from(classifications).sort();
  }

  async getFeaturedImagesByClassification(classification: ImageClassification): Promise<Image[]> {
    return Array.from(this.images.values()).filter(
      image => image.featuredImage && image.classification === classification
    );
  }

  async updateImageFeaturedStatus(imageIds: number[], featured: boolean): Promise<Image[]> {
    const updatedImages: Image[] = [];
    
    for (const imageId of imageIds) {
      const image = this.images.get(imageId);
      if (image) {
        const updatedImage = { ...image, featuredImage: featured, updatedAt: new Date() };
        this.images.set(imageId, updatedImage);
        updatedImages.push(updatedImage);
      }
    }
    
    return updatedImages;
  }

  // Featured Videos Management methods
  async getFeaturedVideos(): Promise<Video[]> {
    return Array.from(this.videos.values()).filter(video => video.featuredVideo === true);
  }

  async updateVideoFeaturedStatus(videoIds: string[], featured: boolean): Promise<Video[]> {
    const updatedVideos: Video[] = [];
    
    for (const videoId of videoIds) {
      const video = this.videos.get(videoId);
      if (video) {
        const updatedVideo = { ...video, featuredVideo: featured, updatedAt: new Date() };
        this.videos.set(videoId, updatedVideo);
        updatedVideos.push(updatedVideo);
      }
    }
    
    return updatedVideos;
  }

  async setShootCoverVideo(shootId: string, videoId: string): Promise<Video | undefined> {
    // First, remove featured status from all videos in this shoot
    const shootVideos = Array.from(this.videos.values()).filter(video => video.shootId === shootId);
    for (const video of shootVideos) {
      if (video.featuredVideo) {
        const updatedVideo = { ...video, featuredVideo: false, updatedAt: new Date() };
        this.videos.set(video.id, updatedVideo);
      }
    }
    
    // Then set the selected video as featured
    const selectedVideo = this.videos.get(videoId);
    if (selectedVideo && selectedVideo.shootId === shootId) {
      const updatedVideo = { ...selectedVideo, featuredVideo: true, updatedAt: new Date() };
      this.videos.set(videoId, updatedVideo);
      return updatedVideo;
    }
    
    return undefined;
  }

  async getVideosByShoot(shootId: string): Promise<Video[]> {
    return Array.from(this.videos.values())
      .filter(video => video.shootId === shootId)
      .sort((a, b) => a.sequence - b.sequence);
  }

  async getVideosForShoots(shootIds: string[]): Promise<Map<string, Video[]>> {
    const videosByShoot = new Map<string, Video[]>();
    for (const shootId of shootIds) {
      const videos = Array.from(this.videos.values())
        .filter(video => video.shootId === shootId)
        .sort((a, b) => a.sequence - b.sequence);
      videosByShoot.set(shootId, videos);
    }
    return videosByShoot;
  }

  async getCoverVideosForShoots(shootIds: string[]): Promise<Map<string, Video | null>> {
    const coverVideosMap = new Map<string, Video | null>();
    for (const shootId of shootIds) {
      const videos = Array.from(this.videos.values())
        .filter(video => video.shootId === shootId)
        .sort((a, b) => a.sequence - b.sequence);
      // Get featured or first video
      const coverVideo = videos.find(v => v.featuredVideo) || videos[0] || null;
      coverVideosMap.set(shootId, coverVideo);
    }
    return coverVideosMap;
  }

  async getAllVideos(): Promise<Video[]> {
    return Array.from(this.videos.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async updateImageSequence(imageId: string, sequence: number): Promise<void> {
    const image = this.images.get(imageId);
    if (image) {
      const updatedImage = { ...image, sequence };
      this.images.set(imageId, updatedImage);
    }
  }

  async batchUpdateImageSequences(imageSequences: Record<string, number>): Promise<void> {
    for (const [imageId, sequence] of Object.entries(imageSequences)) {
      await this.updateImageSequence(imageId, sequence);
    }
  }

  async updateImageClassification(imageId: string, classification: ImageClassification): Promise<Image | undefined> {
    const image = this.images.get(imageId);
    if (!image) return undefined;
    
    const updatedImage = { ...image, classification, updatedAt: new Date() };
    this.images.set(imageId, updatedImage);
    return updatedImage;
  }

  async updateShootImagesClassification(shootId: string, classification: ImageClassification): Promise<Image[]> {
    const shootImages = Array.from(this.images.values()).filter(image => image.shootId === shootId);
    const updatedImages: Image[] = [];
    
    for (const image of shootImages) {
      const updatedImage = { ...image, classification, updatedAt: new Date() };
      this.images.set(image.id, updatedImage);
      updatedImages.push(updatedImage);
    }
    
    return updatedImages;
  }

  async bulkUpdateImageClassification(imageIds: string[], classification: ImageClassification): Promise<Image[]> {
    const updatedImages: Image[] = [];
    
    for (const imageId of imageIds) {
      const image = this.images.get(imageId);
      if (image) {
        const updatedImage = { ...image, classification, updatedAt: new Date() };
        this.images.set(imageId, updatedImage);
        updatedImages.push(updatedImage);
      }
    }
    
    return updatedImages;
  }

  // Preview Selection System Methods
  async getShootPreviewSettings(shootId: string): Promise<ShootPreview | undefined> {
    return Array.from(this.shootPreviewSettings.values()).find(s => s.shootId === shootId);
  }

  async createShootPreviewSettings(settings: InsertShootPreview): Promise<ShootPreview> {
    const id = crypto.randomUUID();
    const now = new Date();
    const newSettings: ShootPreview = {
      id,
      ...settings,
      createdAt: now,
      updatedAt: now,
    };
    this.shootPreviewSettings.set(id, newSettings);
    return newSettings;
  }

  async updateShootPreviewSettings(id: string, updates: Partial<InsertShootPreview>): Promise<ShootPreview | undefined> {
    const existing = this.shootPreviewSettings.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.shootPreviewSettings.set(id, updated);
    return updated;
  }

  async getPreviewImages(shootId: string): Promise<PreviewImage[]> {
    return Array.from(this.previewImages.values()).filter(img => img.shootId === shootId);
  }

  async getClientSelections(shootId: string): Promise<ClientSelection[]> {
    return Array.from(this.clientSelections.values()).filter(s => s.shootId === shootId);
  }

  async upsertClientSelection(selection: Partial<InsertClientSelection>): Promise<ClientSelection> {
    // Find existing selection by shootId + clientId + imageFilename
    const existing = Array.from(this.clientSelections.values()).find(
      s => s.shootId === selection.shootId && 
           s.clientId === selection.clientId && 
           s.imageFilename === selection.imageFilename
    );

    const now = new Date();
    
    if (existing) {
      const updated = {
        ...existing,
        ...selection,
        updatedAt: now,
      };
      this.clientSelections.set(existing.id, updated);
      return updated;
    } else {
      const id = crypto.randomUUID();
      const newSelection: ClientSelection = {
        id,
        shootId: selection.shootId!,
        clientId: selection.clientId!,
        imageFilename: selection.imageFilename!,
        dropboxPath: selection.dropboxPath || null,
        thumbnailUrl: selection.thumbnailUrl || null,
        selectionStatus: selection.selectionStatus || 'none',
        isFinalSelection: selection.isFinalSelection || false,
        selectionOrder: selection.selectionOrder || null,
        selectedAt: selection.selectedAt || null,
        metadata: selection.metadata || null,
        createdAt: now,
        updatedAt: now,
      };
      this.clientSelections.set(id, newSelection);
      return newSelection;
    }
  }

  async batchUpsertClientSelections(selections: Partial<InsertClientSelection>[]): Promise<ClientSelection[]> {
    const results: ClientSelection[] = [];
    
    for (const selection of selections) {
      const result = await this.upsertClientSelection(selection);
      results.push(result);
    }
    
    return results;
  }

  async updateClientSelectionEditingStatus(selectionId: string, editingComplete: boolean, editingCompletedAt: Date | null): Promise<ClientSelection | undefined> {
    const selection = this.clientSelections.get(selectionId);
    if (!selection) {
      return undefined;
    }

    const updated: ClientSelection = {
      ...selection,
      editingComplete,
      editingCompletedAt,
      updatedAt: new Date()
    };

    this.clientSelections.set(selectionId, updated);
    return updated;
  }

  async clearAllClientSelections(shootId: string, clientId: string): Promise<number> {
    const existingSelections = Array.from(this.clientSelections.values()).filter(
      selection => selection.shootId === shootId && selection.clientId === clientId
    );
    
    let clearedCount = 0;
    for (const selection of existingSelections) {
      if (selection.selectionStatus !== 'unselected') {
        // Update to 'unselected' status
        const updated: ClientSelection = {
          ...selection,
          selectionStatus: 'unselected',
          isFinalSelection: false,
          selectedAt: null,
          updatedAt: new Date()
        };
        this.clientSelections.set(selection.id, updated);
        clearedCount++;
      }
    }
    
    return clearedCount;
  }

  async getSelectionPackage(shootId: string, clientId: string): Promise<SelectionPackage | undefined> {
    return Array.from(this.selectionPackages.values()).find(
      p => p.shootId === shootId && p.clientId === clientId
    );
  }

  async createSelectionPackage(packageData: InsertSelectionPackage): Promise<SelectionPackage> {
    const id = crypto.randomUUID();
    const now = new Date();
    const newPackage: SelectionPackage = {
      id,
      ...packageData,
      totalAllowed: packageData.baseLimit + packageData.purchasedAdditional,
      purchaseHistory: null,
      createdAt: now,
      updatedAt: now,
    };
    this.selectionPackages.set(id, newPackage);
    return newPackage;
  }

  async upgradeSelectionPackage(shootId: string, clientId: string, additionalImages: number, purchaseInfo: any): Promise<SelectionPackage> {
    const existing = await this.getSelectionPackage(shootId, clientId);
    if (!existing) {
      throw new Error('Selection package not found');
    }

    const newPurchasedAdditional = existing.purchasedAdditional + additionalImages;
    const newTotalAllowed = existing.baseLimit + newPurchasedAdditional;
    const now = new Date();

    const updatedPackage: SelectionPackage = {
      ...existing,
      purchasedAdditional: newPurchasedAdditional,
      totalAllowed: newTotalAllowed,
      purchaseHistory: [
        ...(existing.purchaseHistory ? JSON.parse(existing.purchaseHistory as any) : []),
        purchaseInfo
      ],
      updatedAt: now,
    };

    this.selectionPackages.set(existing.id, updatedPackage);
    return updatedPackage;
  }
}

import { PostgreSQLStorage } from "./pg-storage";

// Import Supabase storage
import { SupabaseStorage } from "./supabase-storage";

// Always use Supabase storage for data persistence
export const storage: IStorage = new SupabaseStorage();

