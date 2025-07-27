import { useAuth } from "@/hooks/use-auth";
import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { ClientPortal } from "@/components/client/client-portal";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function ClientDashboard() {
  const { user, isLoading, logout } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
    if (!isLoading && user && user.role !== "client") {
      setLocation("/dashboard");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-dark via-background to-grey-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-salmon mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "client") {
    return null;
  }

  // Debug logging
  console.log('ClientDashboard rendering for user:', user.email, user.role);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <div className="pt-20">
        {/* Client Portal Component handles everything */}
        <ClientPortal 
          userEmail={user.email} 
          userName={user.fullName} 
        />
      </div>
      <Footer />
    </div>
  );
}