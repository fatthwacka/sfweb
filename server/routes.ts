import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from './storage';
import { 
  insertUserSchema, insertClientSchema, insertShootSchema, 
  insertImageSchema, insertBookingSchema, insertAnalyticsSchema,
  updateImageSequenceSchema, updateAlbumCoverSchema, updateShootDetailsSchema,
  updateShootCustomizationSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication endpoints
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      // First try legacy users table (for backwards compatibility)
      const legacyUser = await storage.getUserByEmail(email);
      if (legacyUser && legacyUser.password === password) {
        // Return legacy user data in expected format
        const responseUser = {
          id: legacyUser.id,
          email: legacyUser.email,
          role: legacyUser.role
        };
        return res.json({ user: responseUser });
      }

      // For now, if no legacy user found, return error
      // Once Supabase users are created, we'll integrate with Supabase auth properly
      return res.status(401).json({ message: "Invalid credentials - please create users in Supabase dashboard first" });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User management endpoints (super_admin only)
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Don't send passwords in response
      const safeUsers = users.map(user => ({
        id: user.id,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        bannerImage: user.bannerImage,
        themePreference: user.themePreference,
        createdAt: user.createdAt
      }));
      res.json(safeUsers);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(validatedData);
      // Don't send password in response
      const safeUser = {
        id: user.id,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        bannerImage: user.bannerImage,
        themePreference: user.themePreference,
        createdAt: user.createdAt
      };
      res.json(safeUser);
    } catch (error) {
      console.error("Create user error:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.updateUser(userId, req.body);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // Don't send password in response
      const safeUser = {
        id: user.id,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        bannerImage: user.bannerImage,
        themePreference: user.themePreference,
        createdAt: user.createdAt
      };
      res.json(safeUser);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const success = await storage.deleteUser(userId);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Failed to delete user" });
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

  app.get("/api/clients/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const client = await storage.getClientBySlug(slug);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      const shoots = await storage.getShootsByClient(client.id);
      res.json({ client, shoots });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      const data = insertClientSchema.parse(req.body);
      
      // Generate unique slug
      const slug = data.name.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      const client = await storage.createClient(data);
      res.json(client);
    } catch (error) {
      console.error("Create client error:", error);
      res.status(400).json({ message: "Invalid client data" });
    }
  });

  // Shoot endpoints
  app.get("/api/shoots/:id", async (req, res) => {
    try {
      const shootId = parseInt(req.params.id);
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

  app.post("/api/shoots", async (req, res) => {
    try {
      const data = insertShootSchema.parse(req.body);
      const shoot = await storage.createShoot(data);
      res.json(shoot);
    } catch (error) {
      console.error("Create shoot error:", error);
      res.status(400).json({ message: "Invalid shoot data" });
    }
  });

  app.patch("/api/shoots/:id", async (req, res) => {
    try {
      const shootId = parseInt(req.params.id);
      const updates = req.body;
      
      const shoot = await storage.updateShoot(shootId, updates);
      if (!shoot) {
        return res.status(404).json({ message: "Shoot not found" });
      }
      
      res.json(shoot);
    } catch (error) {
      res.status(500).json({ message: "Failed to update shoot" });
    }
  });

  app.patch("/api/shoots/:id/customization", async (req, res) => {
    try {
      const shootId = parseInt(req.params.id);
      const data = updateShootCustomizationSchema.parse(req.body);
      
      const shoot = await storage.updateShootCustomization(shootId, data);
      if (!shoot) {
        return res.status(404).json({ message: "Shoot not found" });
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
      const imageId = parseInt(req.params.id);
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

  app.delete("/api/images/:id", async (req, res) => {
    try {
      const imageId = parseInt(req.params.id);
      const deleted = await storage.deleteImage(imageId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Image not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete image" });
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

  const httpServer = createServer(app);
  return httpServer;
}
