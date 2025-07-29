import { useState, useEffect, createContext, useContext, ReactNode } from "react";

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
    // Check for existing session
    console.log('AuthProvider: Checking for saved user...');
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        console.log('AuthProvider: Found saved user:', parsedUser.email, parsedUser.role);
        setUser(parsedUser);
      } catch (error) {
        console.warn('Invalid saved user data, clearing...');
        localStorage.removeItem("user");
      }
    } else {
      console.log('AuthProvider: No saved user found');
    }
    setIsLoading(false);
    setHasCheckedAuth(true);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Invalid credentials");
      }

      const data = await response.json();
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
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
