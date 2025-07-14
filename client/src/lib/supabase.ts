// Note: This is a placeholder for Supabase client configuration
// In production, you would install @supabase/supabase-js and configure it here
// For now, we'll use mock auth until Supabase is properly configured

export interface SupabaseUser {
  id: string;
  email: string;
  role: "staff" | "client";
}

class MockSupabaseAuth {
  private currentUser: SupabaseUser | null = null;

  async signIn(email: string, password: string): Promise<{ user: SupabaseUser | null; error: any }> {
    // Mock authentication - in production, use real Supabase auth
    const staffEmails = [
      "dax.tucker@gmail.com",
      "dax@slyfox.co.za", 
      "eben@slyfox.co.za",
      "kyle@slyfox.co.za"
    ];

    if (staffEmails.includes(email)) {
      this.currentUser = {
        id: "mock-" + Date.now(),
        email,
        role: "staff"
      };
      return { user: this.currentUser, error: null };
    } else {
      this.currentUser = {
        id: "mock-" + Date.now(),
        email,
        role: "client"
      };
      return { user: this.currentUser, error: null };
    }
  }

  async signUp(email: string, password: string): Promise<{ user: SupabaseUser | null; error: any }> {
    this.currentUser = {
      id: "mock-" + Date.now(),
      email,
      role: "client"
    };
    return { user: this.currentUser, error: null };
  }

  async signOut(): Promise<{ error: any }> {
    this.currentUser = null;
    return { error: null };
  }

  async getUser(): Promise<SupabaseUser | null> {
    return this.currentUser;
  }

  onAuthStateChange(callback: (user: SupabaseUser | null) => void) {
    // Mock implementation
    return { unsubscribe: () => {} };
  }
}

export const supabase = {
  auth: new MockSupabaseAuth()
};
