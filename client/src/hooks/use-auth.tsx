import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase, type SupabaseUser } from "@/lib/supabase";
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";

interface User {
  id: string;
  email: string;
  role: "super_admin" | "staff" | "client";
  fullName?: string;
  profileImage?: string | null;
  themePreference?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signOut: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start with true to prevent premature redirects
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  useEffect(() => {
    // Check for existing Supabase session
    console.log('AuthProvider: Checking for Supabase session...');
    
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Get user profile from profiles table
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, email, full_name, role')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            const user: User = {
              id: profile.id,
              email: profile.email,
              role: profile.role || 'client',
              fullName: profile.full_name
            };
            console.log('AuthProvider: Found session user:', user.email, user.role);
            setUser(user);
          }
        } else {
          console.log('AuthProvider: No session found');
        }
      } catch (error) {
        console.error('Session check error:', error);
      }
      
      setIsLoading(false);
      setHasCheckedAuth(true);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email, full_name, role')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          const user: User = {
            id: profile.id,
            email: profile.email,
            role: profile.role || 'client',
            fullName: profile.full_name
          };
          setUser(user);
        }
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    console.log('Login attempt starting for:', email);
    setIsLoading(true);
    
    try {
      console.log('Attempting Supabase auth...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      console.log('Supabase auth response:', { data, error });

      if (error) {
        console.error('Supabase auth error:', error);
        throw new Error(error.message);
      }

      if (data.user) {
        console.log('Auth successful, fetching profile for user:', data.user.id);
        
        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, email, full_name, role')
          .eq('id', data.user.id)
          .single();

        console.log('Profile fetch result:', { profile, profileError });

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          throw new Error(`Profile fetch failed: ${profileError.message}`);
        }

        if (profile) {
          const user: User = {
            id: profile.id,
            email: profile.email,
            role: profile.role || 'client',
            fullName: profile.full_name
          };
          
          console.log('Setting user state:', user);
          setUser(user);
          
          // Handle redirect based on user role
          console.log('Login redirect: user role is', user.role);
          setTimeout(() => {
            if (user.role === "client") {
              console.log('Redirecting client to /client-portal');
              window.location.href = "/client-portal";
            } else if (user.role === "staff" || user.role === "super_admin") {
              console.log('Redirecting staff to /dashboard');
              window.location.href = "/dashboard";
            } else {
              window.location.href = "/";
            }
          }, 100);
        } else {
          throw new Error("User profile not found in database");
        }
      } else {
        throw new Error("No user returned from authentication");
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    // Redirect to home page after logout
    window.location.href = "/";
  };

  const signOut = logout; // Alias for consistency

  return (
    <AuthContext.Provider value={{ user, login, logout, signOut, isLoading: isLoading || !hasCheckedAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
