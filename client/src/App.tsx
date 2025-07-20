import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { initGA } from "./lib/analytics";
import { useAnalytics } from "./hooks/use-analytics";
import { useScrollToTop } from "./hooks/use-scroll-to-top";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProvider } from "@/lib/auth";

// Pages
import Home from "@/pages/home";
import Photography from "@/pages/photography";
import PhotographyCategory from "@/pages/photography-category";
import Videography from "@/pages/videography";
import VideographyCategory from "@/pages/videography-category";
import About from "@/pages/about";
import Pricing from "@/pages/pricing";
import Contact from "@/pages/contact";
import ClientGallery from "@/pages/client-gallery";
import Dashboard from "@/pages/dashboard";
import Admin from "@/pages/admin";
import MyGallery from "@/pages/my-gallery";
import NotFound from "@/pages/not-found";

function Router() {
  // Track page views when routes change
  useAnalytics();
  // Auto scroll to top on route change
  useScrollToTop();
  
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/photography" component={Photography} />
      <Route path="/photography/:category" component={PhotographyCategory} />
      <Route path="/videography" component={Videography} />
      <Route path="/videography/:category" component={VideographyCategory} />
      <Route path="/about" component={About} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/contact" component={Contact} />
      <Route path="/clients/:slug" component={ClientGallery} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/admin" component={Admin} />
      <Route path="/my-gallery" component={MyGallery} />
      <Route path="/gallery/:slug" component={MyGallery} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Initialize Google Analytics when app loads
  useEffect(() => {
    // Verify required environment variable is present
    if (!import.meta.env.VITE_GA_MEASUREMENT_ID) {
      console.warn('Missing required Google Analytics key: VITE_GA_MEASUREMENT_ID');
    } else {
      initGA();
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
