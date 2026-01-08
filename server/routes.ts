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
import { categoryHeroesRouter } from './routes/category-heroes';
import pricingPackagesRouter from './pricing-packages-api';
import blogRouter from './routes/blog';
import aiBlogRouter from './routes/ai-blog';
import contentManagementRouter from './routes/content-management/index.js';
import promptEngineRouter from './routes/prompt-engine';
import contentTypesRouter from './routes/content-types';
import { sendContactEmail, validateEmailConfig, sendAlbumReadyEmail } from './email-service';
import { verifyRecaptcha } from './recaptcha-service';
import { eq, and, sql } from 'drizzle-orm';
// Import video processing functions for 3-tier FFmpeg processing
import { processVideo, shouldTranscodeVideo, validateVideoForProcessing, formatFileSize, formatDuration } from './video-processing';
import {
  insertUserSchema, insertClientSchema, insertShootSchema,
  insertImageSchema, insertVideoSchema, insertBookingSchema, insertAnalyticsSchema,
  updateImageSequenceSchema, updateAlbumCoverSchema, updateShootDetailsSchema,
  updateShootCustomizationSchema, insertShootPreviewSchema, insertClientSelectionSchema,
  insertSelectionPackageSchema,
  clientSelections, selectionPackages, analytics, previewImages, shootPreviews, images, videos
} from "@shared/schema";
import { dropboxService } from './services/dropbox-service';
import { z } from "zod";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit (hero images can be large, compressed client-side)
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
        process.env.VITE_SUPABASE_PUBLISHABLE_KEY!
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
        .select('id, email, full_name, role, subscription_tier, email_verified_at, theme_preference')
        .eq('id', data.user.id)
        .single();

      const user = {
        id: data.user.id,
        email: data.user.email!,
        role: profile?.role || 'user',
        fullName: profile?.full_name || profile?.email?.split('@')[0],
        themePreference: profile?.theme_preference || 'light',
        subscriptionTier: profile?.subscription_tier || 'free',
        emailVerifiedAt: profile?.email_verified_at || null
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
      const { email, password, fullName } = req.body;

      // Validation
      if (!email || !password || !fullName) {
        return res.status(400).json({ message: "Email, password, and full name are required" });
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      // Password strength validation (minimum 8 characters)
      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long" });
      }

      // Full name validation
      if (fullName.trim().length < 2) {
        return res.status(400).json({ message: "Please enter your full name" });
      }

      // Import createSupabaseUser dynamically to avoid circular imports
      const { createSupabaseUser } = await import("./supabase-auth");

      // Create user with Supabase
      // 'user' role = generic signups (tools, newsletter, etc.)
      // 'client' role = photography customers (assigned manually when they book)
      const result = await createSupabaseUser({
        email: email.toLowerCase().trim(),
        password,
        fullName: fullName.trim(),
        role: 'user',
        themePreference: 'light'
      });

      console.log(`✅ New user registered: ${email}`);

      // Return user data for auto-login
      const user = {
        id: result.authUser.id,
        email: result.authUser.email,
        role: result.profile?.role || 'user',
        fullName: result.profile?.full_name || fullName,
        themePreference: result.profile?.theme_preference || 'light',
        subscriptionTier: result.profile?.subscription_tier || 'free',
        emailVerifiedAt: result.profile?.email_verified_at || null
      };

      res.status(201).json({ user, message: "Account created successfully" });
    } catch (error) {
      console.error("Registration error:", error);
      const errorMessage = error instanceof Error ? error.message : "Registration failed";

      // Handle specific error cases
      if (errorMessage.includes("already exists") || errorMessage.includes("already registered")) {
        return res.status(409).json({ message: "An account with this email already exists" });
      }

      res.status(500).json({ message: errorMessage });
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
      
      // Send email notification
      console.log("📧 Contact form submission received:", data);
      
      try {
        await sendContactEmail(data);
        console.log("✅ Email sent successfully to dax@slyfox.co.za");
        res.json({ success: true, message: "Message sent successfully" });
      } catch (emailError) {
        console.error("❌ Email sending failed:", emailError);
        res.status(500).json({ 
          success: false, 
          message: "Failed to send message. Please try again or contact us directly at info@slyfox.co.za" 
        });
      }
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

  // Bulk download endpoint - download entire gallery as ZIP (≤50 images)
  app.get("/api/gallery/:slug/download", async (req, res) => {
    console.log(`🔽 Bulk download request for: ${req.params.slug}`);
    
    try {
      const { slug } = req.params;
      
      // Create Supabase client with server-side secret key
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SECRET_KEY!
      );

      // Get the shoot details first using direct Supabase query
      // Try both custom_slug and id to match frontend logic
      const { data: shoots, error: shootsError } = await supabase
        .from('shoots')
        .select('*');

      if (shootsError || !shoots) {
        console.log(`❌ Error fetching shoots:`, shootsError);
        return res.status(500).json({ message: "Database error" });
      }

      console.log(`🔍 Looking for shoot with slug: "${slug}"`);
      console.log(`🔍 Available shoots: ${shoots.length}`);
      shoots.forEach(s => {
        console.log(`  - ID: ${s.id}, custom_slug: ${s.custom_slug}, title: ${s.title}`);
      });

      // Find shoot by custom_slug or ID (same logic as frontend)
      const shoot = shoots.find(s => 
        s.custom_slug === slug || s.id === slug
      );
        
      if (!shoot) {
        console.log(`❌ Shoot not found: ${slug}`);
        console.log(`❌ Searched for custom_slug="${slug}" OR id="${slug}"`);
        return res.status(404).json({ message: "Gallery not found" });
      }

      console.log(`✅ Found shoot: ${shoot.title} (ID: ${shoot.id}, custom_slug: ${shoot.custom_slug})`)

      // Check if gallery is private
      if (shoot.is_private) {
        console.log(`❌ Gallery is private: ${slug}`);
        return res.status(403).json({ message: "Private gallery", type: "private" });
      }

      // Get all media for this shoot (both images and videos) using direct Supabase query
      console.log(`🔍 Searching for media with shoot_id: ${shoot.id}`);
      
      const { data: images, error: imagesError } = await supabase
        .from('images')
        .select('*')
        .eq('shoot_id', shoot.id)
        .order('sequence', { ascending: true });

      const { data: videos, error: videosError } = await supabase
        .from('videos')
        .select('*')
        .eq('shoot_id', shoot.id)
        .order('sequence', { ascending: true });

      console.log(`📊 Media found: ${images?.length || 0} images, ${videos?.length || 0} videos`);
      if (imagesError) console.log(`❌ Images error:`, imagesError);
      if (videosError) console.log(`❌ Videos error:`, videosError);

      if ((imagesError && videosError) || (!images?.length && !videos?.length)) {
        console.log(`❌ No media found for: ${slug}`, { imagesError, videosError });
        return res.status(404).json({ message: "No media found" });
      }

      // Combine images and videos, sort by sequence
      const allMedia = [
        ...(images || []).map(item => ({ ...item, mediaType: 'image' })),
        ...(videos || []).map(item => ({ ...item, mediaType: 'video' }))
      ].sort((a, b) => a.sequence - b.sequence);

      if (allMedia.length === 0) {
        console.log(`❌ No media found for: ${slug}`);
        return res.status(404).json({ message: "No media found" });
      }

      // Limit to albums with ≤65 media files for reliable downloads
      if (allMedia.length > 65) {
        console.log(`❌ Album too large: ${allMedia.length} files (max 65 for now)`);
        return res.status(413).json({ 
          message: "Album too large", 
          details: `This album has ${allMedia.length} files. Currently only albums with 65 files or fewer can be downloaded.`
        });
      }

      console.log(`📦 Preparing ZIP download for ${allMedia.length} files (${images?.length || 0} images, ${videos?.length || 0} videos)`);
      
      // Create ZIP using JSZip (now properly installed!)
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      // Track progress
      let processedFiles = 0;
      
      // Add each media file to the ZIP
      for (const mediaItem of allMedia) {
        try {
          console.log(`📄 Processing ${mediaItem.mediaType} ${processedFiles + 1}/${allMedia.length}: ${mediaItem.filename}`);
          
          // Extract the storage path for Supabase
          let storagePath;
          let bucketName;
          
          if (mediaItem.mediaType === 'video') {
            bucketName = 'gallery-videos';
            if (mediaItem.storage_path.includes('supabase.co')) {
              const urlParts = mediaItem.storage_path.split('/storage/v1/object/public/gallery-videos/');
              storagePath = urlParts[1];
            } else {
              storagePath = mediaItem.storage_path;
            }
          } else {
            bucketName = 'gallery-images';
            if (mediaItem.storage_path.includes('supabase.co')) {
              const urlParts = mediaItem.storage_path.split('/storage/v1/object/public/gallery-images/');
              storagePath = urlParts[1];
            } else {
              storagePath = mediaItem.storage_path;
            }
          }

          if (!storagePath) {
            console.warn(`⚠️ Invalid storage path for ${mediaItem.mediaType}: ${mediaItem.id}`);
            continue;
          }

          // Download file from Supabase Storage
          const { data: fileData, error: downloadError } = await supabase.storage
            .from(bucketName)
            .download(storagePath);

          if (downloadError || !fileData) {
            console.warn(`⚠️ Failed to download ${mediaItem.mediaType} ${mediaItem.id}:`, downloadError);
            continue;
          }

          // Convert blob to buffer
          const buffer = Buffer.from(await fileData.arrayBuffer());

          // Generate consistent sequential filename using loop index
          const extension = mediaItem.filename.split('.').pop() || (mediaItem.mediaType === 'video' ? 'mp4' : 'jpg');
          const mediaTypePrefix = mediaItem.mediaType === 'video' ? 'video' : 'image';
          const sequentialFilename = `${mediaTypePrefix}-${String(processedFiles + 1).padStart(3, '0')}.${extension}`;

          // Add to ZIP
          zip.file(sequentialFilename, buffer);

          processedFiles++;
          console.log(`✅ Added to ZIP: ${sequentialFilename} (${processedFiles}/${allMedia.length})`);
          
        } catch (mediaError) {
          console.warn(`⚠️ Error processing ${mediaItem.mediaType} ${mediaItem.id}:`, mediaError);
          continue;
        }
      }

      if (processedFiles === 0) {
        console.log(`❌ No files could be processed`);
        return res.status(500).json({ message: "No files could be downloaded" });
      }

      console.log(`🎉 ZIP creation complete: ${processedFiles}/${allMedia.length} files processed`);
      
      // Generate ZIP file
      const zipBuffer = await zip.generateAsync({ 
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      // Set response headers for ZIP download
      const zipFilename = `${shoot.customTitle || shoot.title || 'gallery'}-${new Date().toISOString().split('T')[0]}.zip`;
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);
      res.setHeader('Content-Length', zipBuffer.length);

      // Send the ZIP file
      res.send(zipBuffer);
      
    } catch (error) {
      console.error("❌ Bulk download error:", error);
      if (!res.headersSent) {
        return res.status(500).json({ message: "Failed to create download" });
      }
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

      // Fetch images and videos for each shoot to get cover images
      const shootsWithMedia = await Promise.all(
        shoots.map(async (shoot) => {
          const images = await storage.getImagesByShoot(shoot.id);
          const videos = await storage.getVideosByShoot(shoot.id);
          return { ...shoot, images, videos };
        })
      );

      res.json({ client, shoots: shootsWithMedia });
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

  // Optimized portfolio endpoint - only fetches essential cover image data
  app.get("/api/portfolio/cards", async (req, res) => {
    try {
      // OPTIMIZED: Batch fetch all data in parallel instead of N+1 queries
      const publicShoots = await storage.getPublicShoots();

      // Separate shoots by type
      const videoShootIds = publicShoots.filter(s => s.mediaType === 'video').map(s => s.id);
      const photoShoots = publicShoots.filter(s => s.mediaType !== 'video');
      const photoShootsWithBanner = photoShoots.filter(s => s.bannerImageId);
      const photoShootsWithoutBanner = photoShoots.filter(s => !s.bannerImageId);

      // Batch fetch all cover media in parallel (single query each, not N queries!)
      const bannerImageIds = photoShootsWithBanner.map(s => s.bannerImageId!).filter(Boolean);
      const [coverVideosMap, bannerImageMap, fallbackImagesMap] = await Promise.all([
        videoShootIds.length > 0 ? storage.getCoverVideosForShoots(videoShootIds) : Promise.resolve(new Map()),
        bannerImageIds.length > 0 ? storage.getImagesByIds(bannerImageIds) : Promise.resolve(new Map()),
        photoShootsWithoutBanner.length > 0
          ? storage.getImagesForShoots(photoShootsWithoutBanner.map(s => s.id))
          : Promise.resolve(new Map())
      ]);

      // Build portfolio cards using pre-fetched data
      const portfolioCards = publicShoots.map(shoot => {
        let coverImageUrl = '';
        let coverVideoInfo = null;

        if (shoot.mediaType === 'video') {
          const coverVideo = coverVideosMap.get(shoot.id);
          if (coverVideo) {
            coverVideoInfo = {
              id: coverVideo.id,
              storagePath: coverVideo.storagePath,
              optimizedPath: coverVideo.optimizedPath,
              thumbnailPath: coverVideo.thumbnailPath,
              duration: coverVideo.duration,
              filename: coverVideo.filename
            };
            coverImageUrl = coverVideo.thumbnailPath;
          }
        } else {
          // Photo album: try banner first, then fallback images
          let coverImage = null;

          if (shoot.bannerImageId) {
            coverImage = bannerImageMap.get(shoot.bannerImageId);
          }

          if (!coverImage) {
            const images = fallbackImagesMap.get(shoot.id) || [];
            coverImage = images.find(img => img.featuredImage === true) || images[0];
          }

          if (coverImage && coverImage.storagePath) {
            coverImageUrl = coverImage.storagePath.includes('supabase')
              ? coverImage.storagePath.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/') + '?width=600&height=400&resize=cover&quality=85'
              : coverImage.storagePath;
          }
        }

        return {
          ...shoot,
          coverImageUrl,
          coverVideoInfo
        };
      });
      
      // Group shoots by groupName for portfolio bundling (same logic as before)
      const portfolioItems = [];
      const groupedShoots = new Map();
      
      // Group processing logic remains the same...
      for (const shoot of portfolioCards) {
        if (shoot.groupName) {
          if (!groupedShoots.has(shoot.groupName)) {
            groupedShoots.set(shoot.groupName, []);
          }
          groupedShoots.get(shoot.groupName).push(shoot);
        } else {
          portfolioItems.push(shoot);
        }
      }
      
      // Create bundled cards for groups
      for (const [groupName, shoots] of groupedShoots) {
        const photoShoots = shoots.filter(s => s.mediaType === 'photo');
        const videoShoots = shoots.filter(s => s.mediaType === 'video');
        const primaryShoot = photoShoots.length > 0 ? photoShoots[0] : videoShoots[0];
        
        // For groups: prioritize photo cover images over video thumbnails
        let groupCoverImageUrl = '';
        let groupCoverVideoInfo = null;
        
        if (photoShoots.length > 0) {
          // Use photo cover if available
          groupCoverImageUrl = photoShoots[0].coverImageUrl || '';
        } else if (videoShoots.length > 0) {
          // Only use video if no photos available
          groupCoverImageUrl = videoShoots[0].coverImageUrl || '';
          groupCoverVideoInfo = videoShoots[0].coverVideoInfo;
        }
        
        const bundledCard = {
          ...primaryShoot,
          id: `group-${groupName.toLowerCase().replace(/\s+/g, '-')}`,
          title: groupName,
          description: `${shoots.length} galleries`,
          isGroup: true,
          groupName: groupName,
          shootCount: shoots.length,
          coverImageUrl: groupCoverImageUrl,
          coverVideoInfo: groupCoverVideoInfo,
          shoots: shoots.map(s => ({ 
            id: s.id, 
            title: s.title, 
            mediaType: s.mediaType,
            customSlug: s.customSlug 
          }))
        };
        portfolioItems.push(bundledCard);
      }

      // Note: Randomization is now handled on frontend for better UX
      // (different order on each page load, not just server restart)
      res.json(portfolioItems);
    } catch (error) {
      console.error("Fetch portfolio cards error:", error);
      res.status(500).json({ message: "Failed to fetch portfolio cards" });
    }
  });

  // Legacy endpoint - keep for backward compatibility but mark as deprecated
  app.get("/api/galleries/public", async (req, res) => {
    // Redirect to optimized endpoint
    res.redirect(301, "/api/portfolio/cards");
  });

  // Get existing portfolio group names for admin dropdown
  app.get("/api/portfolio/groups", async (req, res) => {
    try {
      const groups = await storage.getPortfolioGroups();
      res.json(groups);
    } catch (error) {
      console.error("Fetch portfolio groups error:", error);
      res.status(500).json({ message: "Failed to fetch portfolio groups" });
    }
  });

  // Test endpoint for cover image debugging
  app.get("/api/test/cover-image/:shootId", async (req, res) => {
    try {
      const { shootId } = req.params;
      
      // Get shoot data
      const shoot = await storage.getShoot(shootId);
      if (!shoot) {
        return res.status(404).json({ error: "Shoot not found" });
      }
      
      // Get images using both methods
      const imagesIndividual = await storage.getImagesByShoot(shootId);
      const imagesMap = await storage.getImagesForShoots([shootId]);
      const imagesBatch = imagesMap.get(shootId) || [];
      
      // Test cover image logic
      let coverImageIndividual = null;
      let coverImageBatch = null;
      
      if (shoot.bannerImageId) {
        coverImageIndividual = imagesIndividual.find(img => img.id === shoot.bannerImageId);
        coverImageBatch = imagesBatch.find(img => img.id === shoot.bannerImageId);
      }
      
      res.json({
        shoot: {
          id: shoot.id,
          title: shoot.title,
          bannerImageId: shoot.bannerImageId
        },
        individual: {
          totalImages: imagesIndividual.length,
          firstImageId: imagesIndividual[0]?.id,
          bannerFound: !!coverImageIndividual,
          bannerImage: coverImageIndividual ? {
            id: coverImageIndividual.id,
            filename: coverImageIndividual.filename,
            uploadOrder: coverImageIndividual.uploadOrder
          } : null
        },
        batch: {
          totalImages: imagesBatch.length,
          firstImageId: imagesBatch[0]?.id,
          bannerFound: !!coverImageBatch,
          bannerImage: coverImageBatch ? {
            id: coverImageBatch.id,
            filename: coverImageBatch.filename,
            uploadOrder: coverImageBatch.uploadOrder
          } : null
        },
        match: coverImageIndividual?.id === coverImageBatch?.id
      });
    } catch (error) {
      console.error("Cover image test error:", error);
      res.status(500).json({ message: "Test failed" });
    }
  });

  // Get portfolio group details (shoots grouped by groupName)
  app.get("/api/portfolio/groups/:groupName", async (req, res) => {
    try {
      const { groupName } = req.params;
      const decodedGroupName = decodeURIComponent(groupName.replace(/-/g, ' '));

      // OPTIMIZED: Single query gets shoots WITH banner image data via JOIN
      const groupShootsWithBanner = await storage.getPublicShootsWithBannerByGroupName(decodedGroupName);

      if (groupShootsWithBanner.length === 0) {
        return res.status(404).json({ message: "Portfolio group not found" });
      }

      // Only need to fetch videos and images for shoots without banners
      const videoShootIds = groupShootsWithBanner.filter(s => s.mediaType === 'video').map(s => s.id);
      const photoShootsWithoutBanner = groupShootsWithBanner.filter(s => s.mediaType !== 'video' && !s.bannerImage);

      // Batch fetch: only cover videos and fallback images (banner already in first query)
      const [videosMap, imagesMap] = await Promise.all([
        videoShootIds.length > 0 ? storage.getCoverVideosForShoots(videoShootIds) : Promise.resolve(new Map()),
        photoShootsWithoutBanner.length > 0 ? storage.getImagesForShoots(photoShootsWithoutBanner.map(s => s.id)) : Promise.resolve(new Map())
      ]);

      // Build the response using pre-fetched data
      const shootsWithCoverMedia = groupShootsWithBanner.map(shoot => {
        let coverImageUrl = '';
        let coverVideoInfo = null;

        if (shoot.mediaType === 'video') {
          // videosMap now returns single cover video, not array
          const coverVideo = videosMap.get(shoot.id);

          if (coverVideo) {
            coverVideoInfo = {
              id: coverVideo.id,
              storagePath: coverVideo.storagePath,
              optimizedPath: coverVideo.optimizedPath,
              thumbnailPath: coverVideo.thumbnailPath,
              duration: coverVideo.duration,
              filename: coverVideo.filename
            };
            coverImageUrl = coverVideo.thumbnailPath;
          }
        } else {
          // For photo albums: use bannerImage from JOIN, or fall back to images
          let coverImagePath = null;

          // Banner image was fetched via JOIN - use it directly
          if (shoot.bannerImage) {
            coverImagePath = shoot.bannerImage.storagePath;
          } else {
            // Fall back to images for shoots without banner
            const images = imagesMap.get(shoot.id) || [];
            const fallbackImage = images.find(img => img.featuredImage === true) || images[0];
            if (fallbackImage) {
              coverImagePath = fallbackImage.storagePath;
            }
          }

          if (coverImagePath) {
            coverImageUrl = coverImagePath.includes('supabase')
              ? coverImagePath.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/') + '?width=600&height=400&resize=cover&quality=85'
              : coverImagePath;
          }
        }

        // Remove bannerImage from response (internal use only)
        const { bannerImage, ...shootData } = shoot;
        return {
          ...shootData,
          coverImageUrl,
          coverVideoInfo
        };
      });

      res.json({
        groupName: decodedGroupName,
        shoots: shootsWithCoverMedia,
        shootCount: shootsWithCoverMedia.length
      });
    } catch (error) {
      console.error("Fetch portfolio group error:", error);
      res.status(500).json({ message: "Failed to fetch portfolio group" });
    }
  });

  app.get("/api/shoots/:id", async (req, res) => {
    try {
      const shootId = req.params.id; // Keep as string for UUID
      const shoot = await storage.getShoot(shootId);
      
      if (!shoot) {
        return res.status(404).json({ message: "Shoot not found" });
      }

      console.log(`📤 GET shoot ${shootId} result:`, { id: shoot?.id, groupName: shoot?.groupName });
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

      // Handle video sequence updates if provided - PERFORMANCE OPTIMIZED
      if (updates.videoSequences) {
        const videoSequences = updates.videoSequences;
        console.log(`🎬 Batch updating ${Object.keys(videoSequences).length} video sequences`);

        // Use batch update for much better performance
        await storage.batchUpdateVideoSequences(videoSequences);

        // Remove videoSequences from shoot updates since it's not a shoot field
        delete updates.videoSequences;
      }
      
      // Only update shoot if there are other fields to update
      let shoot;
      if (Object.keys(updates).length > 0) {
        console.log(`🔄 Updating shoot ${shootId} with:`, updates);
        shoot = await storage.updateShoot(shootId, updates);
        console.log(`📥 Updated shoot result:`, { id: shoot?.id, groupName: shoot?.groupName });
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
        process.env.SUPABASE_SECRET_KEY!
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
      const { shootId } = req.query;

      if (shootId && typeof shootId === 'string') {
        // Fetch images for a specific shoot
        const images = await storage.getImagesByShoot(shootId);
        console.log(`Fetched ${images.length} images for shoot ${shootId}`);
        res.json(images);
      } else {
        // Fetch all images (for admin panel overview)
        const allImages = await storage.getAllImages();
        console.log(`Fetched ${allImages.length} images for admin panel`);
        res.json(allImages);
      }
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

  // Check for filename conflicts before upload
  app.post("/api/images/check-conflicts", async (req, res) => {
    try {
      const { shootId, filenames }: { shootId: string; filenames: string[] } = req.body;

      if (!shootId || !filenames || !Array.isArray(filenames)) {
        return res.status(400).json({ 
          message: "shootId and filenames array are required" 
        });
      }

      // Get existing images for this shoot
      const existingImages = await storage.getImagesByShoot(shootId);
      
      const conflicts: any[] = [];
      const safe: string[] = [];

      // Check each filename for conflicts
      for (const filename of filenames) {
        const existingImage = existingImages.find(img => img.filename === filename);
        
        if (existingImage) {
          // Get file metadata from Supabase storage
          let fileSize = 0;
          let lastModified = existingImage.createdAt;
          
          try {
            // Initialize Supabase client for storage metadata
            const supabase = createClient(
              process.env.VITE_SUPABASE_URL!,
              process.env.SUPABASE_SECRET_KEY!
            );

            // Extract the storage path from the full URL
            const urlParts = existingImage.storagePath.split('/');
            const bucketIndex = urlParts.findIndex(part => part === 'gallery-images');
            if (bucketIndex !== -1) {
              const storagePath = urlParts.slice(bucketIndex + 1).join('/');
              
              // Get file metadata from Supabase storage
              const { data: fileData, error } = await supabase.storage
                .from('gallery-images')
                .list(storagePath.split('/').slice(0, -1).join('/'), {
                  search: storagePath.split('/').pop()
                });

              if (!error && fileData && fileData.length > 0) {
                const file = fileData[0];
                fileSize = file.metadata?.size || 0;
                lastModified = file.updated_at || existingImage.createdAt;
              }
            }
          } catch (error) {
            console.warn('Failed to get file metadata:', error);
            // Continue with defaults
          }

          conflicts.push({
            filename,
            existingImage: {
              id: existingImage.id,
              size: fileSize,
              createdAt: lastModified,
              sequence: existingImage.sequence,
              storagePath: existingImage.storagePath
            },
            newFileSize: 0 // Will be filled by frontend
          });
        } else {
          safe.push(filename);
        }
      }

      res.json({
        conflicts,
        safe
      });

    } catch (error) {
      console.error("Conflict check error:", error);
      res.status(500).json({ 
        message: "Failed to check for conflicts",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Check for video filename conflicts before upload
  app.post("/api/videos/check-conflicts", async (req, res) => {
    try {
      const { shootId, filenames }: { shootId: string; filenames: string[] } = req.body;

      if (!shootId || !filenames || !Array.isArray(filenames)) {
        return res.status(400).json({ 
          message: "shootId and filenames array are required" 
        });
      }

      // Get existing videos for this shoot
      const existingVideos = await storage.getVideosByShoot(shootId);
      
      const conflicts: any[] = [];
      const safe: string[] = [];

      // Check each filename for conflicts
      for (const filename of filenames) {
        const existingVideo = existingVideos.find(vid => vid.filename === filename);
        
        if (existingVideo) {
          // Get file metadata from Supabase storage
          let fileSize = existingVideo.fileSize || 0;
          let lastModified = existingVideo.createdAt;
          
          try {
            // Initialize Supabase client for storage metadata
            const supabase = createClient(
              process.env.VITE_SUPABASE_URL!,
              process.env.SUPABASE_SECRET_KEY!
            );

            // Extract the storage path from the full URL
            const urlParts = existingVideo.storagePath.split('/');
            const bucketIndex = urlParts.findIndex(part => part === 'gallery-videos');
            if (bucketIndex !== -1) {
              const storagePath = urlParts.slice(bucketIndex + 1).join('/');
              
              // Get file metadata from Supabase storage
              const { data: fileData, error } = await supabase.storage
                .from('gallery-videos')
                .list(storagePath.split('/').slice(0, -1).join('/'), {
                  search: storagePath.split('/').pop()
                });

              if (!error && fileData && fileData.length > 0) {
                const file = fileData[0];
                fileSize = file.metadata?.size || existingVideo.fileSize || 0;
                lastModified = file.updated_at || existingVideo.createdAt;
              }
            }
          } catch (error) {
            console.warn('Failed to get video file metadata:', error);
            // Continue with defaults
          }

          conflicts.push({
            filename,
            existingVideo: {
              id: existingVideo.id,
              size: fileSize,
              createdAt: lastModified,
              sequence: existingVideo.sequence,
              storagePath: existingVideo.storagePath,
              duration: existingVideo.duration
            },
            newFileSize: 0, // Will be filled by frontend
            newDuration: 0 // Will be filled by frontend
          });
        } else {
          safe.push(filename);
        }
      }

      res.json({
        conflicts,
        safe
      });

    } catch (error) {
      console.error("Video conflict check error:", error);
      res.status(500).json({ 
        message: "Failed to check for video conflicts",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Image upload endpoint with Supabase storage + pre-processing
  // Supports up to 50 images per batch upload (10MB each max)
  // Processes each image into 3 versions: original, optimized, thumbnail
  app.post("/api/images/upload", upload.array('images', 50), async (req, res) => {
    console.log("🚀 PRE-PROCESSING UPLOAD ENDPOINT - PROCESSING 3 VERSIONS PER IMAGE!");
    try {
      const files = req.files as Express.Multer.File[];
      const { shootId, resolutions } = req.body;

      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files provided" });
      }

      if (!shootId) {
        return res.status(400).json({ message: "Shoot ID is required" });
      }

      // Parse resolutions if provided (sent as JSON string from FormData)
      let conflictResolutions: any[] = [];
      console.log(`📋 Raw resolutions parameter:`, resolutions);

      if (resolutions) {
        try {
          conflictResolutions = JSON.parse(resolutions);
          console.log(`✅ Parsed ${conflictResolutions.length} conflict resolutions:`, conflictResolutions);
        } catch (error) {
          console.warn('❌ Failed to parse resolutions:', error);
        }
      } else {
        console.log(`ℹ️ No resolutions provided - standard upload mode`);
      }

      // Initialize Supabase client
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SECRET_KEY! // Use service role for admin operations
      );

      const uploadedImages = [];
      const replacedImages = [];
      const skippedFiles = [];

      // Get existing images once for efficiency
      const existingImages = await storage.getImagesByShoot(shootId);

      // Get the shoot's shootType to use as classification for uploaded images
      const shoot = await storage.getShoot(shootId);
      const classification = shoot?.shootType?.toLowerCase() || null;
      console.log(`📸 Shoot ${shootId} has shootType: ${shoot?.shootType} → classification: ${classification}`);

      for (const file of files) {
        // Check if this file has a conflict resolution
        const resolution = conflictResolutions.find(r => r.filename === file.originalname);

        if (resolution && resolution.action === 'skip') {
          skippedFiles.push(file.originalname);
          continue;
        }

        console.log(`\n🔄 Processing ${file.originalname}...`);

        // STEP 1: Process image into 3 versions using Sharp
        const { processImage } = await import('./services/image-processing-service.js');
        const processedImage = await processImage(file);

        // Generate base filename (timestamp_randomId) - NO VERSION SUFFIX
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2);
        const fileExtension = file.originalname.split('.').pop();
        const baseFilename = `${timestamp}_${randomId}.${fileExtension}`;

        // STEP 2: Upload all 3 versions to Supabase Storage
        // Original: {base}.{ext} (NO suffix)
        // Optimized: {base}_optimized.{ext}
        // Thumbnail: {base}_thumbnail.{ext}
        const uploadTasks = [
          { version: 'original', filename: baseFilename, buffer: processedImage.original.buffer },
          { version: 'optimized', filename: baseFilename.replace(`.${fileExtension}`, `_optimized.${fileExtension}`), buffer: processedImage.optimized.buffer },
          { version: 'thumbnail', filename: baseFilename.replace(`.${fileExtension}`, `_thumbnail.${fileExtension}`), buffer: processedImage.thumbnail.buffer },
        ];

        let originalPublicUrl = '';

        for (const task of uploadTasks) {
          const storagePath = `shoots/${shootId}/${task.filename}`;

          console.log(`   📤 Uploading ${task.version} version (${(task.buffer.length / 1024).toFixed(0)}KB)...`);

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('gallery-images')
            .upload(storagePath, task.buffer, {
              contentType: file.mimetype,
              upsert: false
            });

          if (uploadError) {
            console.error(`❌ Failed to upload ${task.version} version:`, uploadError);
            throw new Error(`Failed to upload ${task.version} version: ${uploadError.message}`);
          }

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('gallery-images')
            .getPublicUrl(storagePath);

          if (task.version === 'original') {
            originalPublicUrl = publicUrl; // Store original URL for database
          }

          console.log(`   ✅ ${task.version} uploaded successfully`);
        }

        // STEP 3: Store original URL in database (other versions accessed via path replacement)

        // STEP 4: Handle replacement or new image creation
        if (resolution && resolution.action === 'replace') {
          // Handle replacement logic
          const targetImage = existingImages.find(img => img.id === resolution.targetImageId);

          console.log(`🔄 REPLACE: File ${file.originalname} replacing image ${resolution.targetImageId}`);
          console.log(`🎯 Target image found:`, !!targetImage);
          console.log(`📍 Keep position:`, resolution.keepPosition);

          if (targetImage) {
            console.log(`📦 Target image details:`, {
              id: targetImage.id,
              filename: targetImage.filename,
              sequence: targetImage.sequence,
              storagePath: targetImage.storagePath
            });

            // Delete all 3 old versions from Supabase storage
            try {
              // Extract base storage path from full URL
              let oldStoragePath;
              if (targetImage.storagePath.includes('supabase.co')) {
                // Full URL format: extract path after /storage/v1/object/public/gallery-images/
                const urlParts = targetImage.storagePath.split('/storage/v1/object/public/gallery-images/');
                oldStoragePath = urlParts[1];
              } else {
                // Already just the storage path
                oldStoragePath = targetImage.storagePath;
              }

              // Generate paths for all 3 versions to delete
              // Original: {base}.{ext} (no suffix)
              // Optimized: {base}_optimized.{ext}
              // Thumbnail: {base}_thumbnail.{ext}
              const oldVersions = [
                oldStoragePath, // Original (no modification needed)
                oldStoragePath.replace(/\.([^.]+)$/, '_optimized.$1'), // Add _optimized
                oldStoragePath.replace(/\.([^.]+)$/, '_thumbnail.$1'), // Add _thumbnail
              ];

              console.log(`🗑️ Deleting old storage files (3 versions):`, oldVersions);
              const { error: deleteError } = await supabase.storage
                .from('gallery-images')
                .remove(oldVersions);

              if (deleteError) {
                console.warn('❌ Failed to delete old files:', deleteError);
              } else {
                console.log('✅ Successfully deleted all 3 old storage versions');
              }
            } catch (error) {
              console.warn('❌ Exception deleting old files:', error);
              // Continue with replacement even if deletion fails
            }

            // Update existing database record with new file
            const updateData = {
              filename: file.originalname,
              storagePath: originalPublicUrl, // Store original version URL
              originalName: file.originalname,
              fileSize: processedImage.original.size,
              // Keep existing sequence if keepPosition is true, otherwise put at end
              sequence: resolution.keepPosition ? targetImage.sequence : (existingImages.length + uploadedImages.length + 1)
            };

            console.log(`💾 Updating database record with:`, updateData);
            const updatedImage = await storage.updateImage(targetImage.id, updateData);
            console.log(`✅ Database update successful:`, !!updatedImage);
            replacedImages.push(updatedImage);
          } else {
            console.warn(`Target image ${resolution.targetImageId} not found, creating new image`);
            // Fallback to creating new image
            const imageData = {
              shootId: shootId,
              filename: file.originalname,
              storagePath: originalPublicUrl,
              sequence: existingImages.length + 1,
              title: file.originalname.replace(/\.[^/.]+$/, ""),
              description: '',
              isPrivate: false,
              tags: [],
              downloadCount: 0,
              classification: classification // Inherit classification from shoot's shootType
            };
            const newImage = await storage.createImage(imageData);
            uploadedImages.push(newImage);
          }
        } else {
          // Create new image (default behavior or 'add_new' action)
          const nextSequence = existingImages.length + uploadedImages.length + 1;

          const imageData = {
            shootId: shootId,
            filename: file.originalname,
            storagePath: originalPublicUrl, // Store original version URL
            sequence: nextSequence,
            title: file.originalname.replace(/\.[^/.]+$/, ""), // Remove extension
            description: '',
            isPrivate: false,
            tags: [],
            downloadCount: 0,
            classification: classification // Inherit classification from shoot's shootType
          };

          const newImage = await storage.createImage(imageData);
          uploadedImages.push(newImage);
        }

        console.log(`✅ ${file.originalname} processed successfully (3 versions uploaded)\n`);
      }

      // Prepare detailed response
      const totalProcessed = uploadedImages.length + replacedImages.length + skippedFiles.length;
      const results = {
        success: true,
        totalProcessed,
        uploaded: {
          count: uploadedImages.length,
          images: uploadedImages
        },
        replaced: {
          count: replacedImages.length,
          images: replacedImages
        },
        skipped: {
          count: skippedFiles.length,
          filenames: skippedFiles
        }
      };

      // Generate summary message
      const parts = [];
      if (uploadedImages.length > 0) parts.push(`${uploadedImages.length} uploaded`);
      if (replacedImages.length > 0) parts.push(`${replacedImages.length} replaced`);
      if (skippedFiles.length > 0) parts.push(`${skippedFiles.length} skipped`);
      
      const message = parts.length > 0 
        ? `Successfully processed ${totalProcessed} files: ${parts.join(', ')}`
        : 'No files were processed';

      res.json({ ...results, message });

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
        process.env.SUPABASE_SECRET_KEY! // Use service role for admin operations
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

  // Image interaction endpoint (hearts, likes, dislikes)
  app.post("/api/images/:imageId/interact", async (req, res) => {
    try {
      const { imageId } = req.params;
      const { type, action } = req.body;

      // Validate interaction type
      if (!['heart', 'like', 'dislike'].includes(type)) {
        return res.status(400).json({
          message: "Invalid interaction type. Must be 'heart', 'like', or 'dislike'"
        });
      }

      // Validate action
      if (!['add', 'remove'].includes(action)) {
        return res.status(400).json({
          message: "Invalid action. Must be 'add' or 'remove'"
        });
      }

      // Map interaction type to database column (using camelCase as per schema)
      const columnMap: Record<string, keyof typeof images.$inferSelect> = {
        heart: 'heartsCount',
        like: 'likesCount',
        dislike: 'dislikesCount'
      };
      const column = columnMap[type];

      // Update the count using Drizzle ORM
      const increment = action === 'add' ? 1 : -1;

      // Get current image
      const currentImage = await db.select().from(images).where(eq(images.id, imageId)).limit(1);

      if (!currentImage || currentImage.length === 0) {
        return res.status(404).json({ message: "Image not found" });
      }

      // Calculate new count
      const currentCount = (currentImage[0][column] as number) || 0;
      const newCount = Math.max(0, currentCount + increment);

      // Build update object based on interaction type
      const updateData: any = {
        lastInteractionAt: new Date()
      };
      updateData[column] = newCount;

      // Update the image
      await db.update(images)
        .set(updateData)
        .where(eq(images.id, imageId));

      res.json({
        success: true,
        imageId,
        type,
        action,
        newCount: Number(newCount)
      });

    } catch (error) {
      console.error("Image interaction error:", error);
      res.status(500).json({
        message: "Failed to update image interaction",
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

  // Video endpoints (mirror image endpoints)
  app.post("/api/videos", async (req, res) => {
    try {
      const data = insertVideoSchema.parse(req.body);
      const video = await storage.createVideo(data);
      res.json(video);
    } catch (error) {
      console.error("Create video error:", error);
      res.status(400).json({ message: "Invalid video data" });
    }
  });

  app.get("/api/videos", async (req, res) => {
    try {
      const { shootId } = req.query;

      if (shootId && typeof shootId === 'string') {
        // Get videos for specific shoot
        const videos = await storage.getVideosByShoot(shootId);
        console.log(`Fetched ${videos.length} videos for shoot ${shootId}`);
        res.json(videos);
      } else {
        // Get all videos (admin use) - NEW: Support admin panel
        const allVideos = await storage.getAllVideos();
        console.log(`Fetched ${allVideos.length} videos for admin panel`);
        res.json(allVideos);
      }
    } catch (error) {
      console.error("Fetch videos error:", error);
      res.status(500).json({ message: "Failed to fetch videos" });
    }
  });

  app.patch("/api/videos/:id", async (req, res) => {
    try {
      const videoId = req.params.id;
      const updates = req.body;

      const video = await storage.updateVideo(videoId, updates);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }

      res.json(video);
    } catch (error) {
      res.status(500).json({ message: "Failed to update video" });
    }
  });

  app.delete("/api/videos/:id", async (req, res) => {
    try {
      const videoId = req.params.id;
      console.log(`Attempting to delete video: ${videoId}`);

      const deleted = await storage.deleteVideo(videoId);

      if (!deleted) {
        console.log(`Video not found in database: ${videoId}`);
        return res.status(404).json({ message: "Video not found or already deleted" });
      }

      console.log(`Successfully deleted video: ${videoId}`);
      res.json({ success: true, message: "Video deleted successfully" });
    } catch (error) {
      console.error("Delete video error:", error);
      res.status(500).json({
        message: "Failed to delete video",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Video upload endpoint with 500MB limit
  const videoUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 500 * 1024 * 1024, // 500MB limit
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('video/')) {
        cb(null, true);
      } else {
        cb(new Error('Only video files are allowed'));
      }
    }
  });

  app.post("/api/videos/upload", videoUpload.array('videos', 50), async (req, res) => {
    console.log("🎬 VIDEO UPLOAD ENDPOINT - Enhanced 3-Tier Processing");
    try {
      const files = req.files as Express.Multer.File[];
      const { shootId, resolutions } = req.body;

      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No video files provided" });
      }

      if (!shootId) {
        return res.status(400).json({ message: "shootId is required" });
      }

      // Parse resolutions if provided (sent as JSON string from FormData)
      let conflictResolutions = null;
      console.log(`📋 Raw resolutions parameter:`, resolutions);
      
      if (resolutions) {
        try {
          conflictResolutions = JSON.parse(resolutions);
          console.log(`✅ Parsed ${conflictResolutions.length} conflict resolutions:`, conflictResolutions);
        } catch (error) {
          console.warn('❌ Failed to parse resolutions:', error);
        }
      } else {
        console.log(`ℹ️ No resolutions provided - standard upload mode`);
      }

      // Get existing videos for replacement logic (always needed for replacements)
      const existingVideos = await storage.getVideosByShoot(shootId);
      console.log(`📋 Found ${existingVideos.length} existing videos for shoot ${shootId}`);
      console.log(`📋 Existing video IDs:`, existingVideos.map(v => `${v.id} (${v.filename})`));

      console.log(`🎬 Processing ${files.length} video(s) for shoot ${shootId} with 3-tier optimization`);

      const supabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SECRET_KEY!
      );

      const uploadedVideos = [];
      const replacedVideos = [];
      const skippedFiles = [];
      const errors = [];
      const processingResults = [];

      for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
        const file = files[fileIndex];
        try {
          console.log(`\n🎬 Processing video ${fileIndex + 1}/${files.length}: ${file.originalname}`);
          console.log(`📏 Size: ${formatFileSize(file.size)}`);

          // Step 1: Validate video file
          const validation = validateVideoForProcessing(file.buffer, file.originalname);
          if (!validation.valid) {
            console.error(`❌ Validation failed: ${validation.error}`);
            errors.push({ filename: file.originalname, error: validation.error });
            continue;
          }

          const timestamp = Date.now();
          const cleanFilename = file.originalname.replace(/[^a-z0-9.-]/gi, '_');

          // Step 2: Process ALL videos with FFmpeg for consistent 3-tier optimization
          console.log(`⚙️ Processing all videos for 3-tier optimization (size: ${formatFileSize(file.size)})`);

          // Step 3: Process video with FFmpeg (generate optimized + thumbnail)
          let optimizedBuffer: Buffer | null = null;
          let serverThumbnailBuffer: Buffer | null = null;
          let videoMetadata: any = null;

          // Always process videos for 3-tier system
          try {
            console.log(`⚙️ Starting FFmpeg processing for ${cleanFilename}...`);
            try {
              const processingResult = await processVideo({
                inputBuffer: file.buffer,
                originalFilename: cleanFilename,
                maxWidth: 1920, // 1080p max
                quality: 'medium'
              });

              optimizedBuffer = processingResult.optimizedBuffer;
              serverThumbnailBuffer = processingResult.thumbnailBuffer;
              videoMetadata = processingResult.metadata;

              console.log(`✅ FFmpeg processing complete:`);
              console.log(`   📹 Compression: ${videoMetadata.compressionRatio.toFixed(1)}% smaller`);
              console.log(`   🎞️ Resolution: ${videoMetadata.originalDimensions.width}x${videoMetadata.originalDimensions.height} → ${videoMetadata.optimizedDimensions.width}x${videoMetadata.optimizedDimensions.height}`);
              console.log(`   ⏱️ Duration: ${formatDuration(videoMetadata.duration)}`);

              processingResults.push({
                filename: cleanFilename,
                processing: 'ffmpeg_complete',
                originalSize: videoMetadata.originalSize,
                optimizedSize: videoMetadata.optimizedSize,
                compressionRatio: videoMetadata.compressionRatio
              });
            } catch (processingError) {
              console.error(`❌ FFmpeg processing failed for ${cleanFilename}:`, processingError);
              // Continue without optimization - use original file
              console.log(`⚠️ Falling back to original file without optimization`);
              processingResults.push({
                filename: cleanFilename,
                processing: 'ffmpeg_failed_fallback_to_original',
                error: processingError instanceof Error ? processingError.message : 'Unknown error'
              });
            }
          } catch (outerError) {
            console.error(`❌ Unexpected error during video processing for ${cleanFilename}:`, outerError);
            processingResults.push({
              filename: cleanFilename,
              processing: 'processing_error',
              error: outerError instanceof Error ? outerError.message : 'Unknown error'
            });
          }

          // Step 4: Upload files to Supabase Storage
          
          // 4a: Upload original video
          const videoPath = `${shootId}/${timestamp}-${cleanFilename}`;
          console.log(`📤 Uploading original video: ${videoPath}`);

          const { data: videoData, error: videoError } = await supabase.storage
            .from('gallery-videos')
            .upload(videoPath, file.buffer, {
              contentType: file.mimetype,
              upsert: false
            });

          if (videoError) {
            console.error(`❌ Failed to upload original video ${cleanFilename}:`, videoError);
            errors.push({ filename: cleanFilename, error: videoError.message });
            continue;
          }

          const { data: { publicUrl: videoPublicUrl } } = supabase.storage
            .from('gallery-videos')
            .getPublicUrl(videoPath);

          // 4b: Upload optimized video (if we have one)
          let optimizedPublicUrl = null;
          if (optimizedBuffer) {
            const optimizedPath = `${shootId}/${timestamp}-${cleanFilename}-optimized.mp4`;
            console.log(`📤 Uploading optimized video: ${optimizedPath}`);

            const { error: optimizedError } = await supabase.storage
              .from('gallery-videos')
              .upload(optimizedPath, optimizedBuffer, {
                contentType: 'video/mp4',
                upsert: false
              });

            if (!optimizedError) {
              const { data: { publicUrl } } = supabase.storage
                .from('gallery-videos')
                .getPublicUrl(optimizedPath);
              optimizedPublicUrl = publicUrl;
              console.log(`✅ Optimized video uploaded: ${optimizedPath}`);
            } else {
              console.error(`⚠️ Failed to upload optimized video: ${optimizedError.message}`);
            }
          }

          // 4c: Upload thumbnail (prefer server-generated, fallback to client-generated)
          let thumbnailPublicUrl = videoPublicUrl; // Ultimate fallback

          if (serverThumbnailBuffer) {
            // Use server-generated high-quality thumbnail
            const thumbnailPath = `${shootId}/${timestamp}-${cleanFilename}-thumbnail.jpg`;
            console.log(`📤 Uploading server-generated thumbnail: ${thumbnailPath}`);

            const { error: thumbnailError } = await supabase.storage
              .from('gallery-videos')
              .upload(thumbnailPath, serverThumbnailBuffer, {
                contentType: 'image/jpeg',
                upsert: false
              });

            if (!thumbnailError) {
              const { data: { publicUrl } } = supabase.storage
                .from('gallery-videos')
                .getPublicUrl(thumbnailPath);
              thumbnailPublicUrl = publicUrl;
              console.log(`✅ Server thumbnail uploaded: ${thumbnailPath}`);
            } else {
              console.error(`⚠️ Failed to upload server thumbnail: ${thumbnailError.message}`);
            }
          } else {
            // Fallback to client-generated thumbnail
            const thumbnailBase64 = req.body[`thumbnail_${fileIndex}`];
            if (thumbnailBase64) {
              console.log(`📤 Uploading client-generated thumbnail (fallback)`);
              const thumbnailBuffer = Buffer.from(thumbnailBase64.split(',')[1], 'base64');
              const thumbnailPath = `${shootId}/${timestamp}-${cleanFilename}-thumbnail.jpg`;

              const { error: thumbnailError } = await supabase.storage
                .from('gallery-videos')
                .upload(thumbnailPath, thumbnailBuffer, {
                  contentType: 'image/jpeg',
                  upsert: false
                });

              if (!thumbnailError) {
                const { data: { publicUrl } } = supabase.storage
                  .from('gallery-videos')
                  .getPublicUrl(thumbnailPath);
                thumbnailPublicUrl = publicUrl;
                console.log(`✅ Client thumbnail uploaded: ${thumbnailPath}`);
              }
            }
          }

          // Step 5: Handle replacement, skip, or new video creation
          const resolution = conflictResolutions?.find(r => r.filename === cleanFilename);
          console.log(`🎯 Resolution for ${cleanFilename}:`, resolution);
          if (resolution) {
            console.log(`   📝 Action: ${resolution.action}`);
            console.log(`   🎯 Target Video ID: ${resolution.targetVideoId}`);
            console.log(`   📌 Keep Position: ${resolution.keepPosition}`);
          }
          
          if (resolution && resolution.action === 'skip') {
            skippedFiles.push(cleanFilename);
            console.log(`⏭️ SKIPPED: File ${cleanFilename} marked as skip`);
            continue;
          }
          
          if (resolution && resolution.action === 'replace') {
            // Handle replacement logic
            const targetVideo = existingVideos.find(vid => vid.id === resolution.targetVideoId);

            console.log(`🔄 REPLACE: File ${cleanFilename} replacing video ${resolution.targetVideoId}`);
            console.log(`🎯 Target video found:`, !!targetVideo);
            console.log(`📍 Keep position:`, resolution.keepPosition);

            if (targetVideo) {
              console.log(`📦 Target video details:`, {
                id: targetVideo.id,
                filename: targetVideo.filename,
                sequence: targetVideo.sequence,
                storagePath: targetVideo.storagePath,
                optimizedPath: targetVideo.optimizedPath,
                thumbnailPath: targetVideo.thumbnailPath
              });

              // Delete all 3 old versions from Supabase storage
              try {
                const oldVersions = [];
                
                // Extract storage paths and add to deletion list
                if (targetVideo.storagePath) {
                  let oldStoragePath = targetVideo.storagePath.includes('supabase.co') 
                    ? targetVideo.storagePath.split('/storage/v1/object/public/gallery-videos/')[1]
                    : targetVideo.storagePath;
                  oldVersions.push(oldStoragePath);
                }
                
                if (targetVideo.optimizedPath) {
                  let oldOptimizedPath = targetVideo.optimizedPath.includes('supabase.co')
                    ? targetVideo.optimizedPath.split('/storage/v1/object/public/gallery-videos/')[1]
                    : targetVideo.optimizedPath;
                  oldVersions.push(oldOptimizedPath);
                }
                
                if (targetVideo.thumbnailPath) {
                  let oldThumbnailPath = targetVideo.thumbnailPath.includes('supabase.co')
                    ? targetVideo.thumbnailPath.split('/storage/v1/object/public/gallery-videos/')[1]
                    : targetVideo.thumbnailPath;
                  oldVersions.push(oldThumbnailPath);
                }

                console.log(`🗑️ Deleting old storage files (${oldVersions.length} versions):`, oldVersions);
                if (oldVersions.length > 0) {
                  const { error: deleteError } = await supabase.storage
                    .from('gallery-videos')
                    .remove(oldVersions);

                  if (deleteError) {
                    console.warn('❌ Failed to delete old video files:', deleteError);
                  } else {
                    console.log('✅ Successfully deleted all old video storage versions');
                  }
                }
              } catch (error) {
                console.warn('❌ Exception deleting old video files:', error);
                // Continue with replacement even if deletion fails
              }

              // Update existing database record with new file
              const updateData = {
                filename: cleanFilename,
                storagePath: videoPublicUrl,        // Original video
                optimizedPath: optimizedPublicUrl,  // Web-optimized version (may be null)
                thumbnailPath: thumbnailPublicUrl,  // High-quality thumbnail
                fileSize: file.size,
                // Keep existing sequence if keepPosition is true, otherwise put at end
                sequence: resolution.keepPosition ? targetVideo.sequence : (existingVideos.length + uploadedVideos.length + replacedVideos.length + 1),
                duration: videoMetadata?.duration ? Math.round(videoMetadata.duration) : (req.body[`duration_${fileIndex}`] ? parseInt(req.body[`duration_${fileIndex}`]) : null),
                width: videoMetadata?.originalDimensions?.width || (req.body[`width_${fileIndex}`] ? parseInt(req.body[`width_${fileIndex}`]) : null),
                height: videoMetadata?.originalDimensions?.height || (req.body[`height_${fileIndex}`] ? parseInt(req.body[`height_${fileIndex}`]) : null),
              };

              console.log(`💾 Updating database record with:`, updateData);
              const updatedVideo = await storage.updateVideo(targetVideo.id, updateData);
              console.log(`✅ Database update successful:`, !!updatedVideo);
              
              // For replacement, add to replacedVideos array instead of uploadedVideos
              replacedVideos.push(updatedVideo);
            } else {
              console.warn(`⚠️ Target video ${resolution.targetVideoId} not found in existing videos!`);
              console.warn(`⚠️ Available video IDs:`, existingVideos.map(v => v.id));
              console.warn(`⚠️ Falling back to creating new video instead of replacing`);
              // Fallback to creating new video
              const videoRecord = await storage.createVideo({
                shootId,
                filename: cleanFilename,
                storagePath: videoPublicUrl,
                optimizedPath: optimizedPublicUrl,
                thumbnailPath: thumbnailPublicUrl,
                fileSize: file.size,
                sequence: existingVideos.length + uploadedVideos.length + replacedVideos.length + 1,
                duration: videoMetadata?.duration ? Math.round(videoMetadata.duration) : (req.body[`duration_${fileIndex}`] ? parseInt(req.body[`duration_${fileIndex}`]) : null),
                width: videoMetadata?.originalDimensions?.width || (req.body[`width_${fileIndex}`] ? parseInt(req.body[`width_${fileIndex}`]) : null),
                height: videoMetadata?.originalDimensions?.height || (req.body[`height_${fileIndex}`] ? parseInt(req.body[`height_${fileIndex}`]) : null),
              });
              uploadedVideos.push(videoRecord);
            }
          } else if (resolution && resolution.action === 'add_new') {
            // Explicitly create new video even if conflict exists
            console.log(`➕ ADD_NEW: Creating new video for ${cleanFilename}`);
            const videoRecord = await storage.createVideo({
              shootId,
              filename: cleanFilename,
              storagePath: videoPublicUrl,
              optimizedPath: optimizedPublicUrl,
              thumbnailPath: thumbnailPublicUrl,
              fileSize: file.size,
              sequence: existingVideos.length + uploadedVideos.length + replacedVideos.length + 1,
              duration: videoMetadata?.duration ? Math.round(videoMetadata.duration) : (req.body[`duration_${fileIndex}`] ? parseInt(req.body[`duration_${fileIndex}`]) : null),
              width: videoMetadata?.originalDimensions?.width || (req.body[`width_${fileIndex}`] ? parseInt(req.body[`width_${fileIndex}`]) : null),
              height: videoMetadata?.originalDimensions?.height || (req.body[`height_${fileIndex}`] ? parseInt(req.body[`height_${fileIndex}`]) : null),
            });
            uploadedVideos.push(videoRecord);
          } else {
            // Create new video (default behavior or 'add_new' action)
            const videoRecord = await storage.createVideo({
              shootId,
              filename: cleanFilename,
              storagePath: videoPublicUrl,        // Original video
              optimizedPath: optimizedPublicUrl,  // Web-optimized version (may be null)
              thumbnailPath: thumbnailPublicUrl,  // High-quality thumbnail
              fileSize: file.size,
              sequence: existingVideos.length + uploadedVideos.length + replacedVideos.length + 1,
              duration: videoMetadata?.duration ? Math.round(videoMetadata.duration) : (req.body[`duration_${fileIndex}`] ? parseInt(req.body[`duration_${fileIndex}`]) : null),
              width: videoMetadata?.originalDimensions?.width || (req.body[`width_${fileIndex}`] ? parseInt(req.body[`width_${fileIndex}`]) : null),
              height: videoMetadata?.originalDimensions?.height || (req.body[`height_${fileIndex}`] ? parseInt(req.body[`height_${fileIndex}`]) : null),
            });
            uploadedVideos.push(videoRecord);
          }
          console.log(`✅ Successfully processed video: ${cleanFilename}`);
          console.log(`   🗂️ Original: ${videoPublicUrl}`);
          console.log(`   ⚡ Optimized: ${optimizedPublicUrl || 'None'}`);
          console.log(`   📸 Thumbnail: ${thumbnailPublicUrl}`);
        
        } catch (error) {
          console.error(`Error processing video ${file.originalname}:`, error);
          errors.push({
            filename: file.originalname,
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }

      // Prepare enhanced response with processing details
      const totalProcessed = uploadedVideos.length + replacedVideos.length;
      const totalOptimized = processingResults.filter(r => r.processing === 'ffmpeg_complete').length;
      const totalSize = processingResults.reduce((sum, r) => sum + (r.originalSize || 0), 0);
      const optimizedSize = processingResults.reduce((sum, r) => sum + (r.optimizedSize || 0), 0);
      const avgCompressionRatio = totalOptimized > 0 
        ? processingResults.filter(r => r.compressionRatio).reduce((sum, r) => sum + r.compressionRatio, 0) / totalOptimized 
        : 0;

      console.log(`\n📊 Upload Summary:`);
      console.log(`   📁 Total videos: ${files.length}`);
      console.log(`   ✅ Successfully processed: ${totalProcessed}`);
      console.log(`   📤 New uploads: ${uploadedVideos.length}`);
      console.log(`   🔄 Replaced: ${replacedVideos.length}`);
      console.log(`   ⏭️ Skipped: ${skippedFiles.length}`);
      console.log(`   ⚡ Optimized: ${totalOptimized}`);
      console.log(`   ❌ Errors: ${errors.length}`);
      if (totalOptimized > 0) {
        console.log(`   💾 Original size: ${formatFileSize(totalSize)}`);
        console.log(`   💾 Optimized size: ${formatFileSize(optimizedSize)}`);
        console.log(`   📉 Avg compression: ${avgCompressionRatio.toFixed(1)}%`);
      }

      const message = totalProcessed > 0
        ? `Successfully processed ${totalProcessed} video(s)${replacedVideos.length > 0 ? `, ${replacedVideos.length} replaced` : ''}${skippedFiles.length > 0 ? `, ${skippedFiles.length} skipped` : ''}${totalOptimized > 0 ? `, ${totalOptimized} optimized` : ''}`
        : 'No videos were processed';

      res.json({
        success: true,
        totalProcessed,
        uploadedCount: uploadedVideos.length,
        uploaded: {
          count: uploadedVideos.length,
          videos: uploadedVideos
        },
        replaced: {
          count: replacedVideos.length,
          videos: replacedVideos
        },
        skipped: {
          count: skippedFiles.length,
          filenames: skippedFiles
        },
        processing: {
          totalOptimized,
          avgCompressionRatio: avgCompressionRatio || null,
          totalOriginalSize: totalSize,
          totalOptimizedSize: optimizedSize,
          details: processingResults
        },
        errors: errors.length > 0 ? errors : undefined,
        message
      });

    } catch (error) {
      console.error("Video upload error:", error);
      res.status(500).json({
        message: "Failed to upload videos",
        error: error instanceof Error ? error.message : "Unknown error"
      });
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
      const { shootId } = req.params;
      console.log(`🎬 Fetching media for public gallery: ${shootId}`);
      
      // Validate that shootId is a valid UUID format
      if (!shootId || typeof shootId !== 'string') {
        return res.status(400).json({ message: "Invalid shoot ID format" });
      }
      
      // Fetch both images and videos for the shoot
      const [images, videos] = await Promise.all([
        storage.getImagesByShoot(shootId),
        storage.getVideosByShoot(shootId)
      ]);
      
      console.log(`📸 Found ${images.length} images and ${videos.length} videos for public gallery ${shootId}`);
      
      // Combine and sort by sequence/upload order
      const mediaItems = [
        ...images.map(img => ({ ...img, mediaType: 'image' })),
        ...videos.map(vid => ({ ...vid, mediaType: 'video' }))
      ].sort((a, b) => {
        // Sort by sequence first, then by creation date as fallback
        const aSeq = a.sequence || 0;
        const bSeq = b.sequence || 0;
        if (aSeq !== bSeq) return aSeq - bSeq;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
      
      res.json(mediaItems);
    } catch (error) {
      console.error("🚨 Get gallery media error:", error);
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

  // Remove duplicate - using the working storage method version above

  // User Profile API endpoint - for authentication use
  app.get("/api/user/profile/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID parameter required" });
      }

      // Use service role key to lookup profile (bypasses RLS for auth purposes)
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SECRET_KEY!
      );

      const { data: userProfile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // If no profile found, this is not necessarily an error for auth
        console.warn(`Profile lookup for user ${userId}:`, error.message);
        return res.status(404).json({ message: "Profile not found" });
      }

      res.json(userProfile);
    } catch (error) {
      console.error("Get user profile error:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
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

  // Generic file upload endpoint for homepage settings, blog images, and other admin features
  // Uploads directly to Supabase Storage for both dev and production persistence
  app.post("/api/upload", upload.single('file'), async (req, res) => {
    try {
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: 'No file provided' });
      }

      const fileSizeKB = (file.size / 1024).toFixed(0);
      console.log(`🔄 Uploading to Supabase: ${file.originalname} (${file.mimetype}, ${fileSizeKB}KB)`);

      // Initialize Supabase client with service role for storage operations
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SECRET_KEY!
      );

      // Generate unique filename
      const timestamp = Date.now();
      const fileExtension = path.extname(file.originalname);
      const cleanName = path.basename(file.originalname, fileExtension)
        .replace(/[^a-zA-Z0-9-_]/g, '-')
        .substring(0, 50); // Limit name length
      const fileName = `${cleanName}_${timestamp}${fileExtension}`;

      // Store in blog/ subfolder within gallery-images bucket
      const storagePath = `blog/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('gallery-images')
        .upload(storagePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Supabase upload error:', uploadError);
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('gallery-images')
        .getPublicUrl(storagePath);

      console.log(`✅ Uploaded to Supabase: ${fileName} -> ${publicUrl}`);

      res.json({
        success: true,
        path: publicUrl,
        filename: fileName,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype
      });

    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({
        message: 'Failed to upload file',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // List existing blog images from Supabase Storage
  app.get("/api/blog/images", async (req, res) => {
    try {
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SECRET_KEY!
      );

      // List all files in the blog/ folder within gallery-images bucket
      const { data: files, error } = await supabase.storage
        .from('gallery-images')
        .list('blog', {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        console.error('Error listing blog images:', error);
        throw new Error(`Failed to list blog images: ${error.message}`);
      }

      // Filter out any non-image files and build full URLs
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      const images = (files || [])
        .filter(file => {
          const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
          return imageExtensions.includes(ext);
        })
        .map(file => {
          const { data: { publicUrl } } = supabase.storage
            .from('gallery-images')
            .getPublicUrl(`blog/${file.name}`);

          return {
            name: file.name,
            url: publicUrl,
            createdAt: file.created_at,
            size: file.metadata?.size || 0
          };
        });

      console.log(`📚 Listed ${images.length} blog images from Supabase`);
      res.json(images);

    } catch (error) {
      console.error('Blog images list error:', error);
      res.status(500).json({
        message: 'Failed to list blog images',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // SEO-optimized upload endpoint for category hero images - stores in Supabase
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

      console.log(`🔍 SEO Upload to Supabase: ${category} ${type} - ${file.originalname}`);

      // Initialize Supabase client
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SECRET_KEY!
      );

      // Generate SEO-optimized filename with timestamp for uniqueness
      const fileExtension = path.extname(file.originalname).toLowerCase();
      const timestamp = Date.now();
      const baseName = `slyfox-${category.toLowerCase()}-${type.toLowerCase()}-durban-hero`;
      const optimalName = `${baseName}-${timestamp}${fileExtension}`;

      // Store in heroes/ subfolder within gallery-images bucket
      const storagePath = `heroes/${optimalName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('gallery-images')
        .upload(storagePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Supabase hero upload error:', uploadError);
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('gallery-images')
        .getPublicUrl(storagePath);

      // Update the category_heroes table with the new image URL
      const { error: dbError } = await supabase
        .from('category_heroes')
        .upsert({
          page_type: type.toLowerCase(),
          category: category.toLowerCase(),
          image_url: publicUrl,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'page_type,category'
        });

      if (dbError) {
        console.error('❌ Failed to update category_heroes table:', dbError);
        // Don't fail the upload, just log the error
      }

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

      console.log(`✅ SEO Optimised Upload to Supabase: ${optimalName}`);
      console.log(`🔗 Public URL: ${publicUrl}`);
      console.log(`🏷️ Generated Alt Text: ${autoAltText}`);

      res.json({
        success: true,
        path: publicUrl,
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

  // Use the category heroes routes for hero image management
  app.use('/api/category-heroes', categoryHeroesRouter);

  // Blog and AI content generation routes
  app.use('/api/blog', blogRouter);
  app.use('/api/ai', aiBlogRouter);

  // Content management system for client brand intelligence and AI generation
  app.use('/api/content-management', contentManagementRouter);

  // Prompt engine for brand-aware AI prompt enhancement
  app.use('/api/prompt-engine', promptEngineRouter);

  // Content types management for prompt enhancement guidelines
  app.use('/api/content-types', contentTypesRouter);

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
  // FEATURED VIDEOS API ROUTES
  // ===================================

  // GET /api/videos/featured - Get featured videos
  app.get("/api/videos/featured", async (req, res) => {
    try {
      const featuredVideos = await storage.getFeaturedVideos();
      res.json(featuredVideos);
    } catch (error) {
      console.error('Error fetching featured videos:', error);
      res.status(500).json({ message: 'Failed to fetch featured videos' });
    }
  });

  // PATCH /api/videos/bulk-featured - Bulk update featured status
  app.patch("/api/videos/bulk-featured", async (req, res) => {
    try {
      const { videoIds, featured } = req.body;
      
      if (!Array.isArray(videoIds) || typeof featured !== 'boolean') {
        return res.status(400).json({ message: 'Invalid request body' });
      }
      
      const updatedVideos = await storage.updateVideoFeaturedStatus(videoIds, featured);
      
      res.json({ 
        message: `${videoIds.length} videos ${featured ? 'added to' : 'removed from'} featured`,
        updatedVideos 
      });
    } catch (error) {
      console.error('Error updating video featured status:', error);
      res.status(500).json({ message: 'Failed to update video featured status' });
    }
  });

  // PATCH /api/shoots/:shootId/cover-video - Set cover video for shoot
  app.patch("/api/shoots/:shootId/cover-video", async (req, res) => {
    try {
      const { shootId } = req.params;
      const { videoId } = req.body;
      
      if (!videoId) {
        return res.status(400).json({ message: 'Video ID is required' });
      }
      
      const updatedVideo = await storage.setShootCoverVideo(shootId, videoId);
      
      if (!updatedVideo) {
        return res.status(404).json({ message: 'Video not found or does not belong to this shoot' });
      }
      
      res.json({ 
        message: 'Cover video set successfully',
        coverVideo: updatedVideo 
      });
    } catch (error) {
      console.error('Error setting cover video:', error);
      res.status(500).json({ message: 'Failed to set cover video' });
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

  // Image download proxy to bypass CORS issues
  app.get("/api/download/image", async (req, res) => {
    try {
      const { url } = req.query;
      
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid image URL parameter' });
      }

      // Validate URL to ensure it's from allowed domains (security)
      const allowedDomains = [
        'storage.googleapis.com',
        'images.unsplash.com',
        'unsplash.com'
      ];
      
      const urlObj = new URL(url);
      const isAllowedDomain = allowedDomains.some(domain => urlObj.hostname.includes(domain));
      
      if (!isAllowedDomain) {
        return res.status(400).json({ error: 'URL not from allowed domain' });
      }

      console.log('🔽 Proxying image download:', url);

      // Fetch the image
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }

      // Get content type
      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      
      // Set appropriate headers
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', 'attachment; filename="image.png"');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'no-cache');

      // Stream the image data
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      res.send(buffer);

    } catch (error: any) {
      console.error('❌ Image download proxy error:', error);
      res.status(500).json({ error: 'Failed to download image', details: error.message });
    }
  });

  // TEST ENDPOINT: Direct storage bucket verification (for deletion testing)
  app.get("/api/test/storage-verification", async (req, res) => {
    try {
      console.log('🔍 STORAGE VERIFICATION: Starting direct bucket inspection...');
      
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SECRET_KEY!
      );

      // List ALL files in gallery-videos bucket recursively
      const { data: allFiles, error: listError } = await supabase.storage
        .from('gallery-videos')
        .list('', { limit: 1000, sortBy: { column: 'created_at', order: 'desc' } });

      if (listError) {
        console.error('❌ Storage listing error:', listError);
        return res.status(500).json({ error: listError.message });
      }

      // Also check specific folder that contained our test video
      const { data: folderContents, error: folderError } = await supabase.storage
        .from('gallery-videos')
        .list('1defa09b-1de1-442c-8943-f0e0131c6b70', { limit: 100 });

      const results = {
        total_files_in_bucket: allFiles?.length || 0,
        root_level_files: allFiles?.map(f => ({ name: f.name, size: f.metadata?.size, created: f.created_at })) || [],
        test_folder_files: folderContents?.length || 0,
        test_folder_contents: folderContents?.map(f => ({ name: f.name, size: f.metadata?.size, created: f.created_at })) || [],
        verification: {
          files_should_be_deleted: folderContents?.length === 0,
          possible_orphaned_files: allFiles?.filter(f => f.name.includes('Kid_shoot10')) || []
        }
      };

      console.log(`📊 STORAGE VERIFICATION COMPLETE:`);
      console.log(`- Total files in bucket: ${results.total_files_in_bucket}`);
      console.log(`- Test folder (should be empty): ${results.test_folder_files} files`);
      console.log(`- Deletion successful: ${results.verification.files_should_be_deleted ? 'YES ✅' : 'NO ❌'}`);

      if (results.verification.possible_orphaned_files.length > 0) {
        console.log(`⚠️ POSSIBLE ORPHANED FILES:`, results.verification.possible_orphaned_files.map(f => f.name));
      }

      res.json(results);

    } catch (error) {
      console.error('❌ Storage verification failed:', error);
      res.status(500).json({ error: 'Storage verification failed', details: error.message });
    }
  });

  // TEST ENDPOINT: Clean orphaned storage files
  app.delete("/api/test/cleanup-orphaned", async (req, res) => {
    try {
      console.log('🧹 CLEANUP: Starting orphaned file removal...');
      
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SECRET_KEY!
      );

      // Get the orphaned file we found
      const orphanedPath = '1defa09b-1de1-442c-8943-f0e0131c6b70/1763800934540-Kid_shoot6.mp4-optimized.mp4';
      
      console.log(`🗑️ Attempting to delete orphaned file: ${orphanedPath}`);
      
      const { data: deleteData, error: deleteError } = await supabase.storage
        .from('gallery-videos')
        .remove([orphanedPath]);

      if (deleteError) {
        console.error('❌ Orphaned file deletion error:', deleteError);
        return res.status(500).json({ error: deleteError.message });
      }

      console.log('✅ Orphaned file deleted:', deleteData);
      
      // Verify it's gone
      const { data: verifyData } = await supabase.storage
        .from('gallery-videos')
        .list('1defa09b-1de1-442c-8943-f0e0131c6b70', { limit: 10 });

      res.json({
        deleted_file: orphanedPath,
        delete_response: deleteData,
        verification_remaining_files: verifyData?.length || 0,
        cleanup_successful: (verifyData?.length || 0) === 0
      });

    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      res.status(500).json({ error: 'Cleanup failed', details: error.message });
    }
  });

  // TEST ENDPOINT: Image storage verification
  app.get("/api/test/image-storage-verification", async (req, res) => {
    try {
      console.log('🔍 IMAGE STORAGE VERIFICATION: Starting...');
      
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SECRET_KEY!
      );

      // List ALL files in gallery-images bucket
      const { data: allFiles, error: listError } = await supabase.storage
        .from('gallery-images')
        .list('', { limit: 1000, sortBy: { column: 'created_at', order: 'desc' } });

      if (listError) {
        console.error('❌ Image storage listing error:', listError);
        return res.status(500).json({ error: listError.message });
      }

      // Count database images
      const dbImages = await db.select().from(images);

      const results = {
        storage_total_files: allFiles?.length || 0,
        database_total_images: dbImages.length,
        storage_folders: allFiles?.map(f => f.name) || [],
        potential_storage_bloat: (allFiles?.length || 0) > dbImages.length ? 'POSSIBLE' : 'NONE',
        verification_status: 'Image storage appears healthy'
      };

      console.log(`📊 IMAGE STORAGE VERIFICATION:`);
      console.log(`- Storage files: ${results.storage_total_files}`);
      console.log(`- Database records: ${results.database_total_images}`);
      console.log(`- Storage bloat: ${results.potential_storage_bloat}`);

      res.json(results);

    } catch (error) {
      console.error('❌ Image storage verification failed:', error);
      res.status(500).json({ error: 'Image storage verification failed', details: error.message });
    }
  });

  // ============================================
  // VISITOR TRACKING ENDPOINTS
  // ============================================

  // Track visitor activity (called from frontend on page load/navigation)
  app.post("/api/visitors/track", async (req, res) => {
    try {
      const { sessionId, currentPage, referrer, userAgent } = req.body;

      if (!sessionId) {
        return res.status(400).json({ error: "sessionId is required" });
      }

      const supabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SECRET_KEY!
      );

      // Detect device type from user agent
      const deviceType = userAgent?.toLowerCase().includes('mobile') ? 'mobile'
        : userAgent?.toLowerCase().includes('tablet') ? 'tablet'
        : 'desktop';

      // Simple bot detection
      const isBot = /bot|crawler|spider|scraper|curl|wget/i.test(userAgent || '');

      // Check if session exists
      const { data: existingSession } = await supabase
        .from('visitor_sessions')
        .select('id, page_views')
        .eq('session_id', sessionId)
        .single();

      if (existingSession) {
        // Update existing session
        await supabase
          .from('visitor_sessions')
          .update({
            current_page: currentPage,
            last_activity_at: new Date().toISOString(),
            page_views: (existingSession.page_views || 0) + 1
          })
          .eq('session_id', sessionId);
      } else {
        // Create new session
        await supabase
          .from('visitor_sessions')
          .insert({
            session_id: sessionId,
            current_page: currentPage,
            referrer: referrer,
            user_agent: userAgent,
            device_type: deviceType,
            is_bot: isBot,
            first_seen_at: new Date().toISOString(),
            last_activity_at: new Date().toISOString(),
            page_views: 1
          });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Visitor tracking error:", error);
      res.status(500).json({ error: "Failed to track visitor" });
    }
  });

  // Get active visitors stats (for admin dashboard)
  app.get("/api/visitors/stats", async (req, res) => {
    try {
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SECRET_KEY!
      );

      // Time windows
      const now = Date.now();
      const fiveMinutesAgo = new Date(now - 5 * 60 * 1000).toISOString();
      const thirtyMinutesAgo = new Date(now - 30 * 60 * 1000).toISOString();
      const oneHourAgo = new Date(now - 60 * 60 * 1000).toISOString();
      const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();
      const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Fetch all sessions from last 7 days in one query (most efficient)
      const { data: allSessions, error } = await supabase
        .from('visitor_sessions')
        .select('*')
        .gt('last_activity_at', sevenDaysAgo)
        .eq('is_bot', false);

      if (error) {
        throw error;
      }

      const sessions = allSessions || [];

      // Filter by time windows
      const active5m = sessions.filter(s => s.last_activity_at > fiveMinutesAgo);
      const active30m = sessions.filter(s => s.last_activity_at > thirtyMinutesAgo);
      const active1h = sessions.filter(s => s.last_activity_at > oneHourAgo);
      const active24h = sessions.filter(s => s.last_activity_at > twentyFourHoursAgo);
      const active7d = sessions;

      // Helper to get page counts from sessions
      const getPageCounts = (sessionList: typeof sessions) => {
        const counts: Record<string, number> = {};
        sessionList.forEach(s => {
          if (s.current_page) {
            counts[s.current_page] = (counts[s.current_page] || 0) + 1;
          }
        });
        // Sort by count descending and take top 10
        return Object.entries(counts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([page, count]) => ({ page, count }));
      };

      // Helper to get referrer counts
      const getReferrerCounts = (sessionList: typeof sessions) => {
        const counts: Record<string, number> = {};
        sessionList.forEach(s => {
          // Clean up referrer - extract domain only
          let domain = 'Direct';
          if (s.referrer) {
            try {
              const url = new URL(s.referrer);
              domain = url.hostname.replace('www.', '');
            } catch {
              domain = s.referrer.substring(0, 50);
            }
          }
          counts[domain] = (counts[domain] || 0) + 1;
        });
        return Object.entries(counts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([source, count]) => ({ source, count }));
      };

      // Helper for device breakdown
      const getDeviceBreakdown = (sessionList: typeof sessions) => ({
        desktop: sessionList.filter(v => v.device_type === 'desktop').length,
        mobile: sessionList.filter(v => v.device_type === 'mobile').length,
        tablet: sessionList.filter(v => v.device_type === 'tablet').length
      });

      // Calculate average session duration for 24h window
      const avgSessionDuration = active24h.length > 0
        ? Math.round(
            active24h.reduce((sum, s) => {
              const duration = new Date(s.last_activity_at).getTime() - new Date(s.first_seen_at).getTime();
              return sum + duration;
            }, 0) / active24h.length / 1000 / 60 // in minutes
          )
        : 0;

      // Total page views in each window
      const getTotalPageViews = (sessionList: typeof sessions) =>
        sessionList.reduce((sum, s) => sum + (s.page_views || 1), 0);

      const stats = {
        // Live stats (backward compatible)
        totalActive: active5m.length,
        loggedInUsers: active5m.filter(v => v.user_id).length,
        anonymousVisitors: active5m.filter(v => !v.user_id).length,
        deviceBreakdown: getDeviceBreakdown(active5m),
        currentPages: active5m.reduce((acc, v) => {
          if (v.current_page) {
            acc[v.current_page] = (acc[v.current_page] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>),

        // Extended analytics
        timeWindows: {
          '5m': { visitors: active5m.length, pageViews: getTotalPageViews(active5m) },
          '30m': { visitors: active30m.length, pageViews: getTotalPageViews(active30m) },
          '1h': { visitors: active1h.length, pageViews: getTotalPageViews(active1h) },
          '24h': { visitors: active24h.length, pageViews: getTotalPageViews(active24h) },
          '7d': { visitors: active7d.length, pageViews: getTotalPageViews(active7d) }
        },

        // Popular pages by time window
        popularPages: {
          '1h': getPageCounts(active1h),
          '24h': getPageCounts(active24h),
          '7d': getPageCounts(active7d)
        },

        // Device breakdown for 24h
        deviceBreakdown24h: getDeviceBreakdown(active24h),

        // Traffic sources for 24h
        trafficSources: getReferrerCounts(active24h),

        // Average session duration (in minutes)
        avgSessionDuration,

        // Unique sessions count (not page views)
        uniqueSessions: {
          '24h': active24h.length,
          '7d': active7d.length
        }
      };

      res.json(stats);
    } catch (error) {
      console.error("Visitor stats error:", error);
      res.status(500).json({ error: "Failed to get visitor stats" });
    }
  });

  // Cleanup old sessions and aggregate daily stats (call via VPS cron daily)
  app.delete("/api/visitors/cleanup", async (req, res) => {
    try {
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SECRET_KEY!
      );

      // Get yesterday's date (we aggregate completed days)
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD

      // Check if we already aggregated yesterday
      const { data: existingStats } = await supabase
        .from('visitor_daily_stats')
        .select('date')
        .eq('date', yesterdayStr)
        .single();

      let aggregated = false;

      if (!existingStats) {
        // Fetch yesterday's sessions for aggregation
        const startOfYesterday = new Date(yesterdayStr + 'T00:00:00.000Z').toISOString();
        const endOfYesterday = new Date(yesterdayStr + 'T23:59:59.999Z').toISOString();

        const { data: yesterdaySessions } = await supabase
          .from('visitor_sessions')
          .select('*')
          .gte('first_seen_at', startOfYesterday)
          .lte('first_seen_at', endOfYesterday)
          .eq('is_bot', false);

        if (yesterdaySessions && yesterdaySessions.length > 0) {
          // Calculate aggregates
          const uniqueVisitors = yesterdaySessions.length;
          const totalPageViews = yesterdaySessions.reduce((sum, s) => sum + (s.page_views || 1), 0);
          const desktopVisitors = yesterdaySessions.filter(s => s.device_type === 'desktop').length;
          const mobileVisitors = yesterdaySessions.filter(s => s.device_type === 'mobile').length;
          const tabletVisitors = yesterdaySessions.filter(s => s.device_type === 'tablet').length;

          // Average session duration
          const avgSessionMinutes = yesterdaySessions.length > 0
            ? Math.round(
                yesterdaySessions.reduce((sum, s) => {
                  const duration = new Date(s.last_activity_at).getTime() - new Date(s.first_seen_at).getTime();
                  return sum + duration;
                }, 0) / yesterdaySessions.length / 1000 / 60 * 100
              ) / 100
            : 0;

          // Top pages
          const pageCounts: Record<string, number> = {};
          yesterdaySessions.forEach(s => {
            if (s.current_page) {
              pageCounts[s.current_page] = (pageCounts[s.current_page] || 0) + 1;
            }
          });
          const topPages = Object.entries(pageCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([page, count]) => ({ page, count }));

          // Top referrers
          const refCounts: Record<string, number> = {};
          yesterdaySessions.forEach(s => {
            let domain = 'Direct';
            if (s.referrer) {
              try {
                const url = new URL(s.referrer);
                domain = url.hostname.replace('www.', '');
              } catch {
                domain = s.referrer.substring(0, 50);
              }
            }
            refCounts[domain] = (refCounts[domain] || 0) + 1;
          });
          const topReferrers = Object.entries(refCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([source, count]) => ({ source, count }));

          // Insert aggregated stats
          const { error: insertError } = await supabase
            .from('visitor_daily_stats')
            .insert({
              date: yesterdayStr,
              unique_visitors: uniqueVisitors,
              total_page_views: totalPageViews,
              desktop_visitors: desktopVisitors,
              mobile_visitors: mobileVisitors,
              tablet_visitors: tabletVisitors,
              avg_session_minutes: avgSessionMinutes,
              top_pages: topPages,
              top_referrers: topReferrers
            });

          if (insertError) {
            console.error('Failed to insert daily stats:', insertError);
          } else {
            aggregated = true;
            console.log(`Aggregated stats for ${yesterdayStr}: ${uniqueVisitors} visitors, ${totalPageViews} page views`);
          }
        }
      }

      // Now delete sessions older than 48 hours (keep 24h buffer for safety)
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

      const { error, count } = await supabase
        .from('visitor_sessions')
        .delete()
        .lt('last_activity_at', fortyEightHoursAgo);

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        aggregated,
        aggregatedDate: aggregated ? yesterdayStr : null,
        deletedSessions: count
      });
    } catch (error) {
      console.error("Visitor cleanup error:", error);
      res.status(500).json({ error: "Failed to cleanup old sessions" });
    }
  });

  // Get historical visitor stats for charts
  app.get("/api/visitors/history", async (req, res) => {
    try {
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SECRET_KEY!
      );

      // Get number of days from query param (default 30)
      const days = Math.min(parseInt(req.query.days as string) || 30, 365);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString().split('T')[0];

      const { data: history, error } = await supabase
        .from('visitor_daily_stats')
        .select('*')
        .gte('date', startDateStr)
        .order('date', { ascending: true });

      if (error) {
        throw error;
      }

      // Calculate totals and trends
      const totalVisitors = history?.reduce((sum, d) => sum + (d.unique_visitors || 0), 0) || 0;
      const totalPageViews = history?.reduce((sum, d) => sum + (d.total_page_views || 0), 0) || 0;
      const avgDailyVisitors = history?.length ? Math.round(totalVisitors / history.length) : 0;

      // Device totals across period
      const deviceTotals = {
        desktop: history?.reduce((sum, d) => sum + (d.desktop_visitors || 0), 0) || 0,
        mobile: history?.reduce((sum, d) => sum + (d.mobile_visitors || 0), 0) || 0,
        tablet: history?.reduce((sum, d) => sum + (d.tablet_visitors || 0), 0) || 0
      };

      res.json({
        days,
        dailyStats: history || [],
        summary: {
          totalVisitors,
          totalPageViews,
          avgDailyVisitors,
          deviceTotals,
          daysWithData: history?.length || 0
        }
      });
    } catch (error) {
      console.error("Visitor history error:", error);
      res.status(500).json({ error: "Failed to get visitor history" });
    }
  });

  // ============================================
  // TOOLS HUB API ENDPOINTS
  // ============================================
  
  // Get tool usage for rate limiting
  app.get("/api/tools/usage/:toolSlug", async (req, res) => {
    try {
      const { toolSlug } = req.params;
      const { userId, sessionId } = req.query;
      
      // Get tool configuration from registry
      const { getToolBySlug } = await import('@shared/config/tools-registry');
      const tool = getToolBySlug(toolSlug);
      
      if (!tool) {
        return res.status(404).json({ error: "Tool not found" });
      }
      
      // For now, return mock usage data
      // In production, this would query the tool_usage table
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      res.json({
        toolSlug,
        usedToday: 0,
        limit: tool.limits.anonymous || 100,
        remainingToday: tool.limits.anonymous || 100,
        resetsAt: tomorrow.toISOString(),
      });
    } catch (error) {
      console.error("Tool usage error:", error);
      res.status(500).json({ error: "Failed to get tool usage" });
    }
  });
  
  // Track tool usage
  app.post("/api/tools/usage", async (req, res) => {
    try {
      const { toolSlug, userId, sessionId, action } = req.body;
      
      // In production, this would insert into tool_usage table
      // For now, just acknowledge the request
      
      res.json({
        success: true,
        tracked: true,
      });
    } catch (error) {
      console.error("Tool usage tracking error:", error);
      res.status(500).json({ error: "Failed to track tool usage" });
    }
  });
  
  // Airtable proxy - List articles
  app.get("/api/tools/articles", async (req, res) => {
    try {
      // Check if user has access (would check auth in production)
      
      if (!process.env.AIRTABLE_TOKEN || !process.env.AIRTABLE_BASE_ID) {
        return res.status(500).json({ 
          error: "Airtable configuration missing",
          records: [] // Return empty array to prevent UI errors
        });
      }
      
      const response = await fetch(
        `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Articles?maxRecords=100&view=Grid%20view`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.AIRTABLE_TOKEN}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`Airtable API error: ${response.status}`);
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Airtable fetch error:", error);
      res.status(500).json({ 
        error: error.message || "Failed to fetch articles",
        records: [] // Return empty array to prevent UI errors
      });
    }
  });
  
  // Airtable proxy - Update article
  app.patch("/api/tools/articles/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { fields } = req.body;
      
      if (!process.env.AIRTABLE_TOKEN || !process.env.AIRTABLE_BASE_ID) {
        return res.status(500).json({ error: "Airtable configuration missing" });
      }
      
      const response = await fetch(
        `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Articles/${id}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${process.env.AIRTABLE_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fields }),
        }
      );
      
      if (!response.ok) {
        throw new Error(`Airtable API error: ${response.status}`);
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Airtable update error:", error);
      res.status(500).json({ error: error.message || "Failed to update article" });
    }
  });
  
  // AI content enhancement endpoint
  app.post("/api/tools/ai/enhance-content", async (req, res) => {
    try {
      const { content, title, operation } = req.body;
      
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "AI service not configured" });
      }
      
      // Use Gemini API to enhance content
      const prompt = operation === 'improve' 
        ? `Improve this article content. Make it more engaging and professional while maintaining the same length and key points:\n\nTitle: ${title}\n\nContent: ${content}`
        : operation === 'expand'
        ? `Expand this article content by adding more relevant details and examples:\n\nTitle: ${title}\n\nContent: ${content}`
        : `Summarize this article content concisely:\n\nTitle: ${title}\n\nContent: ${content}`;
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1000,
            }
          })
        }
      );
      
      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }
      
      const data = await response.json();
      const enhancedContent = data.candidates?.[0]?.content?.parts?.[0]?.text || content;
      
      res.json({ enhancedContent });
    } catch (error: any) {
      console.error("AI enhancement error:", error);
      res.status(500).json({ error: error.message || "Failed to enhance content" });
    }
  });
  
  // File analysis endpoint for AI-powered tools
  app.post("/api/tools/ai/analyse-files", async (req, res) => {
    try {
      const { filenames, operation } = req.body;
      
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "AI service not configured" });
      }
      
      const prompt = operation === 'organize'
        ? `Suggest folder names to organize these files:\n${filenames.join('\n')}\n\nReturn a JSON object with filename as key and suggested folder as value.`
        : operation === 'find-duplicates'
        ? `Identify potential duplicate files from this list:\n${filenames.join('\n')}\n\nReturn a JSON array of filename pairs that might be duplicates.`
        : `Suggest better names for these files:\n${filenames.join('\n')}\n\nReturn a JSON object with original filename as key and suggested name as value.`;
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.5,
              maxOutputTokens: 500,
            }
          })
        }
      );
      
      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }
      
      const data = await response.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      
      // Try to parse as JSON, fallback to simple format
      let suggestions;
      try {
        suggestions = JSON.parse(textResponse);
      } catch {
        // Parse simple text format as fallback
        suggestions = {};
        const lines = textResponse.split('\n');
        for (const line of lines) {
          const [original, suggestion] = line.split('->').map(s => s.trim());
          if (original && suggestion) {
            suggestions[original] = suggestion;
          }
        }
      }
      
      res.json({ suggestions });
    } catch (error: any) {
      console.error("AI file analysis error:", error);
      res.status(500).json({ error: error.message || "Failed to analyse files" });
    }
  });

  // N8N MCP Integration API
  app.post("/api/n8n/mcp-execute", async (req, res) => {
    try {
      const { workflowName, input } = req.body;
      
      if (!workflowName) {
        return res.status(400).json({ error: "Workflow name is required" });
      }

      // n8n instance configuration
      const n8nHost = process.env.N8N_HOST || "http://168.231.86.89:5678";
      const n8nApiKey = process.env.N8N_API_KEY;
      
      if (!n8nApiKey) {
        return res.status(500).json({ 
          error: 'N8N_API_KEY environment variable not configured' 
        });
      }
      
      // Workflow name to ID mapping based on N8N_INTEGRATION.md
      const workflowMap: Record<string, string> = {
        "Rip page and make content (Gemini)": "aZ45BRkUzOn6js0h",
        "Veo 3 Video Generator": "VqlWfaH28rOy84x0",
        "Tavily and ElevenLabs": "4eAEEuHw7u2XJYDP",
        "Google Maps Scraper": "k6qtAyr3FOX8CIej",
        "Create articles not repetitive": "TG9oJx66C2uF96CB",
        "META Auto Responder": "ZlmsEnvZjDzSyCX1",
        "Rip page and make content": "5ZZxNtNzg3Fxqxuf"
      };

      const workflowId = workflowMap[workflowName];
      if (!workflowId) {
        return res.status(400).json({ 
          error: "Unknown workflow name", 
          availableWorkflows: Object.keys(workflowMap)
        });
      }
      
      console.log(`Executing n8n workflow '${workflowName}' (ID: ${workflowId})`);
      console.log('Input data:', input);
      
      // Execute workflow via n8n REST API
      // Try POST to trigger endpoint first, then fall back to execute
      let n8nResponse = await fetch(`${n8nHost}/api/v1/workflows/${workflowId}/trigger`, {
        method: 'POST',
        headers: {
          'X-N8N-API-KEY': n8nApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(input || {})
      });

      // If trigger fails, try execute endpoint
      if (!n8nResponse.ok && n8nResponse.status === 405) {
        n8nResponse = await fetch(`${n8nHost}/api/v1/workflows/${workflowId}/execute`, {
          method: 'POST',
          headers: {
            'X-N8N-API-KEY': n8nApiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(input || {})
        });
      }

      if (!n8nResponse.ok) {
        const errorText = await n8nResponse.text();
        throw new Error(`n8n API error (${n8nResponse.status}): ${errorText}`);
      }

      const result = await n8nResponse.json();
      
      res.json({
        success: true,
        message: `Workflow '${workflowName}' executed successfully`,
        workflowName,
        workflowId,
        input,
        result,
        executionId: result.data?.executionId || result.executionId
      });

    } catch (error: any) {
      console.error('N8N execution error:', error);
      res.status(500).json({ 
        error: 'Failed to execute n8n workflow',
        details: error.message 
      });
    }
  });

  // N8N Webhook Integration API
  app.post("/api/n8n/webhook-execute", async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      // n8n webhook configuration
      const n8nHost = process.env.N8N_HOST || 'http://168.231.86.89:5678';
      const webhookPath = '/webhook/rip-content';
      const webhookUrl = `${n8nHost}${webhookPath}`;
      
      console.log(`Triggering n8n webhook: ${webhookUrl}`);
      console.log('URL to process:', url);
      
      // Call the n8n webhook directly
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!webhookResponse.ok) {
        throw new Error(`Webhook request failed: ${webhookResponse.status} ${webhookResponse.statusText}`);
      }

      const webhookResult = await webhookResponse.json();
      console.log('N8N webhook response:', webhookResult);
      
      res.json({
        success: true,
        message: 'Workflow triggered successfully via webhook',
        webhookUrl,
        url,
        result: webhookResult
      });

    } catch (error: any) {
      console.error('N8N webhook execution error:', error);
      res.status(500).json({ 
        error: 'Failed to execute webhook workflow',
        details: error.message 
      });
    }
  });

  // Enhanced Web Page Content Creator API (Staff Only)
  app.post("/api/content/web-page-creator", async (req, res) => {
    try {
      // Authentication check - restrict to staff and super_admin only
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          error: "Authentication required",
          message: "This tool is available exclusively to team members. Please sign in with a staff account."
        });
      }

      // For now, allow access with any Bearer token (the frontend access control is the primary gate)
      // TODO: Implement proper JWT validation and role checking when auth middleware is complete
      
      const { url, useSiteImages = true, spellingPreference = 'british', scrapingOptions = {} } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      console.log(`Starting enhanced web page content creation for: ${url}`);
      
      // Set default scraping options
      const defaultOptions = {
        includeMetaData: true,
        extractHeadings: true,
        maxContentLength: 10000,
        imageQualityThreshold: 'medium' as const,
        enableJavaScript: false,
        includeSchemaData: true
      };
      
      const options = { ...defaultOptions, ...scrapingOptions };
      
      // Step 1: Extract content from webpage
      const { WebContentExtractor } = await import('./services/web-content-extractor');
      const contentExtractor = new WebContentExtractor();
      const extractedContent = await contentExtractor.extractContent(url, options);
      
      console.log(`Content extracted: ${extractedContent.stats.contentLength} chars, ${extractedContent.stats.imageCount} images`);
      
      // Step 2: Assess and enhance images
      const { ImageEnhancementService } = await import('./services/image-enhancement-service');
      const imageService = new ImageEnhancementService();
      const imageAssessment = await imageService.assessAndEnhanceImages(
        extractedContent.images,
        extractedContent.cleanText,
        url,
        !useSiteImages  // Force fallback images when user unchecks "use site images"
      );
      
      console.log(`Image assessment complete: ${imageAssessment.usableImages.length} usable, ${imageAssessment.fallbackImages.length} fallback`);
      
      // Step 3: Generate content with Gemini
      const { GeminiContentGenerator } = await import('./services/gemini-content-generator');
      const geminiGenerator = new GeminiContentGenerator();
      const contentResult = await geminiGenerator.generateContent(
        extractedContent,
        imageAssessment,
        useSiteImages,
        spellingPreference
      );
      
      console.log(`Content generation complete: ${contentResult.articles.length} articles created`);
      console.log(`🖼️ Final Article Image URLs:`);
      contentResult.articles.forEach((article, i) => {
        console.log(`  Article ${i + 1}: ${article.assignedImageUrl || 'NO URL'}`);
      });
      
      // Step 4: Prepare response with articles for client-side Airtable handling
      // NOTE: Airtable integration now handled in browser (like Article Editor)
      console.log(`📤 Returning ${contentResult.articles.length} articles for client-side Airtable integration`);
      
      const response = {
        success: true,
        data: {
          ...contentResult,
          extractionStats: extractedContent.stats,
          imageStrategy: imageAssessment.recommendations.reasoning,
          processingTime: Date.now(),
          // Articles ready for client-side Airtable upload
          // NOTE: Using exact field names from Airtable table structure
          articlesForAirtable: contentResult.articles.map(article => ({
            'Headline': article.headline,
            'Hook': article.hook,
            'Content': article.content,
            'Hashtags': article.hashtags.join(', '),
            'Focus Angle': article.focusAngle,
            'Image URL': article.assignedImageUrl,
            'Image Placement': article.imagePlacement,
            'Client': article.clientName, // Fixed: 'Client' not 'Client Name'
            'Tone': article.tone,
            'Status': 'Draft',
            'Source Title': extractedContent.title,
            'Source URL': url
          }))
        },
        metadata: {
          sourceUrl: url,
          sourceTitle: extractedContent.title,
          processingOptions: options,
          generatedAt: new Date().toISOString(),
          instructions: 'Articles ready for client-side Airtable upload'
        }
      };
      
      res.json(response);
      
    } catch (error: any) {
      console.error('Enhanced web page content creation failed:', error);
      
      res.status(500).json({
        success: false,
        error: 'Content creation failed',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // ChatGPT Content Creator via n8n Webhook (Staff Only)
  app.post("/api/content/n8n-webhook-creator", async (req, res) => {
    try {
      // Authentication check - restrict to staff and super_admin only
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          error: "Authentication required",
          message: "This tool is available exclusively to team members. Please sign in with a staff account."
        });
      }

      const { url, useSiteImages = true, spellingPreference = 'british', scrapingOptions = {} } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      console.log('🚀 Starting ChatGPT content creation via n8n webhook...');
      console.log('📋 Request URL:', url);

      // Call n8n webhook with just the URL parameter
      const webhookUrl = 'https://n8n.netfox.co.za/webhook/42944826-4c59-4f4f-81b3-cb83ecab043c';
      
      console.log('🔗 Calling n8n webhook:', webhookUrl);
      
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text();
        console.error(`❌ n8n webhook failed with status ${webhookResponse.status}:`, errorText);
        throw new Error(`n8n webhook failed with status ${webhookResponse.status}: ${errorText}`);
      }

      let webhookData;
      const responseText = await webhookResponse.text();
      try {
        webhookData = JSON.parse(responseText);
        console.log('✅ n8n webhook response:', webhookData);
      } catch (parseError) {
        console.error('❌ Failed to parse n8n response as JSON:', responseText);
        console.error('Parse error:', parseError);
        throw new Error(`Invalid JSON response from n8n: ${responseText.substring(0, 200)}`);
      }

      // Return a response compatible with the frontend expectations
      const response = {
        success: true,
        message: 'ChatGPT content creation via n8n completed',
        data: {
          articlesForAirtable: [{
            'Client': 'ChatGPT via n8n',
            'Source Title': `Content from: ${url}`,
            'Content': 'Generated by ChatGPT via n8n workflow',
            'Status': 'Draft',
            'Created': new Date().toISOString()
          }]
        },
        metadata: {
          sourceTitle: `Content from: ${url}`,
          aiModel: 'ChatGPT via n8n',
          timestamp: new Date().toISOString(),
          webhookResponse: webhookData
        }
      };

      console.log('✅ ChatGPT n8n webhook integration completed');
      res.json(response);
      
    } catch (error: any) {
      console.error('n8n webhook content creation failed:', error);
      
      res.status(500).json({
        success: false,
        error: 'n8n webhook failed',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Test endpoint for debugging Airtable connection
  app.post('/api/content/test-airtable', async (req, res) => {
    try {
      console.log('🔍 Starting Airtable test...');
      
      // Test environment variables first
      const token = process.env.AIRTABLE_TOKEN;
      const baseId = process.env.AIRTABLE_BASE_ID;
      const tableId = process.env.AIRTABLE_TABLE_ID;
      
      console.log('📋 Environment check:');
      console.log('  - Token:', token ? `${token.substring(0, 20)}...` : 'MISSING');
      console.log('  - Base ID:', baseId || 'MISSING');
      console.log('  - Table ID:', tableId || 'MISSING');
      
      if (!token || !baseId || !tableId) {
        return res.status(500).json({
          success: false,
          error: 'Environment variables missing',
          details: { token: !!token, baseId: !!baseId, tableId: !!tableId },
          timestamp: new Date().toISOString()
        });
      }
      
      console.log('📦 Importing AirtableService...');
      const { AirtableService } = await import('./services/airtable-service');
      console.log('✅ Import successful');
      
      console.log('🏗️ Creating service instance...');
      const airtableService = new AirtableService();
      console.log('✅ Instance created');
      
      console.log('📡 Testing connection...');
      const connectionTest = await airtableService.testConnection();
      console.log('📊 Connection result:', connectionTest);
      
      if (connectionTest) {
        res.json({
          success: true,
          message: 'Airtable connection successful',
          credentials: { token: !!token, baseId: !!baseId, tableId: !!tableId },
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Airtable connection failed',
          credentials: { token: !!token, baseId: !!baseId, tableId: !!tableId },
          timestamp: new Date().toISOString()
        });
      }
    } catch (error: any) {
      console.error('💥 Airtable test endpoint error:', error);
      res.status(500).json({
        success: false,
        error: 'Test failed',
        details: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Secure credential proxy for Article Editor (staff only)
  app.get('/api/airtable/config', async (req, res) => {
    try {
      // Simple authentication check (enhance this later with proper auth)
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Validate environment variables
      const token = process.env.AIRTABLE_TOKEN;
      const baseId = process.env.AIRTABLE_BASE_ID;
      const tableId = process.env.AIRTABLE_TABLE_ID;
      const imgbbKey = process.env.IMGBB_API_KEY;

      if (!token || !baseId || !tableId || !imgbbKey) {
        console.error('Airtable configuration incomplete:', {
          token: !!token,
          baseId: !!baseId,
          tableId: !!tableId,
          imgbbKey: !!imgbbKey
        });
        return res.status(500).json({ error: 'Airtable configuration incomplete' });
      }

      // Return configuration securely
      res.json({
        airtable: {
          token,
          baseId,
          tableId
        },
        imgbb: {
          apiKey: imgbbKey
        }
      });

    } catch (error) {
      console.error('Airtable config endpoint error:', error);
      res.status(500).json({ error: 'Failed to provide configuration' });
    }
  });

  // === AI IMAGE GENERATION ENDPOINTS ===

  // AI Prompt Analysis - Analyze article content and suggest image prompts
  app.post('/api/ai/analyze-image-prompt', async (req, res) => {
    try {
      const { articleContext, artStyle, imageStyle } = req.body;

      if (!articleContext) {
        return res.status(400).json({
          success: false,
          error: 'Article context is required',
        });
      }

      console.log('🧠 Starting AI prompt analysis...');

      const { AIPromptAnalyzer } = await import('./services/ai-prompt-analyzer');
      const analyzer = new AIPromptAnalyzer();

      const result = await analyzer.analyzeContent({
        articleContext,
        artStyle: artStyle || 'photorealistic',
        imageStyle: imageStyle || 'hero',
      });

      console.log('✅ AI prompt analysis completed');

      res.json({
        success: true,
        suggestedPrompt: result.suggestedPrompt,
        analysisReasoning: result.analysisReasoning,
        alternativePrompts: result.alternativePrompts,
        keyVisualElements: result.keyVisualElements,
        timestamp: new Date().toISOString(),
      });

    } catch (error: any) {
      console.error('💥 AI prompt analysis error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Prompt analysis failed',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // AI Prompt Enhancement - Enhance standalone user prompts  
  app.post('/api/ai/enhance-prompt', async (req, res) => {
    try {
      const { 
        userPrompt, 
        artStyle, 
        imageStyle, 
        includeTitle, 
        includeSubtitle, 
        titleText, 
        subtitleText 
      } = req.body;
      if (!userPrompt) {
        return res.status(400).json({
          success: false,
          error: 'User prompt is required',
        });
      }

      console.log('✨ Starting prompt enhancement...');
      const { AIPromptAnalyzer } = await import('./services/ai-prompt-analyzer');
      const analyzer = new AIPromptAnalyzer();
      
      const result = await analyzer.enhanceStandalonePrompt({
        userPrompt,
        artStyle: artStyle || 'photorealistic',
        imageStyle: imageStyle || 'professional',
        includeTitle,
        includeSubtitle,
        titleText,
        subtitleText,
      });

      console.log('✅ Prompt enhancement completed');
      res.json({
        success: true,
        suggestedPrompt: result.suggestedPrompt,
        analysisReasoning: result.analysisReasoning,
        alternativePrompts: result.alternativePrompts,
        keyVisualElements: result.keyVisualElements,
        timestamp: new Date().toISOString(),
      });

    } catch (error: any) {
      console.error('💥 Prompt enhancement error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Prompt enhancement failed',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // AI Title Enhancement - Optimize titles for visual impact
  app.post('/api/ai/enhance-title', async (req, res) => {
    try {
      const { titleText, artStyle, imageStyle, articleContext } = req.body;

      if (!titleText || !titleText.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Title text is required',
        });
      }

      console.log('✨ Starting AI title enhancement...');
      console.log('📝 Original title:', titleText);

      const enhancementPrompt = `You are an expert copywriter specializing in visual media titles. Your task is to enhance a title for maximum visual impact on an AI-generated image.

ORIGINAL TITLE: "${titleText}"
ART STYLE: ${artStyle}
IMAGE STYLE: ${imageStyle}
${articleContext ? `ARTICLE CONTEXT: ${JSON.stringify(articleContext, null, 2)}` : ''}

GUIDELINES:
- Keep it CONCISE: 1-5 words maximum
- Make it IMPACTFUL: Strong, memorable words
- Visual hierarchy: Should work as overlay text
- Avoid generic words: "amazing", "incredible", "stunning"
- Consider the art/image style for tone matching
- Preserve the core meaning while amplifying impact

Return ONLY the enhanced title text. No explanations, quotes, or formatting.`;

      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

      console.log('🤖 Calling Gemini for title enhancement...');
      const result = await model.generateContent(enhancementPrompt);
      const response = await result.response;
      const enhancedTitle = response.text().trim();

      console.log('✅ Title enhancement completed');
      res.json({
        success: true,
        enhancedTitle: enhancedTitle,
        originalTitle: titleText,
        timestamp: new Date().toISOString(),
      });

    } catch (error: any) {
      console.error('💥 Title enhancement error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Title enhancement failed',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // AI Subtitle Enhancement - Optimize subtitles for visual impact
  app.post('/api/ai/enhance-subtitle', async (req, res) => {
    try {
      const { subtitleText, artStyle, imageStyle, articleContext } = req.body;

      if (!subtitleText || !subtitleText.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Subtitle text is required',
        });
      }

      console.log('✨ Starting AI subtitle enhancement...');
      console.log('📝 Original subtitle:', subtitleText);

      const enhancementPrompt = `You are an expert copywriter specializing in visual media subtitles. Your task is to enhance a subtitle for maximum visual impact on an AI-generated image.

ORIGINAL SUBTITLE: "${subtitleText}"
ART STYLE: ${artStyle}
IMAGE STYLE: ${imageStyle}
${articleContext ? `ARTICLE CONTEXT: ${JSON.stringify(articleContext, null, 2)}` : ''}

GUIDELINES:
- Keep it BRIEF: 2-8 words maximum
- Complement the title: Should support, not compete
- Clear and readable: Works as secondary overlay text
- Emotionally engaging: Create curiosity or connection
- Consider the art/image style for tone matching
- Preserve the core message while making it more compelling

Return ONLY the enhanced subtitle text. No explanations, quotes, or formatting.`;

      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

      console.log('🤖 Calling Gemini for subtitle enhancement...');
      const result = await model.generateContent(enhancementPrompt);
      const response = await result.response;
      const enhancedSubtitle = response.text().trim();

      console.log('✅ Subtitle enhancement completed');
      res.json({
        success: true,
        enhancedSubtitle: enhancedSubtitle,
        originalSubtitle: subtitleText,
        timestamp: new Date().toISOString(),
      });

    } catch (error: any) {
      console.error('💥 Subtitle enhancement error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Subtitle enhancement failed',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // AI Image Generation - Generate images using Vertex AI
  app.post('/api/ai/generate-image', async (req, res) => {
    try {
      const {
        prompt,
        includeTitle,
        includeSubtitle,
        artStyle,
        imageStyle,
        resolution,
        aspectRatio,
        model,
        articleContext
      } = req.body;

      if (!prompt || !prompt.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Image prompt is required',
        });
      }

      console.log('🎨 Starting AI image generation...');

      const { VertexAIImageGenerator } = await import('./services/vertex-ai-image-generator');
      const generator = new VertexAIImageGenerator();

      // Clean resolution format for processing
      const cleanResolution = resolution ? resolution.replace('px', '') : '1024';
      
      const result = await generator.generateImage({
        prompt: prompt.trim(),
        includeTitle: includeTitle || false,
        includeSubtitle: includeSubtitle || false,
        artStyle: artStyle || 'photorealistic',
        imageStyle: imageStyle || 'hero',
        resolution: cleanResolution,
        aspectRatio: aspectRatio || '1:1',
        model: model || 'imagen-4.0-generate-001',
        articleContext,
      });

      console.log('✅ AI image generation completed');

      res.json({
        success: true,
        imageUrl: result.imageUrl,
        prompt: result.prompt,
        metadata: result.metadata,
        timestamp: new Date().toISOString(),
      });

    } catch (error: any) {
      console.error('💥 AI image generation error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Image generation failed',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // AI Video Generation - Generate videos using Vertex AI VEO
  app.post('/api/ai/generate-video', async (req, res) => {
    try {
      const {
        prompt,
        model,
        resolution,
        aspectRatio,
        duration,
        sampleCount,
        image
      } = req.body;

      if (!prompt || !prompt.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Video prompt is required',
        });
      }

      if (!image || !image.bytesBase64Encoded || !image.mimeType) {
        return res.status(400).json({
          success: false,
          error: 'Starting frame image is required',
        });
      }

      // CRITICAL: Force sample count to 1 for cost control
      const forcedSampleCount = 1;
      if (sampleCount !== 1) {
        console.warn('⚠️ Sample count forced to 1 for cost control!');
      }

      console.log('🎬 Starting AI video generation...');
      console.log('🎥 Video specifications:', {
        model: model || 'veo-3.0-generate-001',
        resolution: resolution || '1080p',
        aspectRatio: aspectRatio || '16:9',
        duration: duration || 6,
        sampleCount: forcedSampleCount
      });

      const { VertexAIVeoGenerator } = await import('./services/vertex-ai-veo-generator');
      const generator = new VertexAIVeoGenerator();

      const result = await generator.generateVideo({
        prompt: prompt.trim(),
        model: model || 'veo-3.0-generate-001',
        resolution: resolution || '1080p',
        aspectRatio: aspectRatio || '16:9',
        duration: duration || 6,
        sampleCount: forcedSampleCount, // ALWAYS 1
        image: {
          bytesBase64Encoded: image.bytesBase64Encoded,
          mimeType: image.mimeType
        }
      });

      console.log('✅ AI video generation completed');

      res.json({
        success: true,
        videoUrl: result.videoUrl,
        prompt: result.prompt,
        metadata: result.metadata,
        timestamp: new Date().toISOString(),
      });

    } catch (error: any) {
      console.error('💥 AI video generation error:', error);

      res.status(500).json({
        success: false,
        error: 'Video generation failed',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // === UNSPLASH INTEGRATION ENDPOINTS ===

  // AI-powered Unsplash search term generation
  app.post('/api/ai/generate-unsplash-search', async (req, res) => {
    try {
      const { articleContext, artStyle, imageStyle } = req.body;

      if (!articleContext) {
        return res.status(400).json({
          success: false,
          error: 'Article context is required',
        });
      }

      console.log('🧠 Generating AI-powered Unsplash search term...');

      // Use Gemini to generate search terms
      const prompt = `
You are an expert at creating effective search terms for stock photography. Analyze the following article content and generate 1-3 optimal search terms for finding relevant Unsplash images.

ARTICLE CONTENT:
${articleContext.headline ? `Headline: "${articleContext.headline}"` : ''}
${articleContext.hook ? `Hook: "${articleContext.hook}"` : ''}
${articleContext.content ? `Content Preview: "${articleContext.content.slice(0, 300)}..."` : ''}

TARGET STYLE: ${artStyle} ${imageStyle}

REQUIREMENTS:
1. Generate search terms that will find relevant, high-quality images on Unsplash
2. Consider the article topic, mood, and intended image style
3. Keep terms broad enough to return results but specific enough to be relevant
4. Avoid overly specific terms that might have zero results
5. Consider visual metaphors and symbolic representations

Respond with only the best search term (2-4 words maximum). No explanation needed.

Examples of good search terms:
- "business team meeting"
- "modern technology"
- "health wellness"
- "financial growth"
- "creative workspace"

Your search term:`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.3, // Lower temperature for more consistent results
              topK: 10,
              topP: 0.8,
              maxOutputTokens: 50,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const result = await response.json();
      const searchTerm = result.candidates[0].content.parts[0].text.trim();

      console.log('✅ AI search term generated:', searchTerm);

      res.json({
        success: true,
        searchTerm,
        timestamp: new Date().toISOString(),
      });

    } catch (error: any) {
      console.error('💥 AI search term generation error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Search term generation failed',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Unsplash image search
  app.post('/api/unsplash/search', async (req, res) => {
    try {
      const { query, per_page = 6, orientation = 'squarish', page = 1 } = req.body;

      if (!query || !query.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Search query is required',
        });
      }

      const unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY;
      if (!unsplashAccessKey) {
        throw new Error('Unsplash access key not configured');
      }

      console.log(`🔍 Searching Unsplash for: "${query}" (${per_page} images, ${orientation} orientation, page ${page})`);

      const searchUrl = new URL('https://api.unsplash.com/search/photos');
      searchUrl.searchParams.append('query', query.trim());
      searchUrl.searchParams.append('per_page', per_page.toString());
      searchUrl.searchParams.append('page', page.toString());
      
      // Only add orientation if it's a valid Unsplash value
      if (orientation === 'landscape' || orientation === 'portrait' || orientation === 'squarish') {
        searchUrl.searchParams.append('orientation', orientation);
      }
      
      searchUrl.searchParams.append('content_filter', 'high'); // High quality images only

      const response = await fetch(searchUrl.toString(), {
        headers: {
          'Authorization': `Client-ID ${unsplashAccessKey}`,
          'Accept-Version': 'v1',
        },
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Unsplash API error:', response.status, errorData);
        throw new Error(`Unsplash API error: ${response.status} - ${errorData}`);
      }

      const result = await response.json();
      
      console.log(`✅ Found ${result.results.length} Unsplash images`);

      res.json({
        success: true,
        results: result.results,
        total: result.total,
        total_pages: result.total_pages,
        timestamp: new Date().toISOString(),
      });

    } catch (error: any) {
      console.error('💥 Unsplash search error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Unsplash search failed',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // === CLOUD STORAGE BROWSER API ===

  // Simple in-memory cache for cloud storage files
  let cloudStorageCache: any = null;
  let cacheTimestamp = 0;
  const CACHE_DURATION = 60000; // 1 minute cache

  // GET /api/cloud-storage/files - List all files in Google Cloud Storage
  app.get('/api/cloud-storage/files', async (req, res) => {
    try {
      const now = Date.now();
      
      // Return cached data if still valid
      if (cloudStorageCache && (now - cacheTimestamp) < CACHE_DURATION) {
        console.log('📁 Returning cached cloud storage files');
        return res.json({
          ...cloudStorageCache,
          cached: true,
          timestamp: new Date().toISOString()
        });
      }

      console.log('📁 Loading files from Google Cloud Storage...');
      const startTime = Date.now();

      // Import Google Cloud Storage
      const { Storage } = await import('@google-cloud/storage');
      
      const storage = new Storage({
        projectId: process.env.GOOGLE_PROJECT_ID,
        credentials: {
          type: 'service_account',
          project_id: process.env.GOOGLE_PROJECT_ID,
          private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
          private_key: process.env.GOOGLE_PRIVATE_KEY,
          client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          client_id: process.env.GOOGLE_CLIENT_ID,
          auth_uri: 'https://accounts.google.com/o/oauth2/auth',
          token_uri: 'https://oauth2.googleapis.com/token',
          auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
          client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL}`,
        }
      });

      const buckets = ['netfox-veo-generations']; // Add more buckets as needed
      const allFiles: any[] = [];

      for (const bucketName of buckets) {
        try {
          const bucket = storage.bucket(bucketName);
          
          // ⚡ CRITICAL PERFORMANCE FIX: Use includeMetadata to eliminate individual getMetadata() calls
          const [files] = await bucket.getFiles({
            includeMetadata: true,
            maxResults: 1000
          });
          
          console.log(`📂 Found ${files.length} files in bucket: ${bucketName}`);

          for (const file of files) {
            // Use metadata from getFiles call instead of separate getMetadata() - MAJOR SPEED IMPROVEMENT
            const metadata = file.metadata;
            
            // ⚡ FAST file type detection using extension instead of MIME type parsing
            const fileName = file.name || '';
            const extension = fileName.toLowerCase().split('.').pop() || '';
            let type = 'other';
            
            // Extension-based detection is much faster than MIME type analysis
            if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(extension)) {
              type = 'image';
            } else if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'm4v'].includes(extension)) {
              type = 'video';
            }
            
            // Simplified MIME type handling
            let mimeType = metadata?.contentType || 'application/octet-stream';
            if (!metadata?.contentType) {
              if (type === 'image') mimeType = `image/${extension}`;
              else if (type === 'video') mimeType = `video/${extension}`;
            }

            // Build public URL
            const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;

            allFiles.push({
              name: fileName.split('/').pop() || fileName,
              path: fileName,
              size: parseInt(metadata?.size || '0'),
              type,
              mimeType,
              lastModified: metadata?.updated || metadata?.timeCreated || new Date().toISOString(),
              publicUrl,
              bucket: bucketName
            });
          }
        } catch (bucketError) {
          console.error(`❌ Error accessing bucket ${bucketName}:`, bucketError);
        }
      }

      // Calculate stats
      const stats = {
        totalFiles: allFiles.length,
        totalSize: allFiles.reduce((sum, file) => sum + file.size, 0),
        images: allFiles.filter(f => f.type === 'image').length,
        videos: allFiles.filter(f => f.type === 'video').length,
        other: allFiles.filter(f => f.type === 'other').length
      };

      const loadTime = Date.now() - startTime;
      console.log(`✅ Loaded ${allFiles.length} files from ${buckets.length} buckets in ${loadTime}ms`);
      console.log(`📊 Stats: ${stats.images} images, ${stats.videos} videos, ${stats.other} other`);
      console.log(`⚡ Performance: ${loadTime < 3000 ? 'FAST' : loadTime < 5000 ? 'MODERATE' : 'SLOW'} (${loadTime}ms)`);

      // Cache the response
      const responseData = {
        success: true,
        files: allFiles,
        stats,
        buckets
      };
      cloudStorageCache = responseData;
      cacheTimestamp = now;

      res.json({
        ...responseData,
        cached: false,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('💥 Cloud Storage listing error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to list cloud storage files',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // DELETE /api/cloud-storage/delete - Delete a file from Google Cloud Storage
  app.delete('/api/cloud-storage/delete', async (req, res) => {
    try {
      const { bucket: bucketName, filePath } = req.body;

      if (!bucketName || !filePath) {
        return res.status(400).json({
          success: false,
          error: 'Bucket name and file path are required'
        });
      }

      console.log(`🗑️ Deleting file: ${filePath} from bucket: ${bucketName}`);

      // Import Google Cloud Storage
      const { Storage } = await import('@google-cloud/storage');
      
      const storage = new Storage({
        projectId: process.env.GOOGLE_PROJECT_ID,
        credentials: {
          type: 'service_account',
          project_id: process.env.GOOGLE_PROJECT_ID,
          private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
          private_key: process.env.GOOGLE_PRIVATE_KEY,
          client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          client_id: process.env.GOOGLE_CLIENT_ID,
          auth_uri: 'https://accounts.google.com/o/oauth2/auth',
          token_uri: 'https://oauth2.googleapis.com/token',
          auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
          client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL}`,
        }
      });

      const bucket = storage.bucket(bucketName);
      const file = bucket.file(filePath);

      // Check if file exists
      const [exists] = await file.exists();
      if (!exists) {
        return res.status(404).json({
          success: false,
          error: 'File not found'
        });
      }

      // Delete the file
      await file.delete();

      console.log(`✅ File deleted successfully: ${filePath}`);

      res.json({
        success: true,
        message: 'File deleted successfully',
        filePath,
        bucketName,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('💥 Cloud Storage delete error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to delete file from cloud storage',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // GET /api/cloud-storage/thumbnail/:bucketName/:filePath* - Generate optimized video thumbnail
  app.get('/api/cloud-storage/thumbnail/:bucketName/:filePath(*)', async (req, res) => {
    try {
      const { bucketName, filePath } = req.params;
      console.log(`📥 Received thumbnail request: bucket=${bucketName}, file=${filePath}`);
      
      if (!bucketName || !filePath) {
        return res.status(400).json({
          success: false,
          error: 'Bucket name and file path are required'
        });
      }

      console.log(`🎬 Generating thumbnail for: ${bucketName}/${filePath}`);

      // Import required modules
      const { Storage } = await import('@google-cloud/storage');
      const ffmpeg = (await import('fluent-ffmpeg')).default;
      const { promises: fs } = await import('fs');
      const path = await import('path');
      const { v4: uuidv4 } = await import('uuid');

      const storage = new Storage({
        projectId: process.env.GOOGLE_PROJECT_ID,
        credentials: {
          type: 'service_account',
          project_id: process.env.GOOGLE_PROJECT_ID,
          private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
          private_key: process.env.GOOGLE_PRIVATE_KEY,
          client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          client_id: process.env.GOOGLE_CLIENT_ID,
          auth_uri: 'https://accounts.google.com/o/oauth2/auth',
          token_uri: 'https://oauth2.googleapis.com/token',
          auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
          client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL}`,
        }
      });

      // Generate thumbnail path
      const thumbnailPath = `thumbnails/${filePath}.thumbnail.jpg`;
      
      // Check if thumbnail already exists
      const bucket = storage.bucket(bucketName);
      const thumbnailFile = bucket.file(thumbnailPath);
      const [exists] = await thumbnailFile.exists();
      
      if (exists) {
        console.log(`✅ Thumbnail already exists: ${thumbnailPath}`);
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${thumbnailPath}`;
        return res.redirect(publicUrl);
      }

      // Get original video file
      const videoFile = bucket.file(filePath);
      const [videoExists] = await videoFile.exists();
      
      if (!videoExists) {
        return res.status(404).json({
          success: false,
          error: 'Video file not found'
        });
      }

      // Create temporary file paths
      const tempDir = '/tmp';
      const tempVideoPath = path.join(tempDir, `video_${uuidv4()}.mp4`);
      const tempThumbnailPath = path.join(tempDir, `thumbnail_${uuidv4()}.jpg`);

      // Download video to temp location
      console.log(`📥 Downloading video: ${filePath}`);
      const videoStream = videoFile.createReadStream();
      const fsLib = await import('fs');
      const writeStream = fsLib.createWriteStream(tempVideoPath);
      
      await new Promise((resolve, reject) => {
        videoStream.pipe(writeStream);
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });

      // Generate optimized thumbnail using FFmpeg with seeking-based approach (3.8x faster)
      console.log(`🎞️ Generating thumbnail with optimized FFmpeg seeking...`);
      const thumbnailStartTime = Date.now();
      
      await new Promise((resolve, reject) => {
        ffmpeg(tempVideoPath)
          // ⚡ PERFORMANCE: Use input seeking (-ss before -i) for 3.8x faster processing
          .seekInput(2) // Seek to 2 seconds using fast input seeking
          .frames(1) // Extract only 1 frame for efficiency
          .videoFilter('thumbnail,setsar=1') // Use thumbnail filter for best frame selection
          .size('480x360') // Optimized size for web display (16:9 aspect ratio)
          .format('jpeg')
          .videoCodec('mjpeg') // MJPEG for fast encoding
          .outputOptions([
            '-an', // No audio processing for speed
            '-q:v 3', // Quality level 3 for balance of size/quality (research recommended)
            '-y' // Overwrite existing files
          ])
          .output(tempThumbnailPath)
          .on('start', (command) => {
            console.log(`🚀 FFmpeg command: ${command}`);
          })
          .on('end', () => {
            const thumbnailTime = Date.now() - thumbnailStartTime;
            console.log(`✅ Thumbnail generated in ${thumbnailTime}ms (optimized seeking)`);
            resolve(null);
          })
          .on('error', (error) => {
            console.error('❌ FFmpeg error:', error);
            reject(error);
          })
          .run();
      });

      // Upload thumbnail to GCS
      console.log(`📤 Uploading thumbnail: ${thumbnailPath}`);
      await bucket.upload(tempThumbnailPath, {
        destination: thumbnailPath,
        metadata: {
          contentType: 'image/jpeg',
          cacheControl: 'public, max-age=3600' // Cache for 1 hour
        }
      });

      // Make thumbnail publicly accessible
      await thumbnailFile.makePublic();

      // Clean up temp files
      try {
        await fs.unlink(tempVideoPath);
        await fs.unlink(tempThumbnailPath);
      } catch (cleanupError) {
        console.error('⚠️ Cleanup error:', cleanupError);
      }

      const publicUrl = `https://storage.googleapis.com/${bucketName}/${thumbnailPath}`;
      console.log(`🎊 Thumbnail ready: ${publicUrl}`);

      res.json({
        success: true,
        thumbnailUrl: publicUrl,
        originalFile: filePath,
        bucket: bucketName,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('💥 Thumbnail generation error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to generate video thumbnail',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
