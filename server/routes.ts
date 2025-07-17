import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, insertClientSchema, insertShootSchema, 
  insertImageSchema, insertBookingSchema, insertAnalyticsSchema
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

      // For now, use simple hardcoded authentication for staff
      const staffEmails = [
        "dax.tucker@gmail.com",
        "dax@slyfox.co.za", 
        "eben@slyfox.co.za",
        "kyle@slyfox.co.za"
      ];
      
      if (staffEmails.includes(email) && password === "slyfox2025") {
        const user = {
          id: staffEmails.indexOf(email) + 1,
          email,
          role: "staff" as const
        };
        return res.json({ user });
      }
      
      // For clients, check against database (when implemented)
      // For now, allow any client with password "client123"
      if (password === "client123") {
        const user = {
          id: 100,
          email,
          role: "client" as const
        };
        return res.json({ user });
      }
      
      res.status(401).json({ message: "Invalid credentials" });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
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
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        phone: data.phone || "",
        message: data.message,
        serviceType: data.service || "general",
        preferredDate: null,
        budgetRange: "",
        status: "pending"
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
    } catch (error) {
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
    } catch (error) {
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
      
      const client = await storage.createClient({ ...data, slug });
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

  const httpServer = createServer(app);
  return httpServer;
}
