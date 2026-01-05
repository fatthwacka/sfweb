import React, { useEffect, useState, Component, ErrorInfo, ReactNode } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { initGA } from "./lib/analytics";
import { useAnalytics } from "./hooks/use-analytics";
import { useScrollToTop } from "./hooks/use-scroll-to-top";
import { useVisitorTracking } from "./hooks/use-visitor-tracking";
import { useMetricool } from "./hooks/use-metricool";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProvider } from "@/hooks/use-auth";

// Error Boundary Component
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-salmon mb-4">Something went wrong</h1>
            <p className="text-muted-foreground mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-salmon text-white px-4 py-2 rounded hover:bg-salmon-muted"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Pages
import Home from "@/pages/home";
import Photography from "@/pages/photography";
import PhotographyWeddings from "@/pages/photography-weddings";
import PhotographyPortraits from "@/pages/photography-portraits";
import PhotographyCorporate from "@/pages/photography-corporate";
import PhotographyEvents from "@/pages/photography-events";
import PhotographyProducts from "@/pages/photography-products";
import PhotographyGraduation from "@/pages/photography-graduation";
import UmhlangaPhotography from "@/pages/umhlanga-photography";
import Videography from "@/pages/videography";
import VideographyCategory from "@/pages/videography-category";
import About from "@/pages/about";
import Pricing from "@/pages/pricing";
import Contact from "@/pages/contact";
import SocialMedia from "@/pages/social-media";
import WebApps from "@/pages/web-apps";
import ClientGallery from "@/pages/client-gallery";
import { GalleryDemo } from "@/pages/gallery-demo";
import { Portfolio } from "@/pages/portfolio";
import { PortfolioGroup } from "@/pages/portfolio-group";
import Dashboard from "@/pages/dashboard";
import ClientDashboard from "@/pages/client-dashboard";
import Login from "@/pages/login";
import Admin from "@/pages/admin";
import { Stories } from "@/pages/stories";
import { Story } from "@/pages/story";
// Tools Hub
import ToolsHub from "@/pages/tools";
import FileRenamer from "@/pages/tools/file-renamer";
import BulkMover from "@/pages/tools/bulk-mover";
import DuplicateFinder from "@/pages/tools/duplicate-finder";
import SmartOrganiser from "@/pages/tools/smart-organiser";
import ProjectCleanup from "@/pages/tools/project-cleanup";
import ArticleEditor from "@/pages/tools/article-editor";
import AIImageGenerator from "@/pages/tools/ai-image-generator";
import PromptEngine from "@/pages/tools/prompt-engine";
import ContentTypesAdmin from "@/pages/tools/content-types-admin";
import BrandIntelligenceDashboardPage from "@/pages/brand-intelligence-dashboard";
import ClientControlCentrePage from "@/pages/client-control-centre";
// Removed old demo MyGallery - clients use /client-portal
import NotFound from "@/pages/not-found";

function Router() {
  // Track page views when routes change
  useAnalytics();
  // Track page views with Metricool
  useMetricool();
  // Auto scroll to top on route change
  useScrollToTop();
  // Track visitor sessions for admin dashboard
  useVisitorTracking();
  
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/photography" component={Photography} />
      <Route path="/photography/weddings" component={PhotographyWeddings} />
      <Route path="/photography/portraits" component={PhotographyPortraits} />
      <Route path="/photography/corporate" component={PhotographyCorporate} />
      <Route path="/photography/events" component={PhotographyEvents} />
      <Route path="/photography/products" component={PhotographyProducts} />
      <Route path="/photography/graduation" component={PhotographyGraduation} />
      {/* SEO Landing Pages - not in main navigation */}
      <Route path="/UmhlangaPhotography" component={UmhlangaPhotography} />
      <Route path="/videography" component={Videography} />
      <Route path="/videography/:category" component={VideographyCategory} />
      <Route path="/social-media" component={SocialMedia} />
      <Route path="/web-apps" component={WebApps} />
      <Route path="/about" component={About} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/contact" component={Contact} />
      <Route path="/stories" component={Stories} />
      <Route path="/stories/:slug" component={Story} />
      <Route path="/tools" component={ToolsHub} />
      <Route path="/tools/file-renamer" component={FileRenamer} />
      <Route path="/tools/bulk-mover" component={BulkMover} />
      <Route path="/tools/duplicate-finder" component={DuplicateFinder} />
      <Route path="/tools/smart-organiser" component={SmartOrganiser} />
      <Route path="/tools/project-cleanup" component={ProjectCleanup} />
      <Route path="/tools/article-editor" component={ArticleEditor} />
      <Route path="/tools/ai-image-generator" component={AIImageGenerator} />
      <Route path="/tools/prompt-engine" component={PromptEngine} />
      <Route path="/tools/content-types-admin" component={ContentTypesAdmin} />
      <Route path="/tools/brand-intelligence-dashboard" component={BrandIntelligenceDashboardPage} />
      <Route path="/tools/brand-intelligence/client/:clientId">
        {(params) => <ClientControlCentrePage params={params} />}
      </Route>
      <Route path="/gallery-demo" component={GalleryDemo} />
      <Route path="/portfolio" component={Portfolio} />
      <Route path="/project/:groupName" component={PortfolioGroup} />
      <Route path="/gallery/:slug">
        {(params) => <ClientGallery shootId={params.slug} />}
      </Route>
      <Route path="/login" component={Login} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/client-portal" component={ClientDashboard} />
      <Route path="/admin" component={Admin} />
      {/* Portfolio client slug route - /portfolio/client-slug */}
      <Route path="/portfolio/:slug">
        {(params) => {
          // This route handles client portfolios at /portfolio/client-slug
          // The PortfolioGroup component will handle both group and client slugs
          return React.createElement(PortfolioGroup);
        }}
      </Route>
      {/* Default catch-all */}
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
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <div className="min-h-screen bg-background text-foreground">
            <AuthProvider>
              <TooltipProvider>
                <Router />
                <Toaster />
              </TooltipProvider>
            </AuthProvider>
          </div>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
