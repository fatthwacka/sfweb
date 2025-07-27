import { useAuth } from "@/hooks/use-auth";
import { ClientPortal } from "@/components/client/client-portal";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function ClientDashboard() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  // Debug logging
  console.log('ClientDashboard - User:', user?.email, 'Role:', user?.role);

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

  return (
    <ClientPortal 
      userEmail={user.email} 
      userName={user.fullName}
    />
  );
}