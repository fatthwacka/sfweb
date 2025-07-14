import bcrypt from "bcryptjs";
import { storage } from "./storage";

export async function createUser(email: string, password: string, role: "staff" | "client" = "client") {
  // Check if user already exists
  const existingUser = await storage.getUserByEmail(email);
  if (existingUser) {
    throw new Error("User already exists");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = await storage.createUser({
    email,
    password: hashedPassword,
    role,
    profileImage: null,
    themePreference: "light"
  });

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function verifyUser(email: string, password: string) {
  const user = await storage.getUserByEmail(email);
  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw new Error("Invalid credentials");
  }

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function seedStaffUsers() {
  const staffEmails = [
    "dax.tucker@gmail.com",
    "dax@slyfox.co.za",
    "eben@slyfox.co.za",
    "kyle@slyfox.co.za"
  ];

  for (const email of staffEmails) {
    try {
      const existingUser = await storage.getUserByEmail(email);
      if (!existingUser) {
        await createUser(email, "slyfox2025", "staff");
        console.log(`Created staff user: ${email}`);
      }
    } catch (error) {
      console.log(`Staff user ${email} already exists`);
    }
  }
}