import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from '@/lib/supabase';
import { supabaseOperations } from '@/lib/supabase-operations';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  role: "super_admin" | "staff" | "client" | "user";
  fullName?: string;
  profileImage?: string | null;
  themePreference?: string;
  subscriptionTier?: "free" | "pro" | "enterprise";
  emailVerifiedAt?: string | null;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing Supabase session
    console.log('AuthProvider: Checking for existing Supabase session...');
    
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error.message);
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          console.log('AuthProvider: Found Supabase session for:', session.user.email);
          
          // Get user profile from server API (follows Supabase best practices)
          try {
            const response = await fetch(`/api/user/profile/${session.user.id}`);
            
            if (response.ok) {
              const userProfile = await response.json();
              console.log('✅ Profile loaded successfully:', userProfile.role);
              
              // Use full profile data
              const fullUser: User = {
                id: userProfile.id,
                email: userProfile.email,
                role: userProfile.role as User['role'],
                fullName: userProfile.full_name || undefined,
                profileImage: userProfile.profile_image_url,
                themePreference: userProfile.theme_preference || undefined,
                subscriptionTier: userProfile.subscription_tier as User['subscriptionTier'] || 'free',
                emailVerifiedAt: userProfile.email_verified_at
              };
              setUser(fullUser);
            } else {
              console.warn('Could not fetch user profile, using basic auth data');
              // Use basic user data from auth
              const basicUser: User = {
                id: session.user.id,
                email: session.user.email!,
                role: 'user',
                fullName: session.user.user_metadata?.fullName
              };
              setUser(basicUser);
            }
          } catch (error) {
            console.error('Profile fetch error:', error);
            // Use basic user data from auth as fallback
            const basicUser: User = {
              id: session.user.id,
              email: session.user.email!,
              role: 'user',
              fullName: session.user.user_metadata?.fullName
            };
            setUser(basicUser);
          }
        } else {
          console.log('AuthProvider: No active session found');
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email);
        
        if (session?.user) {
          console.log('👤 Fetching profile for user ID:', session.user.id);
          
          try {
            console.log(`Fetching profile for user ID: ${session.user.id}`);
            
            // Get updated user profile from server API (follows Supabase best practices)
            const profileResponse = await fetch(`/api/user/profile/${session.user.id}`);
            
            if (profileResponse.ok) {
              const userProfile = await profileResponse.json();
              console.log('✅ Profile loaded in auth state change:', userProfile.role);
              const fullUser: User = {
                id: userProfile.id,
                email: userProfile.email,
                role: userProfile.role as User['role'],
                fullName: userProfile.full_name || undefined,
                profileImage: userProfile.profile_image_url,
                themePreference: userProfile.theme_preference || undefined,
                subscriptionTier: userProfile.subscription_tier as User['subscriptionTier'] || 'free',
                emailVerifiedAt: userProfile.email_verified_at
              };
              console.log('🎯 Setting full user:', fullUser);
              setUser(fullUser);
              setIsLoading(false);
            } else {
              console.warn('⚠️ Could not fetch user profile in auth state change');
              // Create basic user with auth data
              const basicUser: User = {
                id: session.user.id,
                email: session.user.email!,
                role: 'user',
                fullName: session.user.user_metadata?.fullName
              };
              console.log('🎭 Setting basic user:', basicUser);
              setUser(basicUser);
              setIsLoading(false);
            }
          } catch (error) {
            console.error('💥 Exception in profile fetch:', error);
            // Still set a basic user so login can proceed
            const basicUser: User = {
              id: session.user.id,
              email: session.user.email!,
              role: 'user',
              fullName: session.user.user_metadata?.fullName
            };
            console.log('🎭 Setting basic user (exception):', basicUser);
            setUser(basicUser);
            setIsLoading(false);
          }
        } else {
          console.log('🚪 No session, setting user to null');
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error("Login failed - no user returned");
      }

      console.log('Login successful for:', data.user.email);
      
      // Wait a moment for the onAuthStateChange to trigger and set user state
      // The onAuthStateChange listener will handle setting the user state
      console.log('Waiting for user state to be set...');
      
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, fullName: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            fullName: fullName
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error("Registration failed - no user returned");
      }

      console.log('Registration successful for:', data.user.email);

      // The profile should be created automatically by the trigger
      // But in case it fails, we can try to create it manually
      console.log('Profile should be created automatically by trigger');

      // User state will be updated via onAuthStateChange listener
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error.message);
      }
      
      // Clear user state immediately
      setUser(null);
      
      // Redirect to home page after logout
      window.location.href = "/";
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear state and redirect even if API call fails
      setUser(null);
      window.location.href = "/";
    }
  };

  const signOut = logout; // Alias for consistency

  return (
    <AuthContext.Provider value={{ user, login, register, logout, signOut, isLoading }}>
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
