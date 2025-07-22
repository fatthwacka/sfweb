import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/layout/navigation";
import { Link } from "wouter";
import { Shield } from "lucide-react";
import { AdminContent } from "@/components/admin/admin-content";

export default function Admin() {
  const { user } = useAuth();

  // Check if user has admin privileges
  if (!user || (user.role !== 'staff' && user.role !== 'super_admin')) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />
        <div className="pt-32 pb-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
            <h1 className="text-4xl font-saira font-black mb-6">Access Denied</h1>
            <p className="text-xl text-muted-foreground mb-8">
              You need staff or admin privileges to access this panel.
            </p>
            <Link href="/dashboard">
              <Button className="bg-gold text-black hover:bg-gold-muted">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* SEO Meta Tags */}
      <title>Admin Panel | SlyFox Studios</title>
      <meta name="description" content="SlyFox Studios admin panel for managing clients, shoots, and images." />
      
      <Navigation />
      
      {/* Header */}
      <section className="pt-32 pb-8 bg-gradient-to-br from-purple-dark via-background to-grey-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Shield className="w-12 h-12 icon-salmon" />
              <div>
                <h1 className="text-3xl font-saira font-black">
                  Admin <span className="text-salmon">Panel</span>
                </h1>
                <p className="text-muted-foreground">Manage clients, shoots, and content</p>
              </div>
            </div>
            
            <Link href="/dashboard">
              <Button variant="outline" className="border-salmon/30 text-salmon hover:border-salmon hover:bg-salmon hover:text-white">
                Back to Dashboard
              </Button>
            </Link>
          </div>
          
          <AdminContent userRole={user.role} />
        </div>
      </section>
    </div>
  );
}