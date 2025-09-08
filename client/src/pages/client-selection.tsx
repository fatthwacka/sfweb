import { useParams } from 'wouter';
import { Navigation } from '@/components/layout/navigation';
import { ClientSelectionDashboard } from '@/components/client/client-selection-dashboard';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { ArrowLeft, Lock } from 'lucide-react';

export default function ClientSelection() {
  const params = useParams() as { shootId?: string };
  const { user } = useAuth();
  const shootId = params?.shootId;

  // Check if user is logged in as a client
  if (!user || user.role !== 'client') {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />
        <div className="pt-32 pb-20">
          <div className="px-6 sm:px-8 lg:px-12 xl:px-16 text-center">
            <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
            <h1 className="text-4xl font-saira font-black mb-6">Access Required</h1>
            <p className="text-xl text-muted-foreground mb-8">
              You need to be logged in as a client to access image selection.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/login">
                <Button className="bg-salmon text-white hover:bg-salmon-muted">
                  Login
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline">
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!shootId) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />
        <div className="pt-32 pb-20">
          <div className="px-6 sm:px-8 lg:px-12 xl:px-16 text-center">
            <h1 className="text-4xl font-saira font-black mb-6">Invalid Selection Link</h1>
            <p className="text-xl text-muted-foreground mb-8">
              The image selection link appears to be invalid or incomplete.
            </p>
            <Link href="/client-portal">
              <Button className="bg-salmon text-white hover:bg-salmon-muted">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Client Portal
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      
      {/* Header */}
      <div className="pt-24 pb-6 bg-gradient-to-br from-purple-dark via-background to-grey-dark border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <Link href="/client-portal">
              <Button variant="outline" size="sm" className="border-salmon/30 text-salmon hover:border-salmon hover:bg-salmon hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Portal
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Selection Dashboard */}
      <ClientSelectionDashboard 
        shootId={shootId} 
        clientId={user.id} 
      />
    </div>
  );
}