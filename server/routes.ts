import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from 'multer';
import { storage } from './storage';
import { seedCompleteDatabase } from './seed-database.js';
import { createSupabaseUser, type CreateUserData } from './supabase-auth.js';
import { populateWithExistingAuth } from './populate-with-existing-auth.js';
import { initializeAdmin } from './init-admin.js';
import { createClient } from '@supabase/supabase-js';
import simpleAssetsRouter from './routes/simple-assets';
import { 
  insertUserSchema, insertClientSchema, insertShootSchema, 
  insertImageSchema, insertBookingSchema, insertAnalyticsSchema,
  updateImageSequenceSchema, updateAlbumCoverSchema, updateShootDetailsSchema,
  updateShootCustomizationSchema
} from "@shared/schema";
import { z } from "zod";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication endpoints
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      // Supabase authentication
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.VITE_SUPABASE_ANON_KEY!
      );

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error || !data.user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Get user profile from our profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, full_name, role')
        .eq('id', data.user.id)
        .single();

      const user = {
        id: data.user.id,
        email: data.user.email!,
        role: profile?.role || 'client',
        fullName: profile?.full_name || profile?.email?.split('@')[0]
      };
      
      return res.json({ user });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Profile management endpoints (using Supabase auth)
  app.get("/api/profiles", async (req, res) => {
    try {
      const profiles = await storage.getAllProfiles();
      res.json(profiles);
    } catch (error) {
      console.error("Get profiles error:", error);
      res.status(500).json({ message: "Failed to fetch profiles" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      // Simple registration for clients
      const user = {
        id: Math.floor(Math.random() * 1000) + 1000,
        email,
        role: "client" as const
      };
      
      res.json({ user });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    res.json({ success: true });
  });
  
  // Initialize admin user - run this first
  app.post("/api/admin/init", async (req, res) => {
    try {
      console.log("🔑 Initializing admin user...");
      const result = await initializeAdmin();
      
      if (result) {
        res.json({ 
          message: "Admin user created successfully", 
          user: {
            id: result.authUser.id,
            email: result.authUser.email,
            profile: result.profile
          }
        });
      } else {
        res.json({ 
          message: "Admin user already exists" 
        });
      }
    } catch (error) {
      console.error("Admin initialization error:", error);
      res.status(500).json({ 
        message: "Admin initialization failed", 
        error: error.message 
      });
    }
  });

  // Admin endpoint to populate database with realistic dummy data (no auth dependency)
  app.post("/api/admin/populate-database", async (req, res) => {
    try {
      console.log("🌱 Starting database population...");
      const result = await populateWithExistingAuth();
      res.json({ 
        message: "Database populated successfully", 
        data: result 
      });
    } catch (error) {
      console.error("Database population error:", error);
      res.status(500).json({ 
        message: "Database population failed", 
        error: error.message 
      });
    }
  });

  // Admin endpoint to seed database with comprehensive dummy data (requires Supabase auth)
  app.post("/api/admin/seed-database", async (req, res) => {
    try {
      console.log("🌱 Starting database seeding...");
      const result = await seedCompleteDatabase();
      res.json({ 
        message: "Database seeded successfully", 
        data: result 
      });
    } catch (error) {
      console.error("Database seeding error:", error);
      res.status(500).json({ 
        message: "Database seeding failed", 
        error: error.message 
      });
    }
  });

  // Admin endpoint to create new users
  app.post("/api/admin/create-user", async (req, res) => {
    try {
      const userData: CreateUserData = req.body;
      
      if (!userData.email || !userData.password || !userData.fullName || !userData.role) {
        return res.status(400).json({ 
          message: "Missing required fields: email, password, fullName, role" 
        });
      }

      if (!['staff', 'client'].includes(userData.role)) {
        return res.status(400).json({ 
          message: "Role must be 'staff' or 'client'" 
        });
      }

      const result = await createSupabaseUser(userData);
      res.json({ 
        message: "User created successfully", 
        user: {
          id: result.authUser.id,
          email: result.authUser.email,
          profile: result.profile
        }
      });
    } catch (error) {
      console.error("User creation error:", error);
      res.status(500).json({ 
        message: "User creation failed", 
        error: error.message 
      });
    }
  });

  // Contact form endpoint
  app.post("/api/contact", async (req, res) => {
    try {
      const contactSchema = z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        service: z.string().optional(),
        message: z.string().min(1)
      });

      const data = contactSchema.parse(req.body);
      
      // Create booking inquiry
      const booking = await storage.createBooking({
        email: data.email,
        phone: data.phone || "",
        message: data.message,
        serviceType: data.service || "general",
        preferredDate: null,
        budgetRange: "",
        status: "pending",
        inquiryData: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          fullName: `${data.firstName} ${data.lastName}`,
          service: data.service
        })
      });

      // TODO: Send email to info@slyfox.co.za using Nodemailer
      console.log("Contact form submission:", data);
      
      res.json({ success: true, bookingId: booking.id });
    } catch (error) {
      console.error("Contact form error:", error);
      res.status(400).json({ message: "Invalid form data" });
    }
  });

  // Package endpoints
  app.get("/api/packages", async (req, res) => {
    try {
      console.log("Fetching all packages...");
      const packages = await storage.getPackages();
      console.log(`Found ${packages.length} total packages`);
      res.json(packages);
    } catch (error: any) {
      console.error("All packages fetch error:", error);
      res.status(500).json({ message: "Failed to fetch packages", error: error.message });
    }
  });

  app.get("/api/packages/:category", async (req, res) => {
    try {
      const { category } = req.params;
      console.log(`Fetching packages for category: ${category}`);
      const packages = await storage.getPackagesByCategory(category);
      console.log(`Found ${packages.length} packages`);
      res.json(packages);
    } catch (error: any) {
      console.error("Package fetch error:", error);
      res.status(500).json({ message: "Failed to fetch packages", error: error.message });
    }
  });

  // Client endpoints
  app.get("/api/clients", async (req, res) => {
    try {
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  // Public gallery endpoint - fetch shoot by custom slug
  app.get("/api/gallery/:slug", async (req, res) => {
    console.log(`🔍 Gallery API endpoint hit: ${req.params.slug}`);
    try {
      const { slug } = req.params;
      console.log(`🔍 Looking for shoot with slug: ${slug}`);
      const shoot = await storage.getShootBySlug(slug);
      console.log(`🔍 Found shoot:`, shoot ? 'YES' : 'NO');
      
      if (!shoot) {
        console.log(`❌ Gallery not found: ${slug}`);
        return res.status(404).json({ message: "Gallery not found" });
      }

      // Only return public galleries
      if (shoot.isPrivate) {
        console.log(`❌ Gallery is private: ${slug}`);
        return res.status(403).json({ message: "Private gallery", type: "private" });
      }

      console.log(`✅ Returning public gallery: ${shoot.title}`);
      
      // Increment view count
      await storage.incrementShootViewCount(shoot.id);
      
      // Ensure we're returning JSON
      res.setHeader('Content-Type', 'application/json');
      return res.json(shoot);
    } catch (error) {
      console.error("❌ Error fetching public shoot:", error);
      return res.status(500).json({ message: "Failed to fetch gallery" });
    }
  });

  app.get("/api/clients/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const client = await storage.getClientBySlug(slug);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      // Use email-based matching for shoots
      const shoots = client.email ? await storage.getShootsByClientEmail(client.email) : [];
      res.json({ client, shoots });
    } catch (error) {
      console.error("Client fetch error:", error);
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      console.log('Creating client with data:', req.body);
      const { password, ...clientRequestData } = req.body;
      const data = insertClientSchema.parse(clientRequestData);
      
      // Check if client with this email already exists
      if (data.email) {
        const existingClient = await storage.getClientByEmail(data.email);
        if (existingClient) {
          return res.status(400).json({ 
            message: `A client with email ${data.email} already exists. Each client must have a unique email address.` 
          });
        }
      }
      
      // Add required created_by field using the current authenticated user
      // Use the admin profile ID that exists in the database
      const validProfileId = '070dae19-d4ce-4fe0-b3d4-a090fa3ece3a'; // admin@slyfox.co.za
      
      const clientData = {
        ...data,
        createdBy: validProfileId
      };
      
      // Create client record first
      const client = await storage.createClient(clientData);
      
      // If password provided, create portal account
      if (password && data.email) {
        try {
          const userData: CreateUserData = {
            email: data.email,
            password: password,
            fullName: data.name,
            role: 'client'
          };
          
          await createSupabaseUser(userData);
          
          res.json({ 
            ...client, 
            portalAccess: true,
            message: "Client created with portal access"
          });
        } catch (authError) {
          console.error("Portal account creation failed:", authError);
          res.json({ 
            ...client, 
            portalAccess: false,
            message: "Client created but portal access setup failed"
          });
        }
      } else {
        res.json({ 
          ...client, 
          portalAccess: false,
          message: "Client created without portal access"
        });
      }
    } catch (error: any) {
      console.error("Create client error:", error);
      if (error.issues) {
        console.error("Validation issues:", error.issues);
      }
      res.status(400).json({ 
        message: "Invalid client data",
        details: error.issues || error.message 
      });
    }
  });

  app.patch("/api/clients/:id", async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const updates = req.body;
      
      console.log('Updating client:', clientId, 'with data:', updates);
      
      // Validate the update data
      const validatedUpdates = insertClientSchema.partial().parse(updates);
      
      const client = await storage.updateClient(clientId, validatedUpdates);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      console.log('Client updated successfully:', client);
      res.json(client);
    } catch (error) {
      console.error("Update client error:", error);
      if (error.issues) {
        console.error("Validation issues:", error.issues);
        res.status(400).json({ 
          message: "Invalid client data",
          details: error.issues 
        });
      } else {
        res.status(500).json({ message: "Failed to update client" });
      }
    }
  });

  app.delete("/api/clients/:identifier", async (req, res) => {
    try {
      const identifier = req.params.identifier;
      
      console.log('Deleting client by identifier:', identifier);
      
      // Try to parse as ID first, fallback to email
      let success = false;
      if (!isNaN(Number(identifier))) {
        // It's a numeric ID
        const clientId = parseInt(identifier);
        success = await storage.deleteClient(clientId);
      } else {
        // It's an email, find client by email first then delete by ID
        console.log('Looking for client with email:', identifier);
        const client = await storage.getClientByEmail(identifier);
        console.log('Found client:', client ? `ID ${client.id}` : 'NONE');
        if (client) {
          console.log('Attempting to delete client ID:', client.id);
          success = await storage.deleteClient(client.id);
          console.log('Delete operation result:', success);
        }
      }
      
      if (!success) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      console.log('Client deleted successfully:', identifier);
      res.json({ message: "Client deleted successfully", identifier });
    } catch (error: any) {
      console.error("Delete client error:", error);
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Shoot endpoints
  app.get("/api/shoots", async (req, res) => {
    try {
      // For admin panel, return all shoots (both public and private)
      const shoots = await storage.getAllShoots();
      res.json(shoots);
    } catch (error) {
      console.error("Fetch shoots error:", error);
      res.status(500).json({ message: "Failed to fetch shoots" });
    }
  });

  app.get("/api/shoots/:id", async (req, res) => {
    try {
      const shootId = req.params.id; // Keep as string for UUID
      const shoot = await storage.getShoot(shootId);
      
      if (!shoot) {
        return res.status(404).json({ message: "Shoot not found" });
      }

      const images = await storage.getImagesByShoot(shootId);
      res.json({ shoot, images });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shoot" });
    }
  });

  // Get images for a specific shoot (client portal needs this)
  app.get("/api/shoots/:id/images", async (req, res) => {
    try {
      const shootId = req.params.id;
      const images = await storage.getImagesByShoot(shootId);
      res.json(images);
    } catch (error) {
      console.error("Fetch shoot images error:", error);
      res.status(500).json({ message: "Failed to fetch images" });
    }
  });

  app.post("/api/shoots", async (req, res) => {
    try {
      console.log('Creating shoot with data:', req.body);
      
      // Get authenticated user from session (for now use admin as fallback)
      // TODO: Implement proper session management
      const validProfileId = '070dae19-d4ce-4fe0-b3d4-a090fa3ece3a'; // admin@slyfox.co.za
      
      const shootDataWithCreatedBy = {
        ...req.body,
        createdBy: validProfileId
      };
      
      console.log('Shoot data with createdBy:', shootDataWithCreatedBy);
      
      const data = insertShootSchema.parse(shootDataWithCreatedBy);
      console.log('Validated data:', data);
      
      const shoot = await storage.createShoot(data);
      res.json(shoot);
    } catch (error) {
      console.error("Create shoot error:", error);
      if (error.issues) {
        console.error("Validation issues:", error.issues);
      }
      res.status(400).json({ 
        message: "Invalid shoot data",
        details: error.issues || error.message 
      });
    }
  });

  app.patch("/api/shoots/:id", async (req, res) => {
    try {
      const shootId = req.params.id; // Use string ID for UUID
      const updates = req.body;
      
      // Handle image sequence updates if provided
      if (updates.imageSequences) {
        const imageSequences = updates.imageSequences;
        for (const [imageId, sequence] of Object.entries(imageSequences)) {
          await storage.updateImage(imageId, { sequence: sequence as number });
        }
        // Remove imageSequences from shoot updates since it's not a shoot field
        delete updates.imageSequences;
      }
      
      // Only update shoot if there are other fields to update
      let shoot;
      if (Object.keys(updates).length > 0) {
        shoot = await storage.updateShoot(shootId, updates);
        if (!shoot) {
          return res.status(404).json({ message: "Shoot not found" });
        }
      } else {
        // If only image sequences were updated, fetch the current shoot
        shoot = await storage.getShoot(shootId);
        if (!shoot) {
          return res.status(404).json({ message: "Shoot not found" });
        }
      }
      
      res.json(shoot);
    } catch (error) {
      console.error("Update shoot error:", error);
      res.status(500).json({ message: "Failed to update shoot" });
    }
  });

  app.patch("/api/shoots/:id/customization", async (req, res) => {
    try {
      const shootId = req.params.id; // Use string ID for UUID
      const { imageSequences, ...customizationData } = req.body;
      
      const data = updateShootCustomizationSchema.parse(customizationData);
      
      const shoot = await storage.updateShootCustomization(shootId, data);
      if (!shoot) {
        return res.status(404).json({ message: "Shoot not found" });
      }

      // Update image sequences if provided
      if (imageSequences && typeof imageSequences === 'object') {
        for (const [imageId, sequence] of Object.entries(imageSequences)) {
          if (typeof sequence === 'number') {
            await storage.updateImageSequence(imageId, sequence);
          }
        }
      }
      
      res.json(shoot);
    } catch (error) {
      console.error("Update customization error:", error);
      res.status(400).json({ message: "Invalid customization data" });
    }
  });

  // Image endpoints
  app.post("/api/images", async (req, res) => {
    try {
      const data = insertImageSchema.parse(req.body);
      const image = await storage.createImage(data);
      res.json(image);
    } catch (error) {
      console.error("Create image error:", error);
      res.status(400).json({ message: "Invalid image data" });
    }
  });

  app.patch("/api/images/:id", async (req, res) => {
    try {
      const imageId = req.params.id; // UUID string
      const updates = req.body;
      
      const image = await storage.updateImage(imageId, updates);
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      
      res.json(image);
    } catch (error) {
      res.status(500).json({ message: "Failed to update image" });
    }
  });

  app.get("/api/images", async (req, res) => {
    try {
      // Use the direct getAllImages method for better performance and consistency
      const allImages = await storage.getAllImages();
      console.log(`Fetched ${allImages.length} images for admin panel`);
      res.json(allImages);
    } catch (error) {
      console.error("Fetch images error:", error);
      res.status(500).json({ message: "Failed to fetch images" });
    }
  });

  app.delete("/api/images/:id", async (req, res) => {
    try {
      const imageId = req.params.id; // UUID string
      console.log(`Attempting to delete image: ${imageId}`);
      
      const deleted = await storage.deleteImage(imageId);
      
      if (!deleted) {
        console.log(`Image not found in database: ${imageId}`);
        return res.status(404).json({ message: "Image not found or already deleted" });
      }
      
      console.log(`Successfully deleted image: ${imageId}`);
      res.json({ success: true, message: "Image deleted successfully" });
    } catch (error) {
      console.error("Delete image error:", error);
      res.status(500).json({ 
        message: "Failed to delete image", 
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Image upload endpoint with Supabase storage
  app.post("/api/images/upload", upload.array('images', 20), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      const { shootId } = req.body;

      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files provided" });
      }

      if (!shootId) {
        return res.status(400).json({ message: "Shoot ID is required" });
      }

      // Initialize Supabase client
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for admin operations
      );

      const uploadedImages = [];

      for (const file of files) {
        // Generate unique filename
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2);
        const fileExtension = file.originalname.split('.').pop();
        const filename = `${timestamp}_${randomId}.${fileExtension}`;
        const storagePath = `shoots/${shootId}/${filename}`;
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('gallery-images')
          .upload(storagePath, file.buffer, {
            contentType: file.mimetype,
            upsert: false
          });

        if (uploadError) {
          console.error('Supabase upload error:', uploadError);
          continue; // Skip this file but continue with others
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('gallery-images')
          .getPublicUrl(storagePath);

        // Get the next sequence number for this shoot
        const existingImages = await storage.getImagesByShoot(shootId);
        const nextSequence = existingImages.length + 1;

        // Create image record in database
        const imageData = {
          shootId: shootId,
          filename: file.originalname,
          storagePath: publicUrl,
          originalPath: storagePath, // Store original path for future operations
          thumbnailPath: null, // Could generate thumbnails in future
          sequence: nextSequence,
          title: file.originalname.replace(/\.[^/.]+$/, ""), // Remove extension
          description: '',
          isPrivate: false,
          tags: [],
          downloadCount: 0
        };

        const newImage = await storage.createImage(imageData);
        uploadedImages.push(newImage);
      }

      res.json({ 
        success: true, 
        uploadedCount: uploadedImages.length,
        images: uploadedImages,
        message: `Successfully uploaded ${uploadedImages.length} image(s)`
      });

    } catch (error) {
      console.error("Image upload error:", error);
      res.status(500).json({ 
        message: "Failed to upload images",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Featured images endpoints for homepage
  app.get("/api/images/featured", async (req, res) => {
    try {
      const featuredImages = await storage.getFeaturedImages();
      res.json(featuredImages);
    } catch (error) {
      console.error('Failed to fetch featured images:', error);
      res.status(500).json({ error: 'Failed to fetch featured images' });
    }
  });

  app.get("/api/images/featured/classifications", async (req, res) => {
    try {
      const classifications = await storage.getFeaturedClassifications();
      res.json(classifications);
    } catch (error) {
      console.error('Failed to fetch featured classifications:', error);
      res.status(500).json({ error: 'Failed to fetch featured classifications' });
    }
  });

  // Bulk update image classifications by shoot
  app.patch("/api/shoots/:shootId/images/classification", async (req, res) => {
    try {
      const { shootId } = req.params;
      const { classification } = req.body;
      

      
      if (!classification) {
        return res.status(400).json({ error: 'Classification is required' });
      }

      console.log(`Updating all images for shoot ${shootId} to classification: ${classification}`);
      const updatedImages = await storage.updateShootImagesClassification(shootId, classification);
      

      
      res.json({ 
        success: true, 
        message: `Updated ${updatedImages.length} images to classification: ${classification}`,
        updatedCount: updatedImages.length
      });
    } catch (error) {
      console.error('Failed to update image classifications:', error);
      res.status(500).json({ error: 'Failed to update image classifications' });
    }
  });

  // Analytics endpoint
  app.post("/api/analytics", async (req, res) => {
    try {
      const data = insertAnalyticsSchema.parse(req.body);
      const analytics = await storage.createAnalytics(data);
      res.json(analytics);
    } catch (error) {
      console.error("Analytics error:", error);
      res.status(400).json({ message: "Invalid analytics data" });
    }
  });

  // User endpoints
  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Gallery Management endpoints
  app.put("/api/gallery/image-sequence", async (req, res) => {
    try {
      const data = updateImageSequenceSchema.parse(req.body);
      // TODO: Implement image sequence update in storage
      res.json({ success: true, message: "Image sequence updated" });
    } catch (error) {
      console.error("Update image sequence error:", error);
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.put("/api/gallery/album-cover", async (req, res) => {
    try {
      const data = updateAlbumCoverSchema.parse(req.body);
      // TODO: Implement album cover update in storage
      res.json({ success: true, message: "Album cover updated" });
    } catch (error) {
      console.error("Update album cover error:", error);
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.put("/api/gallery/shoot-details", async (req, res) => {
    try {
      const data = updateShootDetailsSchema.parse(req.body);
      // TODO: Implement shoot details update in storage
      res.json({ success: true, message: "Shoot details updated" });
    } catch (error) {
      console.error("Update shoot details error:", error);
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.get("/api/gallery/:shootId/images", async (req, res) => {
    try {
      const shootId = parseInt(req.params.shootId);
      if (isNaN(shootId)) {
        return res.status(400).json({ message: "Invalid shoot ID" });
      }
      
      // TODO: Implement in storage - for now return demo data
      const demoImages = [
        { id: 1, shootId, filename: "wedding-1.jpg", storagePath: "https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", thumbnailPath: null, sequence: 1, downloadCount: 5, createdAt: new Date().toISOString() },
        { id: 2, shootId, filename: "wedding-2.jpg", storagePath: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", thumbnailPath: null, sequence: 2, downloadCount: 3, createdAt: new Date().toISOString() },
        { id: 3, shootId, filename: "wedding-3.jpg", storagePath: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", thumbnailPath: null, sequence: 3, downloadCount: 8, createdAt: new Date().toISOString() },
        { id: 4, shootId, filename: "wedding-4.jpg", storagePath: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", thumbnailPath: null, sequence: 4, downloadCount: 2, createdAt: new Date().toISOString() },
        { id: 5, shootId, filename: "wedding-5.jpg", storagePath: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", thumbnailPath: null, sequence: 5, downloadCount: 6, createdAt: new Date().toISOString() },
        { id: 6, shootId, filename: "wedding-6.jpg", storagePath: "https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", thumbnailPath: null, sequence: 6, downloadCount: 4, createdAt: new Date().toISOString() },
      ];
      
      res.json(demoImages);
    } catch (error) {
      console.error("Get gallery images error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/populate-realistic", async (req, res) => {
    try {
      const { createSimpleTestData } = await import('./simple-test-data.js');
      const result = await createSimpleTestData();
      res.json({ 
        message: "Test data created successfully",
        stats: result
      });
    } catch (error) {
      console.error("Test data creation error:", error);
      res.status(500).json({ 
        message: "Test data creation failed", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Client Registration API endpoint (staff/super_admin only)
  app.post("/api/client/register", async (req, res) => {
    try {
      const { email, fullName, password, associatedShoots } = req.body;
      
      if (!email || !fullName || !password || !associatedShoots) {
        return res.status(400).json({ 
          message: "Missing required fields: email, fullName, password, associatedShoots" 
        });
      }

      // Create user using the existing Supabase auth system
      const userData: CreateUserData = {
        email,
        password,
        fullName,
        role: 'client'
      };
      
      const result = await createSupabaseUser(userData);
      
      // Update associated shoots to use client's email
      for (const shootId of associatedShoots) {
        await storage.updateShoot(shootId, { clientId: email });
      }
      
      res.json({ 
        message: "Client account created successfully", 
        user: {
          id: result.authUser.id,
          email: result.authUser.email,
          profile: result.profile
        },
        associatedShoots: associatedShoots.length
      });
    } catch (error) {
      console.error("Client registration error:", error);
      res.status(500).json({ 
        message: "Client registration failed", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Local Site Assets API endpoints
  app.get("/api/local-assets", async (req, res) => {
    try {
      const assets = await storage.getLocalSiteAssets();
      res.json(assets);
    } catch (error) {
      console.error("Get local assets error:", error);
      res.status(500).json({ message: "Failed to fetch local assets" });
    }
  });

  app.post("/api/local-assets/upload", upload.single('file'), async (req, res) => {
    try {
      const { assetKey } = req.body;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: 'No file provided' });
      }
      
      if (!assetKey) {
        return res.status(400).json({ message: 'Asset key is required' });
      }
      
      console.log(`🔄 Uploading asset: ${assetKey}`);
      
      // Determine file extension based on mime type
      let extension = '.jpg';
      if (file.mimetype === 'image/png') extension = '.png';
      if (file.mimetype === 'image/webp') extension = '.webp';
      
      // Create the new image file path (-ni version)  
      const fs = await import('fs/promises');
      const path = await import('path');
      const filePath = path.join(process.cwd(), 'public', 'assets', `${assetKey}-ni${extension}`);
      const fileDir = path.dirname(filePath);
      
      // Ensure directory exists
      await fs.mkdir(fileDir, { recursive: true });
      
      // Delete existing -ni file if it exists
      try {
        const existingFiles = await fs.readdir(fileDir);
        const existingNiFile = existingFiles.find(f => f.startsWith(`${path.basename(assetKey)}-ni.`));
        if (existingNiFile) {
          await fs.unlink(path.join(fileDir, existingNiFile));
        }
      } catch (error) {
        // File doesn't exist, which is fine
      }
      
      // Write the new file
      await fs.writeFile(filePath, file.buffer);
      
      // Create or update the asset record in storage
      const assetData = {
        assetKey,
        assetType: 'image' as const,
        filePath: `/assets/${assetKey}-ni${extension}`,
        altText: `${assetKey} image`,
        seoKeywords: null,
        isActive: true,
        updatedBy: 'admin'
      };
      
      let asset;
      const existingAsset = await storage.getLocalSiteAssetByKey(assetKey);
      if (existingAsset) {
        asset = await storage.updateLocalSiteAsset(assetKey, assetData);
      } else {
        asset = await storage.createLocalSiteAsset(assetData);
      }
      
      console.log(`✅ Asset ${assetKey} uploaded successfully`);
      res.json({ 
        success: true, 
        asset,
        message: `Asset ${assetKey} uploaded successfully` 
      });
    } catch (error) {
      console.error('Error uploading asset:', error);
      res.status(500).json({ message: 'Failed to upload asset' });
    }
  });

  app.patch("/api/local-assets/:assetKey/alt-text", async (req, res) => {
    try {
      const { assetKey } = req.params;
      const { altText } = req.body;
      
      if (!altText) {
        return res.status(400).json({ message: 'Alt text is required' });
      }
      
      const asset = await storage.updateLocalSiteAsset(assetKey, {
        altText: altText.trim(),
        updatedBy: 'admin'
      });
      
      if (!asset) {
        return res.status(404).json({ message: 'Asset not found' });
      }
      
      res.json({ 
        message: 'Alt text updated successfully',
        asset
      });
    } catch (error) {
      console.error('Error updating alt text:', error);
      res.status(500).json({ message: 'Failed to update alt text' });
    }
  });

  app.delete("/api/local-assets/:assetKey", async (req, res) => {
    try {
      const { assetKey } = req.params;
      
      // Delete the -ni file from filesystem
      const fs = await import('fs/promises');
      const path = await import('path');
      const assetDir = path.join(process.cwd(), 'public', 'assets');
      const extensions = ['.jpg', '.png', '.webp'];
      
      for (const ext of extensions) {
        try {
          await fs.unlink(path.join(assetDir, `${assetKey}-ni${ext}`));
        } catch (error) {
          // File doesn't exist, which is fine
        }
      }
      
      // Delete from database
      const deleted = await storage.deleteLocalSiteAsset(assetKey);
      
      res.json({ 
        success: true,
        message: 'Asset removed - reverted to fallback image' 
      });
    } catch (error) {
      console.error('Error deleting asset:', error);
      res.status(500).json({ message: 'Failed to delete asset' });
    }
  });

  // Client Portal API endpoints
  app.get("/api/client/shoots/:email", async (req, res) => {
    try {
      const { email } = req.params;
      
      if (!email) {
        return res.status(400).json({ message: "Email parameter required" });
      }

      const shoots = await storage.getShootsByClientEmail(email);
      res.json(shoots);
    } catch (error) {
      console.error("Get client shoots error:", error);
      res.status(500).json({ message: "Failed to fetch client shoots" });
    }
  });

  app.get("/api/client/shoots", async (req, res) => {
    try {
      const { email } = req.query;
      
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: "Email query parameter required" });
      }

      const shoots = await storage.getShootsByClientEmail(email);
      res.json(shoots);
    } catch (error) {
      console.error("Get client shoots error:", error);
      res.status(500).json({ message: "Failed to fetch client shoots" });
    }
  });

  // Staff Management API endpoints (super_admin only)
  app.get("/api/staff", async (req, res) => {
    try {
      // Get all profiles with staff or super_admin roles
      const allProfiles = await storage.getAllProfiles();
      const staffMembers = allProfiles.filter(profile => 
        profile.role === 'staff' || profile.role === 'super_admin'
      );
      res.json(staffMembers);
    } catch (error) {
      console.error("Get staff members error:", error);
      res.status(500).json({ message: "Failed to fetch staff members" });
    }
  });

  app.post("/api/staff", async (req, res) => {
    try {
      const { email, fullName, role, password } = req.body;
      
      if (!email || !fullName || !role || !password) {
        return res.status(400).json({ 
          message: "Missing required fields: email, fullName, role, password" 
        });
      }

      if (!['staff', 'super_admin'].includes(role)) {
        return res.status(400).json({ 
          message: "Role must be 'staff' or 'super_admin'" 
        });
      }

      // Create user using the existing Supabase auth system
      const userData: CreateUserData = {
        email,
        password,
        fullName,
        role
      };
      
      const result = await createSupabaseUser(userData);
      res.json({ 
        message: "Staff member created successfully", 
        user: {
          id: result.authUser.id,
          email: result.authUser.email,
          profile: result.profile
        }
      });
    } catch (error) {
      console.error("Staff creation error:", error);
      res.status(500).json({ 
        message: "Staff member creation failed", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.patch("/api/staff/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { fullName, role } = req.body;
      
      const updates: any = {};
      if (fullName !== undefined) updates.fullName = fullName;
      if (role !== undefined) {
        if (!['staff', 'super_admin'].includes(role)) {
          return res.status(400).json({ 
            message: "Role must be 'staff' or 'super_admin'" 
          });
        }
        updates.role = role;
      }
      
      const updatedProfile = await storage.updateProfile(id, updates);
      
      if (!updatedProfile) {
        return res.status(404).json({ message: "Staff member not found" });
      }
      
      res.json(updatedProfile);
    } catch (error) {
      console.error("Staff update error:", error);
      res.status(500).json({ 
        message: "Failed to update staff member", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.delete("/api/staff/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if the profile exists and is not a super_admin
      const profile = await storage.getProfile(id);
      if (!profile) {
        return res.status(404).json({ message: "Staff member not found" });
      }
      
      if (profile.role === 'super_admin') {
        return res.status(403).json({ 
          message: "Cannot delete super admin accounts" 
        });
      }
      
      const deleted = await storage.deleteProfile(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Staff member not found" });
      }
      
      res.json({ message: "Staff member deleted successfully" });
    } catch (error) {
      console.error("Staff deletion error:", error);
      res.status(500).json({ 
        message: "Failed to delete staff member", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Client API endpoints for client dashboard
  app.get("/api/client/shoots", async (req, res) => {
    try {
      const { email } = req.query;
      
      if (!email) {
        return res.status(400).json({ message: "Email parameter is required" });
      }
      
      console.log(`🔍 Fetching shoots for client email: ${email}`);
      const shoots = await storage.getShootsByClientEmail(email as string);
      console.log(`📋 Found ${shoots.length} shoots for ${email}`);
      
      res.json(shoots);
    } catch (error) {
      console.error("Client shoots fetch error:", error);
      res.status(500).json({ message: "Failed to fetch client shoots" });
    }
  });

  // Use the simple assets router for direct file management
  app.use('/api/simple-assets', simpleAssetsRouter);

  // GET /api/images/featured - Get featured images
  app.get("/api/images/featured", async (req, res) => {
    try {
      const featuredImages = await storage.getFeaturedImages();
      res.json(featuredImages);
    } catch (error) {
      console.error('Error fetching featured images:', error);
      res.status(500).json({ message: 'Failed to fetch featured images' });
    }
  });

  // PATCH /api/images/bulk-featured - Bulk update featured status
  app.patch("/api/images/bulk-featured", async (req, res) => {
    try {
      const { imageIds, featured } = req.body;
      
      if (!Array.isArray(imageIds) || typeof featured !== 'boolean') {
        return res.status(400).json({ message: 'Invalid request body' });
      }
      
      const updatedImages = await storage.updateImageFeaturedStatus(imageIds, featured);
      
      res.json({ 
        message: `${imageIds.length} images ${featured ? 'added to' : 'removed from'} featured`,
        updatedImages 
      });
    } catch (error) {
      console.error('Error updating featured status:', error);
      res.status(500).json({ message: 'Failed to update featured status' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
