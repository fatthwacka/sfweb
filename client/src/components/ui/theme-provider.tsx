import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [isThemeReady, setIsThemeReady] = useState(false);

  useEffect(() => {
    // Apply dark theme immediately on first load
    document.documentElement.classList.remove("light");
    document.documentElement.classList.add("dark");
    setIsThemeReady(true);
    
    // Then check localStorage
    const savedTheme = localStorage.getItem("slyfox-theme") as Theme;
    if (savedTheme && savedTheme !== theme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    // Update document class and localStorage when theme changes
    if (isThemeReady) {
      document.documentElement.classList.toggle("light", theme === "light");
      document.documentElement.classList.toggle("dark", theme === "dark");
      localStorage.setItem("slyfox-theme", theme);
    }
  }, [theme, isThemeReady]);

  const toggleTheme = () => {
    setTheme(prev => prev === "dark" ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
