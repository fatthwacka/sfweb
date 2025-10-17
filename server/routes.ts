import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { storage } from './storage';
import { db } from './db';
import { seedCompleteDatabase } from './seed-database.js';
import { createSupabaseUser, type CreateUserData } from './supabase-auth.js';
import { populateWithExistingAuth } from './populate-with-existing-auth.js';
import { initializeAdmin } from './init-admin.js';
import { createClient } from '@supabase/supabase-js';
import simpleAssetsRouter from './routes/simple-assets';
import siteConfigRouter from './site-config-api';
import { gradientRoutes } from './routes/gradients';
import pricingPackagesRouter from './pricing-packages-api';
import { sendContactEmail, validateEmailConfig, sendAlbumReadyEmail } from './email-service';
import { verifyRecaptcha } from './recaptcha-service';
import { eq, and } from 'drizzle-orm';
import { 
  insertUserSchema, insertClientSchema, insertShootSchema, 
  insertImageSchema, insertBookingSchema, insertAnalyticsSchema,
  updateImageSequenceSchema, updateAlbumCoverSchema, updateShootDetailsSchema,
  updateShootCustomizationSchema, insertShootPreviewSchema, insertClientSelectionSchema,
  insertSelectionPackageSchema,
  clientSelections, selectionPackages, analytics, previewImages, shootPreviews
} from "@shared/schema";
import { dropboxService } from './services/dropbox-service';
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
  console.log("🔄 Routes registration starting - v3");
  console.log('🚀 REGISTER ROUTES START');
  
  // Authentication endpoints
  console.log('📝 Registering auth endpoints...');
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
        message: z.string().min(1),
        recaptchaToken: z.string().optional()
      });

      const data = contactSchema.parse(req.body);
      
      // Verify reCAPTCHA if token is provided
      if (data.recaptchaToken) {
        const recaptchaResult = await verifyRecaptcha(data.recaptchaToken);
        if (!recaptchaResult.success) {
          console.warn('🤖 Potential bot detected:', recaptchaResult.error);
          return res.status(400).json({ 
            message: "Security verification failed. Please try again.",
            details: recaptchaResult.error
          });
        }
        console.log(`✅ Human verified with score: ${recaptchaResult.score}`);
      }
      
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

      // Send email notification to dax@slyfox.co.za
      console.log("📧 Contact form submission received:", data);
      
      try {
        await sendContactEmail(data);
        console.log("✅ Email sent successfully to dax@slyfox.co.za");
      } catch (emailError) {
        console.error("❌ Email sending failed:", emailError);
        // Continue with success response even if email fails
        // Contact is still saved to database
      }
      
      res.json({ success: true, bookingId: booking.id });
    } catch (error) {
      console.error("Contact form error:", error);
      res.status(400).json({ message: "Invalid form data" });
    }
  });

  // Album ready email notification endpoint
  app.post("/api/client/email-notification", async (req, res) => {
    try {
      const emailSchema = z.object({
        shootId: z.string()
      });

      const data = emailSchema.parse(req.body);
      
      // Get shoot details
      const shoot = await storage.getShoot(data.shootId);
      if (!shoot) {
        return res.status(404).json({ message: "Shoot not found" });
      }

      // Get client details (handle case where clientId might be email or string)
      let client = null;
      let clientEmail = null;
      let clientName = 'Valued Client';

      try {
        if (shoot.clientId) {
          // If it's a number, use getClient, otherwise try to find by email/name
          if (!isNaN(Number(shoot.clientId))) {
            client = await storage.getClient(Number(shoot.clientId));
            if (client) {
              clientEmail = client.email;
              // Use the full name from the database, just ensure proper capitalization
              clientName = client.name
                ? client.name
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ')
                : 'Valued Client';
            }
          } else {
            // If clientId is not a number, it might be an email or string identifier
            console.warn(`Client ID is not numeric: ${shoot.clientId}`);
            // If it looks like an email, look up the client by email
            if (shoot.clientId.includes('@')) {
              clientEmail = shoot.clientId;
              
              // Look up the client in the database by email to get their actual name
              try {
                console.log(`Looking up client by email: ${shoot.clientId}`);
                const clientFromDb = await storage.getClientByEmail(shoot.clientId);
                console.log(`Client lookup result:`, clientFromDb);
                
                if (clientFromDb && clientFromDb.name) {
                  // Use the full name from the database, just ensure proper capitalization
                  clientName = clientFromDb.name
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ');
                  console.log(`✅ Found client by email: ${clientName} (original: ${clientFromDb.name})`);
                } else {
                  console.log(`❌ No client found with email: ${shoot.clientId}`);
                  clientName = 'Valued Client';
                }
              } catch (dbError) {
                console.error(`Error looking up client by email: ${dbError}`);
                clientName = 'Valued Client';
              }
            }
          }
        }
      } catch (error) {
        console.warn(`Could not fetch client details: ${error}`);
      }

      // If we still don't have a client email, we can't send
      if (!clientEmail) {
        return res.status(400).json({ message: "No client email found for this shoot" });
      }
      
      // Get statistics for the shoot
      let professionalRetouchCount = 0;
      let totalImagesCount = 0;
      let coverImageUrl = '';
      let statisticsImageUrl = '';
      
      try {
        // Get selections (hearts = professional retouch)
        const selections = await storage.getClientSelections(shoot.id);
        const heartsSelections = selections.filter(s => s.rating === 'heart');
        professionalRetouchCount = heartsSelections.length;
        
        // Get total images in the album
        const images = await storage.getImagesByShoot(shoot.id);
        totalImagesCount = images.length;
        
        // Get the cover image or first image for main preview (higher quality)
        const coverImage = images.find(img => img.featuredImage === true) || images[0];
        console.log(`Cover image found:`, coverImage);
        
        if (coverImage && coverImage.storagePath) {
          // Add transformation for main preview - higher quality
          coverImageUrl = coverImage.storagePath.includes('supabase') 
            ? coverImage.storagePath.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/') + '?width=600&height=400&resize=cover&quality=85'
            : coverImage.storagePath;
          console.log(`Cover image URL generated:`, coverImageUrl);
        }
        
        // Get a different image for statistics section (not the same as cover image)
        console.log(`Total images: ${images.length}, Cover image ID: ${coverImage?.id}`);
        
        // Find an image that's different from the cover image
        const differentImage = images.find(img => img.id !== coverImage?.id);
        
        if (differentImage && differentImage.storagePath) {
          // Smaller square format for statistics section
          statisticsImageUrl = differentImage.storagePath.includes('supabase') 
            ? differentImage.storagePath.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/') + '?width=300&height=300&resize=cover'
            : differentImage.storagePath;
          console.log(`Statistics image URL generated:`, statisticsImageUrl, `(using ${differentImage.filename})`);
        } else {
          console.log(`No different image available for statistics section. Only one image or no valid different image.`);
        }
      } catch (error) {
        console.warn('Could not fetch shoot statistics:', error);
      }
      
      // Construct gallery URL and client portal URL
      const galleryUrl = `${req.protocol}://${req.get('host')}/gallery/${shoot.customSlug || shoot.id}`;
      const clientPortalUrl = `${req.protocol}://${req.get('host')}/client-portal`;
      
      // Send album ready email
      await sendAlbumReadyEmail({
        clientEmail: clientEmail,
        clientName: clientName,
        shootTitle: shoot.title || 'Your Photo Session',
        galleryUrl: galleryUrl,
        clientPortalUrl: clientPortalUrl,
        customSlug: shoot.customSlug,
        professionalRetouchCount: professionalRetouchCount,
        totalImagesCount: totalImagesCount,
        coverImageUrl: coverImageUrl,
        statisticsImageUrl: statisticsImageUrl
      });

      console.log(`✅ Album ready email sent to ${clientEmail} for shoot: ${shoot.title}`);
      res.json({ success: true, message: "Album ready notification sent successfully" });
      
    } catch (error) {
      console.error("Album ready email error:", error);
      res.status(500).json({ 
        message: "Failed to send album ready notification",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
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

      // Fetch images for each shoot to get cover images
      const shootsWithImages = await Promise.all(
        shoots.map(async (shoot) => {
          const images = await storage.getImagesByShoot(shoot.id);
          return { ...shoot, images };
        })
      );

      res.json({ client, shoots: shootsWithImages });
    } catch (error) {
      console.error("Client fetch error:", error);
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  app.get("/api/clients/by-email/:email", async (req, res) => {
    try {
      const { email } = req.params;
      const client = await storage.getClientByEmail(email);

      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      res.json(client);
    } catch (error) {
      console.error("Client fetch by email error:", error);
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
  console.log('📝 Registering shoot endpoints...');
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

  // Public galleries endpoint for demo page and public showcases
  app.get("/api/galleries/public", async (req, res) => {
    try {
      const publicShoots = await storage.getPublicShoots();
      res.json(publicShoots);
    } catch (error) {
      console.error("Fetch public galleries error:", error);
      res.status(500).json({ message: "Failed to fetch public galleries" });
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
      
      // Handle image sequence updates if provided - PERFORMANCE OPTIMIZED
      if (updates.imageSequences) {
        const imageSequences = updates.imageSequences;
        console.log(`🚀 Batch updating ${Object.keys(imageSequences).length} image sequences`);
        
        // Use batch update for much better performance
        await storage.batchUpdateImageSequences(imageSequences);
        
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

  console.log('🔥 ABOUT TO REGISTER DELETE SHOOTS ROUTE');
  app.delete("/api/shoots/:identifier", async (req, res) => {
    console.log('🚨🚨🚨 DELETE SHOOTS ROUTE HIT - THIS SHOULD SHOW UP!', req.params.identifier);
    try {
      const shootId = req.params.identifier;
      console.log('Deleting shoot by ID:', shootId);
      
      console.log('🔍 CALLING storage.deleteShoot...');
      const success = await storage.deleteShoot(shootId);
      console.log('🔍 storage.deleteShoot result:', success);
      
      if (success) {
        console.log('✅ Delete successful, sending success response');
        res.json({ message: "Shoot deleted successfully", shootId });
      } else {
        console.log('❌ Delete failed (returned false)');
        res.status(500).json({ message: "Failed to delete shoot" });
      }
    } catch (error: any) {
      console.error("❌ Delete shoot error:", error);
      res.status(500).json({ message: "Failed to delete shoot", error: error.message });
    }
  });

  // Delete preview data (client selections, packages, analytics, etc) for a shoot
  app.delete("/api/shoots/:id/preview-data", async (req, res) => {
    try {
      const shootId = req.params.id;
      console.log('🗑️ Deleting preview data for shoot:', shootId);
      
      // NEW BEHAVIOR: Delete preview images but preserve dispute data
      const deletionResults = {
        deletedImages: 0,
        deletedStorageFiles: 0,
        preservedSelections: 0,
        preservedAnalytics: 0,
        auditLog: null as any
      };

      // Get preview images to delete (both DB records and storage files)
      const previewImagesToDelete = await db
        .select()
        .from(previewImages)
        .where(eq(previewImages.shootId, shootId));
      
      deletionResults.deletedImages = previewImagesToDelete.length;

      // Get count of data we're preserving for disputes
      const preservedSelections = await db
        .select()
        .from(clientSelections)
        .where(eq(clientSelections.shootId, shootId));
      
      deletionResults.preservedSelections = preservedSelections.length;

      const preservedAnalytics = await db
        .select()
        .from(analytics)
        .where(eq(analytics.shootId, shootId));
      
      deletionResults.preservedAnalytics = preservedAnalytics.length;

      // Create audit log entry
      const auditEntry = {
        shootId,
        deletedAt: new Date().toISOString(),
        imagesDeleted: previewImagesToDelete.length,
        imageFilenames: previewImagesToDelete.map(img => img.filename),
        preservedSelectionsCount: preservedSelections.length,
        preservedAnalyticsCount: preservedAnalytics.length,
        action: 'preview_images_cleanup', // Clarify this is storage cleanup, not dispute data removal
        reason: 'Storage cleanup - dispute data preserved'
      };

      // Store audit log in analytics table
      await db.insert(analytics).values({
        userId: null,
        shootId: shootId, // Keep the reference since we're not deleting analytics
        actionType: 'preview_images_cleanup',
        metadata: auditEntry,
        createdAt: new Date()
      });

      // Initialize Supabase client for storage cleanup
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Delete preview images from Supabase Storage
      let storageDeleteCount = 0;
      for (const previewImage of previewImagesToDelete) {
        try {
          const { error } = await supabase.storage
            .from('preview-images')
            .remove([previewImage.supabaseStoragePath]);
          
          if (error) {
            console.error(`Failed to delete storage file ${previewImage.filename}:`, error);
          } else {
            storageDeleteCount++;
            console.log(`✅ Deleted storage file: ${previewImage.filename}`);
          }
        } catch (error) {
          console.error(`Error deleting storage file ${previewImage.filename}:`, error);
        }
      }
      
      deletionResults.deletedStorageFiles = storageDeleteCount;

      // Delete preview images from database
      await db.delete(previewImages)
        .where(eq(previewImages.shootId, shootId));

      // PRESERVE dispute-related data:
      // - client_selections (for dispute resolution)
      // - analytics (for usage tracking)
      // - selection_packages (for payment disputes)
      console.log(`🛡️ Preserved ${deletionResults.preservedSelections} client selections for dispute resolution`);
      console.log(`🛡️ Preserved ${deletionResults.preservedAnalytics} analytics records`);
      
      // NOTE: shoot_previews record is also preserved to maintain workflow UUID

      console.log('✅ Preview images cleanup completed:', deletionResults);
      
      res.json({
        message: 'Preview images cleaned up successfully. Dispute data preserved.',
        deletedImages: deletionResults.deletedImages,
        deletedStorageFiles: deletionResults.deletedStorageFiles,
        preservedSelections: deletionResults.preservedSelections,
        preservedAnalytics: deletionResults.preservedAnalytics,
        auditLog: auditEntry
      });
    } catch (error: any) {
      console.error('❌ Error deleting preview data:', error);
      res.status(500).json({ 
        message: 'Failed to delete preview data', 
        error: error.message 
      });
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

  // PATCH /api/images/bulk-assignment - Bulk assign images to shoots (MUST come before :id route)
  app.patch("/api/images/bulk-assignment", async (req, res) => {
    console.log('🚨 BULK ASSIGNMENT API HIT - Request Body:', JSON.stringify(req.body, null, 2));
    try {
      const { imageIds, shootId } = req.body;
      
      if (!Array.isArray(imageIds) || !shootId) {
        console.error('❌ Invalid request body validation failed:', { imageIds: Array.isArray(imageIds), shootId: !!shootId });
        return res.status(400).json({ message: 'Invalid request body: imageIds array and shootId required' });
      }
      
      console.log(`🔄 Bulk assigning ${imageIds.length} images to shoot ${shootId}`);
      
      const results = [];
      for (const imageId of imageIds) {
        try {
          console.log(`Attempting to update image ${imageId} with shootId: ${shootId}`);
          const updatedImage = await storage.updateImage(imageId, { shootId });
          console.log(`Successfully updated image ${imageId}:`, updatedImage?.id);
          results.push({ id: imageId, success: true });
        } catch (error) {
          console.error(`Failed to assign image ${imageId} to shoot ${shootId}:`, error);
          results.push({ id: imageId, success: false, error: error.message });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      
      res.json({ 
        success: true,
        message: `${successCount} of ${imageIds.length} images assigned to shoot`,
        results
      });
    } catch (error) {
      console.error('❌❌❌ CRITICAL ERROR in bulk assignment:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ message: 'Failed to assign images', error: error.message });
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
  // Supports up to 50 images per batch upload (10MB each max)
  // TODO: Implement proper upload manager with resumable uploads for larger batches
  app.post("/api/images/upload", upload.array('images', 50), async (req, res) => {
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

  // Batch image upload endpoint for direct uploads (replacing Dropbox)
  app.post("/api/images/batch-upload", upload.single('image'), async (req, res) => {
    try {
      const file = req.file;
      const { shootId } = req.body;

      if (!file) {
        return res.status(400).json({ message: "No file provided" });
      }

      if (!shootId) {
        return res.status(400).json({ message: "Shoot ID is required" });
      }

      console.log(`📸 Processing batch upload for shoot ${shootId}: ${file.originalname}`);

      // Check for existing files with the same name and handle overwrite
      const existingPreviewImages = await db.select()
        .from(previewImages)
        .where(and(
          eq(previewImages.shootId, shootId),
          eq(previewImages.filename, file.originalname)
        ));

      console.log(`🔍 Found ${existingPreviewImages.length} existing files with name: ${file.originalname}`);

      // ROBUST APPROACH: Initialize preview workflow using atomic service
      const { previewWorkflowService } = await import('./services/preview-workflow-service');
      
      // Initialize or verify preview workflow exists
      const workflowState = await previewWorkflowService.initializePreviewWorkflow(shootId);
      console.log(`🎯 Workflow state: ${workflowState.state} for shoot ${shootId}`);

      // Initialize Supabase client
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for admin operations
      );

      // If overwriting existing files, delete old storage files and database records
      if (existingPreviewImages.length > 0) {
        console.log(`🗑️ Overwriting ${existingPreviewImages.length} existing files`);
        
        for (const existingImage of existingPreviewImages) {
          // Delete from Supabase Storage if storage path exists
          if (existingImage.supabaseStoragePath) {
            console.log(`🗑️ Deleting storage file: ${existingImage.supabaseStoragePath}`);
            const { error: deleteError } = await supabase.storage
              .from('preview-images')
              .remove([existingImage.supabaseStoragePath]);
            
            if (deleteError) {
              console.warn(`⚠️ Failed to delete storage file ${existingImage.supabaseStoragePath}:`, deleteError);
            }
          }
          
          // Delete database record
          await db.delete(previewImages)
            .where(eq(previewImages.id, existingImage.id));
          
          // NOTE: We intentionally DO NOT delete client_selections here because:
          // 1. They're needed for dispute resolution
          // 2. They're properly partitioned by shootId AND clientId
          // 3. The UI doesn't pre-load old selections anyway
          // 4. Each filename can safely exist across multiple albums/clients
          
          console.log(`✅ Deleted existing preview image: ${existingImage.filename}`);
        }
      }

      // Upload to Supabase Storage (use preview-images bucket for preview workflow)
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2);
      const fileExtension = file.originalname.split('.').pop();
      const filename = `${timestamp}_${randomId}.${fileExtension}`;
      const storagePath = `shoots/${shootId}/${filename}`;
      
      // Upload to preview-images bucket for preview workflow
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('preview-images')
        .upload(storagePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        return res.status(500).json({ 
          message: "Failed to upload to storage",
          error: uploadError 
        });
      }

      // Get public URL from preview-images bucket
      const { data: { publicUrl } } = supabase.storage
        .from('preview-images')
        .getPublicUrl(storagePath);

      // Create preview image record in database (using preview_images table, not regular images)
      const previewImageData = {
        shootId: shootId,
        filename: file.originalname,
        supabaseUrl: publicUrl,
        supabaseStoragePath: storagePath,
        originalDropboxPath: null, // Not using Dropbox anymore
        fileSize: file.size,
        contentType: file.mimetype,
        uploadedBy: '070dae19-d4ce-4fe0-b3d4-a090fa3ece3a', // Use admin@slyfox.co.za profile ID
        migrationBatchId: null,
        metadata: null
      };

      // Insert directly into preview_images table using raw SQL/ORM
      const [newPreviewImage] = await db.insert(previewImages).values(previewImageData).returning();

      console.log(`🖼️ Preview image created: ${newPreviewImage.filename} for workflow state: ${workflowState.state}`);

      res.json({ 
        success: true, 
        url: publicUrl,
        image: newPreviewImage,
        workflowState: workflowState,
        message: `Successfully uploaded ${file.originalname}`
      });

    } catch (error) {
      console.error("Batch upload error:", error);
      res.status(500).json({ 
        message: "Failed to upload image",
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

  // Generic file upload endpoint for homepage settings and other admin features
  app.post("/api/upload", upload.single('file'), async (req, res) => {
    try {
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: 'No file provided' });
      }
      
      console.log(`🔄 Uploading file: ${file.originalname} (${file.mimetype})`);
      
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      // Generate unique filename to avoid conflicts
      const timestamp = Date.now();
      const fileExtension = path.extname(file.originalname);
      const fileName = `${path.basename(file.originalname, fileExtension)}_${timestamp}${fileExtension}`;
      const filePath = path.join(uploadsDir, fileName);
      
      // Write file to disk
      fs.writeFileSync(filePath, file.buffer);
      
      const relativePath = `/uploads/${fileName}`;
      
      console.log(`✅ File uploaded: ${fileName} -> ${relativePath}`);
      
      res.json({
        success: true,
        path: relativePath,
        filename: fileName,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype
      });
      
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({ message: 'Failed to upload file' });
    }
  });

  // SEO-optimized upload endpoint for category hero images
  app.post("/api/upload/category-hero", upload.single('file'), async (req, res) => {
    try {
      const file = req.file;
      const { category, type } = req.body; // e.g., category="weddings", type="photography"
      
      if (!file) {
        return res.status(400).json({ message: 'No file provided' });
      }
      
      if (!category || !type) {
        return res.status(400).json({ message: 'Category and type are required for SEO optimization' });
      }
      
      console.log(`🔍 SEO Upload: ${category} ${type} - ${file.originalname}`);
      
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      // Generate SEO-optimized filename
      const fileExtension = path.extname(file.originalname).toLowerCase();
      const baseName = `slyfox-${category.toLowerCase()}-${type.toLowerCase()}-durban-hero`;
      const optimalName = `${baseName}${fileExtension}`;
      
      // Get list of existing files
      const existingFiles = fs.readdirSync(uploadsDir);
      
      // Check if optimal name exists
      const optimalPath = path.join(uploadsDir, optimalName);
      if (fs.existsSync(optimalPath)) {
        // Archive the current optimal file
        const archivedName = `${baseName}-archived-${Date.now()}${fileExtension}`;
        const archivedPath = path.join(uploadsDir, archivedName);
        fs.renameSync(optimalPath, archivedPath);
        console.log(`📦 Archived existing hero: ${optimalName} -> ${archivedName}`);
      }
      
      // Write new file with optimal SEO name
      fs.writeFileSync(optimalPath, file.buffer);
      
      // Generate intelligent alt text
      const categoryDescriptions: { [key: string]: string } = {
        weddings: "elegant wedding ceremony with bride and groom",
        wedding: "elegant wedding ceremony with bride and groom",
        portraits: "professional portrait session with studio lighting",
        portrait: "professional portrait session with studio lighting",
        corporate: "executive headshot in modern office setting",
        events: "dynamic event photography capturing special moments",
        event: "dynamic event photography capturing special moments",
        products: "commercial product showcase with professional lighting",
        product: "commercial product showcase with professional lighting",
        graduation: "graduation ceremony photography with academic regalia"
      };
      
      const categoryKey = category.toLowerCase().replace(/s$/, ''); // Remove plural 's' if present
      const description = categoryDescriptions[categoryKey] || categoryDescriptions[category.toLowerCase()] || "professional photography session";
      const autoAltText = `Professional ${category} ${type} by SlyFox Studios in Durban - ${description}`;
      
      const relativePath = `/uploads/${optimalName}`;
      
      console.log(`✅ SEO Optimized Upload: ${optimalName}`);
      console.log(`🏷️ Generated Alt Text: ${autoAltText}`);
      
      res.json({
        success: true,
        path: relativePath,
        filename: optimalName,
        originalName: file.originalname,
        generatedAltText: autoAltText,
        seoOptimized: true,
        size: file.size,
        mimetype: file.mimetype
      });
      
    } catch (error) {
      console.error('SEO upload error:', error);
      res.status(500).json({ message: 'Failed to upload with SEO optimization' });
    }
  });

  // Browse all site images endpoint
  app.get("/api/browse-images", async (req, res) => {
    try {
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.svg'];
      const imageFolders: { [key: string]: string[] } = {};
      
      // Define image folders to scan
      const foldersToScan = [
        'uploads',
        'images/hero', 
        'images/gallery',
        'images/backgrounds',
        'images/portfolio',
        'images/services',
        'images/testimonials',
        'images/logos',
        'assets/hero'
      ];
      
      foldersToScan.forEach(folder => {
        const fullPath = path.join(process.cwd(), 'public', folder);
        
        if (fs.existsSync(fullPath)) {
          try {
            const files = fs.readdirSync(fullPath, { withFileTypes: true })
              .filter(dirent => dirent.isFile())
              .map(dirent => dirent.name)
              .filter(file => imageExtensions.some(ext => file.toLowerCase().endsWith(ext)))
              .map(file => `/${folder}/${file}`)
              .sort(); // Sort alphabetically
            
            if (files.length > 0) {
              const folderName = folder.includes('/') 
                ? folder.split('/').join(' ').replace('images ', '') 
                : folder;
              imageFolders[folderName] = files;
            }
          } catch (error) {
            console.warn(`Warning: Could not read folder ${folder}:`, error);
          }
        }
      });
      
      console.log(`📸 Image browser found ${Object.keys(imageFolders).length} folders with images`);
      res.json(imageFolders);
      
    } catch (error) {
      console.error('Error browsing images:', error);
      res.status(500).json({ 
        message: 'Failed to browse images',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Use the simple assets router for direct file management
  app.use('/api/simple-assets', simpleAssetsRouter);

  // Use the site config router for configuration management
  app.use(siteConfigRouter);

  // Use the gradient routes for gradient configuration management
  app.use('/api/gradients', gradientRoutes);

  // Use the pricing packages router for pricing management
  app.use(pricingPackagesRouter);

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

  // ===================================
  // PREVIEW SELECTION SYSTEM API ROUTES
  // ===================================

  // GET /api/shoots/:shootId/preview-settings - Get preview settings for a shoot
  app.get("/api/shoots/:shootId/preview-settings", async (req, res) => {
    try {
      const { shootId } = req.params;
      const settings = await storage.getShootPreviewSettings(shootId);
      res.json(settings);
    } catch (error) {
      console.error('Error fetching preview settings:', error);
      res.status(500).json({ message: 'Failed to fetch preview settings' });
    }
  });

  // PATCH /api/shoots/:shootId/preview-settings - Update preview settings for a shoot
  app.patch("/api/shoots/:shootId/preview-settings", async (req, res) => {
    try {
      const { shootId } = req.params;
      const { 
        submission_completed, 
        submission_completed_at, 
        submission_completed_by,
        editing_completed,
        editing_completed_at
      } = req.body;
      
      // Get existing settings first
      const existingSettings = await storage.getShootPreviewSettings(shootId);
      if (!existingSettings) {
        return res.status(404).json({ message: 'Preview settings not found' });
      }
      
      // Prepare update object based on what fields are provided
      const updateData: any = {};
      
      if (submission_completed !== undefined) {
        updateData.submissionCompleted = submission_completed;
      }
      if (submission_completed_at !== undefined) {
        updateData.submissionCompletedAt = submission_completed_at ? new Date(submission_completed_at) : undefined;
      }
      if (submission_completed_by !== undefined) {
        updateData.submissionCompletedBy = submission_completed_by;
      }
      if (editing_completed !== undefined) {
        updateData.editingCompleted = editing_completed;
      }
      if (editing_completed_at !== undefined) {
        updateData.editingCompletedAt = editing_completed_at ? new Date(editing_completed_at) : undefined;
      }
      
      // Update with provided fields
      const updatedSettings = await storage.updateShootPreviewSettings(existingSettings.id, updateData);
      
      res.json(updatedSettings);
    } catch (error) {
      console.error('Error updating preview settings:', error);
      res.status(500).json({ message: 'Failed to update preview settings' });
    }
  });

  // POST /api/preview-settings - Create preview settings
  app.post("/api/preview-settings", async (req, res) => {
    try {
      const validatedData = insertShootPreviewSchema.parse(req.body);
      const settings = await storage.createShootPreviewSettings(validatedData);
      
      // Trigger image migration if Dropbox share link is provided
      console.log(`🔍 DEBUG: Checking migration conditions...`);
      console.log(`🔍 DEBUG: dropboxShareLink: ${settings.dropboxShareLink}`);
      console.log(`🔍 DEBUG: dropboxService.isConfigured(): ${dropboxService.isConfigured()}`);
      
      if (settings.dropboxShareLink && dropboxService.isConfigured()) {
        console.log(`🚀 Triggering image migration for shoot ${settings.shootId}`);
        
        try {
          const { ImageMigrationService } = await import('./services/image-migration-service.js');
          const migrationService = new ImageMigrationService(process.env.DROPBOX_ACCESS_TOKEN!);
          
          // Get system user for migration tracking
          const systemUserId = '00000000-0000-0000-0000-000000000000'; // System user
          
          // Start migration synchronously for better user feedback
          try {
            const migrationResult = await migrationService.migrateDropboxToSupabase(
              settings.shootId, 
              settings.dropboxShareLink, 
              systemUserId
            );
            
            console.log(`✅ Migration completed: ${migrationResult.migratedCount} images migrated (batch: ${migrationResult.batchId})`);
            if (migrationResult.errors.length > 0) {
              console.error('⚠️  Migration errors:', migrationResult.errors);
            }
          } catch (migrationError) {
            console.error('💥 Migration failed:', migrationError);
            // Don't fail the request - settings were saved successfully
          }
          
        } catch (migrationError) {
          console.error('⚠️  Failed to start migration:', migrationError);
          // Don't fail the request - settings were saved successfully
        }
      }
      
      res.status(201).json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      console.error('Error creating preview settings:', error);
      res.status(500).json({ message: 'Failed to create preview settings' });
    }
  });

  // PATCH /api/preview-settings/:id - Update preview settings
  app.patch("/api/preview-settings/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertShootPreviewSchema.parse(req.body);
      const settings = await storage.updateShootPreviewSettings(id, validatedData);
      
      // Trigger image migration if Dropbox share link is updated
      console.log(`🔍 DEBUG: Checking re-migration conditions...`);
      console.log(`🔍 DEBUG: dropboxShareLink: ${settings.dropboxShareLink}`);
      console.log(`🔍 DEBUG: dropboxService.isConfigured(): ${dropboxService.isConfigured()}`);
      
      if (settings.dropboxShareLink && dropboxService.isConfigured()) {
        console.log(`🔄 Triggering image re-migration for shoot ${settings.shootId}`);
        
        try {
          const { ImageMigrationService } = await import('./services/image-migration-service.js');
          const migrationService = new ImageMigrationService(process.env.DROPBOX_ACCESS_TOKEN!);
          
          // Get system user for migration tracking
          const systemUserId = '00000000-0000-0000-0000-000000000000'; // System user
          
          // Start re-migration synchronously for better user feedback
          const migrationResult = await migrationService.migrateDropboxToSupabase(
            settings.shootId, 
            settings.dropboxShareLink, 
            systemUserId
          );
          
          console.log(`✅ Re-migration completed: ${migrationResult.migratedCount} images migrated (batch: ${migrationResult.batchId})`);
          if (migrationResult.errors.length > 0) {
            console.error('⚠️  Migration errors:', migrationResult.errors);
          }
        } catch (migrationError) {
          console.error('💥 Re-migration failed:', migrationError);
          // Don't fail the request - settings were saved successfully
        }
      }
      
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      console.error('Error updating preview settings:', error);
      res.status(500).json({ message: 'Failed to update preview settings' });
    }
  });

  // ROBUST WORKFLOW STATE ENDPOINTS
  console.log('🎯 Registering preview workflow state endpoints...');
  
  // GET /api/workflow/state/:shootId - Get workflow state for a single shoot
  app.get("/api/workflow/state/:shootId", async (req, res) => {
    try {
      const { shootId } = req.params;
      const { previewWorkflowService } = await import('./services/preview-workflow-service');
      
      const workflowState = await previewWorkflowService.getWorkflowState(shootId);
      res.json(workflowState);
    } catch (error) {
      console.error('Error getting workflow state:', error);
      res.status(500).json({ message: 'Failed to get workflow state' });
    }
  });

  // POST /api/workflow/states - Get workflow states for multiple shoots
  app.post("/api/workflow/states", async (req, res) => {
    try {
      const { shootIds } = req.body;
      
      if (!Array.isArray(shootIds)) {
        return res.status(400).json({ message: 'shootIds must be an array' });
      }
      
      const { previewWorkflowService } = await import('./services/preview-workflow-service');
      const workflowStates = await previewWorkflowService.getMultipleWorkflowStates(shootIds);
      
      res.json(workflowStates);
    } catch (error) {
      console.error('Error getting multiple workflow states:', error);
      res.status(500).json({ message: 'Failed to get workflow states' });
    }
  });

  // POST /api/workflow/transition/:shootId - Transition workflow state
  app.post("/api/workflow/transition/:shootId", async (req, res) => {
    try {
      const { shootId } = req.params;
      const { action, submittedBy } = req.body;
      const { previewWorkflowService } = await import('./services/preview-workflow-service');
      
      let workflowState;
      
      switch (action) {
        case 'submit':
          workflowState = await previewWorkflowService.markSubmissionCompleted(shootId, submittedBy);
          break;
        case 'complete_editing':
          workflowState = await previewWorkflowService.markEditingCompleted(shootId);
          break;
        case 'reset':
          workflowState = await previewWorkflowService.resetWorkflow(shootId);
          break;
        default:
          return res.status(400).json({ message: 'Invalid action. Use: submit, complete_editing, or reset' });
      }
      
      res.json(workflowState);
    } catch (error) {
      console.error('Error transitioning workflow state:', error);
      res.status(500).json({ 
        message: 'Failed to transition workflow state',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // GET /api/preview-images/:shootId - Get preview images from Supabase for client selection
  app.get("/api/preview-images/:shootId", async (req, res) => {
    try {
      const { shootId } = req.params;
      
      const previewImages = await storage.getPreviewImages(shootId);
      
      // Transform to match expected interface with optimized thumbnails
      const images = previewImages.map((img: any) => {
        // Generate optimized thumbnail URL using Supabase image transformation
        // Add resize parameters for fast loading: width=400, quality=80, format=webp
        const thumbnailUrl = `${img.supabaseUrl}?width=400&height=400&resize=cover&quality=80&format=webp`;
        
        return {
          filename: img.filename,
          fullImageUrl: img.supabaseUrl, // Keep original for modal view
          thumbnailUrl: thumbnailUrl,    // Optimized for grid display
          metadata: {
            size: img.fileSize || 0,
            modified: img.createdAt,
          },
        };
      });

      res.json({ images });
    } catch (error) {
      console.error('Error fetching preview images:', error);
      res.status(500).json({ message: 'Failed to fetch preview images' });
    }
  });

  // POST /api/preview-images/:shootId/check-duplicates - Check for duplicate filenames before upload
  app.post("/api/preview-images/:shootId/check-duplicates", async (req, res) => {
    try {
      const { shootId } = req.params;
      const { filenames } = req.body;
      
      if (!Array.isArray(filenames)) {
        return res.status(400).json({ message: 'filenames must be an array' });
      }

      // Get existing preview images for this shoot
      const previewImages = await storage.getPreviewImages(shootId);
      const existingFilenames = previewImages.map((img: any) => img.filename);
      
      // Find duplicates
      const duplicates = filenames.filter(filename => existingFilenames.includes(filename));
      
      res.json({
        duplicates,
        hasDuplicates: duplicates.length > 0
      });
    } catch (error) {
      console.error('Error checking for duplicate filenames:', error);
      res.status(500).json({ message: 'Failed to check for duplicates' });
    }
  });

  // DELETE /api/preview-images/:shootId/image/:filename - Delete individual preview image
  app.delete("/api/preview-images/:shootId/image/:filename", async (req, res) => {
    try {
      const { shootId, filename } = req.params;
      const { userEmail } = req.body;
      
      console.log(`🗑️ Delete request for image ${filename} in shoot ${shootId} by ${userEmail}`);

      // Check if shoot exists (more lenient check)
      const settings = await storage.getShootPreviewSettings(shootId);
      if (!settings) {
        return res.status(404).json({ message: 'Preview settings not found' });
      }
      
      // Allow deletion even if preview is inactive - user may want to clean up
      console.log(`Preview settings found for shoot ${shootId}, active: ${settings.isActive}`);

      // Get all preview images for this shoot
      const previewImages = await storage.getPreviewImages(shootId);
      
      // Find the specific image to delete
      const imageToDelete = previewImages.find((img: any) => img.filename === filename);
      
      if (!imageToDelete) {
        return res.status(404).json({ message: 'Image not found in preview' });
      }

      try {
        // For now, we'll just delete from the database
        // Storage deletion can be handled separately if needed
        // Most preview images are stored in Dropbox anyway, not Supabase
        
        // Delete from database using storage service
        const dbDeleteSuccess = await storage.deletePreviewImage(shootId, filename);
        
        if (!dbDeleteSuccess) {
          console.warn('Database deletion failed, but continuing...');
        }
        
        // If the image has a Supabase URL, log it for manual cleanup if needed
        if (imageToDelete.supabaseUrl) {
          console.log(`Note: Supabase storage file may need manual cleanup: ${imageToDelete.supabaseUrl}`);
        }
        
        console.log(`✅ Successfully deleted ${filename} from preview`);
        
        res.json({ 
          success: true, 
          message: `Successfully deleted ${filename}`,
          filename: filename
        });
        
      } catch (deleteError) {
        console.error('Error during deletion:', deleteError);
        res.status(500).json({ 
          message: 'Failed to delete image',
          error: deleteError instanceof Error ? deleteError.message : 'Unknown error'
        });
      }
      
    } catch (error) {
      console.error('Preview image deletion error:', error);
      res.status(500).json({ 
        message: 'Failed to delete preview image',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // DELETE /api/preview-images/:shootId - Cleanup preview images after final gallery is created
  app.delete("/api/preview-images/:shootId", async (req, res) => {
    try {
      const { shootId } = req.params;
      
      console.log(`🧹 Admin cleanup requested for shoot ${shootId}`);

      if (!dropboxService.isConfigured()) {
        return res.status(503).json({ message: 'Dropbox service not configured for cleanup' });
      }

      const { ImageMigrationService } = await import('./services/image-migration-service.js');
      const migrationService = new ImageMigrationService(process.env.DROPBOX_ACCESS_TOKEN!);

      const result = await migrationService.cleanupPreviewImages(shootId);
      
      if (result.success) {
        console.log(`✅ Cleanup completed: ${result.deletedCount} preview images removed`);
        res.json({ 
          success: true, 
          message: `Successfully cleaned up ${result.deletedCount} preview images`,
          deletedCount: result.deletedCount 
        });
      } else {
        console.error('💥 Cleanup failed');
        res.status(500).json({ message: 'Failed to cleanup preview images' });
      }

    } catch (error) {
      console.error('Error during preview cleanup:', error);
      res.status(500).json({ message: 'Failed to cleanup preview images' });
    }
  });

  // POST /api/migrate-dropbox-images - Migrate images from Dropbox to Supabase
  app.post("/api/migrate-dropbox-images", async (req, res) => {
    try {
      const { shootId, sharedLink, userId } = req.body;
      
      if (!shootId || !sharedLink) {
        return res.status(400).json({ message: 'shootId and sharedLink are required' });
      }
      
      if (!dropboxService.isConfigured()) {
        return res.status(503).json({ message: 'Dropbox service not configured' });
      }

      console.log(`🚀 Starting migration for shoot ${shootId} from shared link`);

      const { ImageMigrationService } = await import('./services/image-migration-service.js');
      const migrationService = new ImageMigrationService(process.env.DROPBOX_ACCESS_TOKEN!);
      
      // Use provided userId or default to system user
      const systemUserId = userId || '00000000-0000-0000-0000-000000000000';
      
      const result = await migrationService.migrateDropboxToSupabase(
        shootId,
        sharedLink,
        systemUserId
      );
      
      console.log(`✅ Migration completed: ${result.migratedCount} images (batch: ${result.batchId})`);
      
      res.json({
        success: result.success,
        migratedCount: result.migratedCount,
        batchId: result.batchId,
        errors: result.errors
      });

    } catch (error) {
      console.error('Error during image migration:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to migrate images',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // POST /api/dropbox/test-connection - Test Dropbox connection
  app.post("/api/dropbox/test-connection", async (req, res) => {
    try {
      const { folderPath, shareLink } = req.body;
      
      if (!dropboxService.isConfigured()) {
        return res.status(503).json({ message: 'Dropbox service not configured' });
      }

      let files;
      if (folderPath) {
        files = await dropboxService.listFiles(folderPath);
      } else if (shareLink) {
        files = await dropboxService.listFilesFromSharedLink(shareLink);
      } else {
        return res.status(400).json({ message: 'Either folderPath or shareLink required' });
      }

      res.json({ 
        success: true, 
        imageCount: files.length,
        message: `Successfully connected to folder with ${files.length} images` 
      });
    } catch (error) {
      console.error('Error testing Dropbox connection:', error);
      res.status(400).json({ 
        success: false,
        message: error instanceof Error ? error.message : 'Failed to connect to Dropbox folder' 
      });
    }
  });

  // GET /api/dropbox/preview-images/:shootId - Get preview images from Dropbox
  app.get("/api/dropbox/preview-images/:shootId", async (req, res) => {
    try {
      const { shootId } = req.params;
      
      if (!dropboxService.isConfigured()) {
        return res.status(503).json({ message: 'Dropbox service not configured' });
      }

      const settings = await storage.getShootPreviewSettings(shootId);
      if (!settings || !settings.isActive) {
        return res.status(404).json({ message: 'Preview settings not found or inactive' });
      }

      let files;
      if (settings.dropboxFolderPath && settings.dropboxFolderPath.trim()) {
        files = await dropboxService.listFiles(settings.dropboxFolderPath.trim());
      } else if (settings.dropboxShareLink && settings.dropboxShareLink.trim()) {
        files = await dropboxService.listFilesFromSharedLink(settings.dropboxShareLink.trim());
      } else {
        return res.status(400).json({ message: 'No Dropbox folder or shared link configured' });
      }

      // Get temporary links for all files
      const imagePromises = files.map(async (file) => {
        try {
          // For shared links, we need to handle the path differently
          const filePath = file.path_display || file.path_lower || `/${file.name}`;
          
          // If we're using a shared link, we need to pass it to the methods
          const isSharedLink = !!settings.dropboxShareLink;
          
          let thumbnailUrl, fullImageUrl;
          
          if (isSharedLink && settings.dropboxShareLink) {
            // For shared links, use the shared link in the API calls
            const [thumbnail, fullImage] = await Promise.all([
              dropboxService.getThumbnailFromSharedLink(settings.dropboxShareLink, filePath, 'w256h256'),
              dropboxService.getTemporaryLinkFromSharedLink(settings.dropboxShareLink, filePath)
            ]);
            thumbnailUrl = thumbnail;
            fullImageUrl = fullImage;
          } else {
            // For regular paths, use the standard methods
            const [thumbnail, fullImage] = await Promise.all([
              dropboxService.getThumbnail(filePath, 'w256h256'),
              dropboxService.getTemporaryLink(filePath)
            ]);
            thumbnailUrl = thumbnail;
            fullImageUrl = fullImage;
          }

          return {
            filename: file.name,
            thumbnailUrl,
            fullImageUrl,
            metadata: {
              size: file.size || 0,
              modified: file.server_modified || file.client_modified || new Date().toISOString()
            }
          };
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
          return null;
        }
      });

      const images = (await Promise.all(imagePromises)).filter(img => img !== null);

      res.json({
        shootId,
        images,
        totalCount: images.length
      });
    } catch (error) {
      console.error('Error fetching preview images:', error);
      res.status(500).json({ message: 'Failed to fetch preview images' });
    }
  });

  // GET /api/client-selections/:shootId - Get client selections for a shoot
  app.get("/api/client-selections/:shootId", async (req, res) => {
    try {
      const { shootId } = req.params;
      const selections = await storage.getClientSelections(shootId);
      res.json(selections);
    } catch (error) {
      console.error('Error fetching client selections:', error);
      res.status(500).json({ message: 'Failed to fetch client selections' });
    }
  });

  // PATCH /api/client-selections/:selectionId/editing-status - Update editing completion status
  app.patch("/api/client-selections/:selectionId/editing-status", async (req, res) => {
    try {
      const { selectionId } = req.params;
      const { editingComplete } = req.body;
      
      if (typeof editingComplete !== 'boolean') {
        return res.status(400).json({ message: 'editingComplete must be a boolean' });
      }
      
      const updatedSelection = await storage.updateClientSelectionEditingStatus(
        selectionId, 
        editingComplete,
        editingComplete ? new Date() : null
      );
      
      if (!updatedSelection) {
        return res.status(404).json({ message: 'Selection not found' });
      }
      
      res.json(updatedSelection);
    } catch (error) {
      console.error('Error updating editing status:', error);
      res.status(500).json({ message: 'Failed to update editing status' });
    }
  });

  // POST /api/client-selections/:shootId - Create or update client selection
  app.post("/api/client-selections/:shootId", async (req, res) => {
    let selectionData: any = null;
    try {
      const { shootId } = req.params;
      const { imageFilename, selectionStatus, userEmail, isFinalSelection = false } = req.body;
      
      console.log('🔥 CLIENT SELECTION REQUEST DATA:', JSON.stringify({
        shootId,
        imageFilename,
        selectionStatus,
        userEmail,
        isFinalSelection
      }, null, 2));
      
      // Get or create client profile by email to get the proper UUID
      console.log('🔥 LOOKING UP CLIENT PROFILE FOR EMAIL:', userEmail);
      let client = await storage.getProfileByEmail(userEmail);
      console.log('🔥 CLIENT PROFILE FOUND:', client ? 'YES' : 'NO', client ? client.id : 'N/A');
      
      if (!client) {
        console.log('🔥 CLIENT PROFILE NOT FOUND - CREATING NEW PROFILE FOR EMAIL:', userEmail);
        // Create a new client profile with minimal information
        client = await storage.createProfile({
          id: crypto.randomUUID(), // Explicitly generate UUID
          email: userEmail,
          fullName: userEmail.split('@')[0], // Use fullName instead of firstName/lastName
          role: 'client',
          profileImageUrl: null,
          bannerImageUrl: null,
          themePreference: 'light'
        });
        console.log('🔥 CREATED NEW CLIENT PROFILE:', client.id);
      }
      
      const clientId = client.id; // Use the UUID from the profile
      
      selectionData = {
        shootId,
        clientId,
        imageFilename,
        selectionStatus,
        isFinalSelection,
        selectedAt: selectionStatus !== 'none' ? new Date() : null  // Use Date object, not string
      };

      console.log('🔥 SELECTION DATA TO SAVE:', JSON.stringify(selectionData, null, 2));
      const selection = await storage.upsertClientSelection(selectionData);
      console.log('🔥 SELECTION SAVED SUCCESSFULLY:', JSON.stringify(selection, null, 2));
      res.json(selection);
    } catch (error) {
      console.error('🔥 ERROR SAVING CLIENT SELECTION:', error);
      if (selectionData) {
        console.error('🔥 SELECTION DATA THAT FAILED:', JSON.stringify(selectionData, null, 2));
      }
      res.status(500).json({ message: 'Failed to update client selection' });
    }
  });


  // POST /api/client-selections/:shootId/clear-all - Clear all selections for a shoot
  app.post("/api/client-selections/:shootId/clear-all", async (req, res) => {
    try {
      const { shootId } = req.params;
      const { userEmail, timestamp } = req.body;
      
      console.log('🗑️ CLEAR ALL SELECTIONS REQUEST:', JSON.stringify({
        shootId,
        userEmail,
        timestamp
      }, null, 2));
      
      // Get or create client profile by email
      let client = await storage.getProfileByEmail(userEmail);
      if (!client) {
        client = await storage.createProfile({
          id: crypto.randomUUID(),
          email: userEmail,
          fullName: userEmail.split('@')[0],
          role: 'client',
          profileImageUrl: null,
          bannerImageUrl: null,
          themePreference: 'light'
        });
      }
      
      const clientId = client.id;
      
      // Clear all selections by setting status to 'unselected'
      const clearedCount = await storage.clearAllClientSelections(shootId, clientId);
      
      console.log('🗑️ CLEAR ALL COMPLETED:', clearedCount, 'selections cleared');
      
      res.json({
        message: `Successfully cleared ${clearedCount} selections`,
        clearedCount,
        shootId,
        clientId,
        timestamp
      });
      
    } catch (error) {
      console.error('🗑️ ERROR CLEARING ALL SELECTIONS:', error);
      res.status(500).json({ message: 'Failed to clear all selections' });
    }
  });

  // ===================================
  // SIMPLE REST API FOR SELECTIONS (FAST VERSION)
  // ===================================
  
  // PUT /api/selections/:shootId/:imageFilename - Update single selection (FAST)
  app.put("/api/selections/:shootId/:imageFilename", async (req, res) => {
    try {
      const { shootId, imageFilename } = req.params;
      const { action, userEmail } = req.body;
      
      // Get or create client profile
      let client = await storage.getProfileByEmail(userEmail);
      if (!client) {
        client = await storage.createProfile({
          id: crypto.randomUUID(),
          email: userEmail,
          fullName: userEmail.split('@')[0],
          role: 'client',
          profileImageUrl: null,
          bannerImageUrl: null,
          themePreference: 'light'
        });
      }
      
      // Simple upsert - single operation
      const selection = await storage.upsertClientSelection({
        shootId,
        clientId: client.id,
        imageFilename,
        selectionStatus: action === 'favorite' ? 'favorite' : action,
        isFinalSelection: action === 'favorite',
        selectedAt: action !== 'none' ? new Date() : null
      });
      
      res.json({ 
        success: true, 
        selection: {
          imageFilename: selection.imageFilename,
          action: selection.selectionStatus,
          isFavorite: selection.isFinalSelection
        }
      });
      
    } catch (error) {
      console.error('ERROR updating selection:', error);
      res.status(500).json({ error: 'Selection update failed' });
    }
  });
  
  // GET /api/selections/:shootId - Get all selections for a shoot (FAST)
  app.get("/api/selections/:shootId", async (req, res) => {
    try {
      const { shootId } = req.params;
      const userEmail = req.headers['x-user-email'] as string || req.query.userEmail as string;
      
      // Get client
      const client = await storage.getProfileByEmail(userEmail);
      if (!client) {
        return res.json({ selections: [] });
      }
      
      // Get selections
      const selections = await storage.getClientSelections(shootId);
      const clientSelections = selections
        .filter(s => s.clientId === client.id)
        .map(s => ({
          imageFilename: s.imageFilename,
          action: s.selectionStatus,
          isFavorite: s.isFinalSelection
        }));
      
      res.json({ selections: clientSelections });
      
    } catch (error) {
      console.error('ERROR fetching selections:', error);
      res.status(500).json({ error: 'Failed to fetch selections' });
    }
  });
  
  // DELETE /api/selections/:shootId - Clear all selections (FAST)
  app.delete("/api/selections/:shootId", async (req, res) => {
    try {
      const { shootId } = req.params;
      const userEmail = req.headers['x-user-email'] as string || req.body.userEmail;
      
      // Get client
      const client = await storage.getProfileByEmail(userEmail);
      if (!client) {
        return res.json({ success: true, cleared: 0 });
      }
      
      const clearedCount = await storage.clearAllClientSelections(shootId, client.id);
      
      res.json({ 
        success: true, 
        cleared: clearedCount 
      });
      
    } catch (error) {
      console.error('ERROR clearing selections:', error);
      res.status(500).json({ error: 'Failed to clear selections' });
    }
  });

  // POST /api/selections/:shootId/submit - Submit selections to photographer
  console.log('🚀 Registering POST /api/selections/:shootId/submit endpoint');
  app.post("/api/selections/:shootId/submit", async (req, res) => {
    console.log('📧 Submit selections endpoint called for shoot:', req.params.shootId);
    try {
      const { shootId } = req.params;
      const { userEmail, favorites, likes, dislikes, totalImages } = req.body;
      
      // Import email service
      const { sendSelectionSubmissionEmail, validateEmailConfig } = await import('./email-service');
      
      // Get shoot details
      const shoot = await storage.getShoot(shootId);
      if (!shoot) {
        return res.status(404).json({ error: 'Shoot not found' });
      }
      
      // Get client info
      const client = await storage.getProfileByEmail(userEmail);
      const clientName = client?.name || undefined;
      
      // Prepare email data
      const emailData = {
        clientEmail: userEmail,
        clientName,
        shootTitle: shoot.customTitle || shoot.title,
        shootDate: new Date(shoot.shootDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        favorites: favorites || [],
        likes: likes || [],
        dislikes: dislikes || [],
        totalImages: totalImages || 0
      };
      
      // Check if email is configured
      if (!validateEmailConfig()) {
        console.warn('Email not configured, skipping email notification');
        // Still return success - we don't want to block the submission
        return res.json({ 
          success: true, 
          message: 'Selection recorded successfully',
          emailSent: false 
        });
      }
      
      // Send email
      await sendSelectionSubmissionEmail(emailData);
      
      res.json({ 
        success: true, 
        message: 'Selection submitted successfully',
        emailSent: true 
      });
      
    } catch (error) {
      console.error('ERROR submitting selections:', error);
      res.status(500).json({ error: 'Failed to submit selections' });
    }
  });

  // GET /api/selection-packages/:shootId/:clientId - Get selection package for client
  app.get("/api/selection-packages/:shootId/:clientId", async (req, res) => {
    try {
      const { shootId, clientId } = req.params;
      
      let selectionPackage = await storage.getSelectionPackage(shootId, clientId);
      
      // If no package exists, create default one
      if (!selectionPackage) {
        const previewSettings = await storage.getShootPreviewSettings(shootId);
        const baseLimit = previewSettings?.selectionLimit || 20;
        
        selectionPackage = await storage.createSelectionPackage({
          shootId,
          clientId,
          baseLimit,
          purchasedAdditional: 0
        });
      }
      
      res.json(selectionPackage);
    } catch (error) {
      console.error('Error fetching selection package:', error);
      res.status(500).json({ message: 'Failed to fetch selection package' });
    }
  });

  // POST /api/selection-packages/:shootId/:clientId/upgrade - Upgrade selection package
  app.post("/api/selection-packages/:shootId/:clientId/upgrade", async (req, res) => {
    try {
      const { shootId, clientId } = req.params;
      const { upgradeType } = req.body; // '5', '10', or 'unlimited'
      
      const previewSettings = await storage.getShootPreviewSettings(shootId);
      if (!previewSettings) {
        return res.status(404).json({ message: 'Preview settings not found' });
      }

      let additionalImages = 0;
      let price = '0.00';
      
      switch (upgradeType) {
        case '5':
          additionalImages = 5;
          price = previewSettings.additionalBundle5Price;
          break;
        case '10':
          additionalImages = 10;
          price = previewSettings.additionalBundle10Price;
          break;
        case 'unlimited':
          additionalImages = 9999; // Large number for "unlimited"
          price = previewSettings.unlimitedBundlePrice;
          break;
        default:
          return res.status(400).json({ message: 'Invalid upgrade type' });
      }

      const updatedPackage = await storage.upgradeSelectionPackage(
        shootId, 
        clientId, 
        additionalImages, 
        { type: upgradeType, price, timestamp: new Date().toISOString() }
      );
      
      res.json(updatedPackage);
    } catch (error) {
      console.error('Error upgrading selection package:', error);
      res.status(500).json({ message: 'Failed to upgrade selection package' });
    }
  });

  // API ping endpoint for connection testing
  app.head("/api/ping", (req, res) => {
    res.status(200).send();
  });

  app.get("/api/ping", (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });

  const httpServer = createServer(app);
  return httpServer;
}
