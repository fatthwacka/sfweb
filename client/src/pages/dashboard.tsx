import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTheme } from "@/components/ui/theme-provider";
import { Link } from "wouter";
import { 
  Camera, 
  Video, 
  Download, 
  Share2, 
  Heart, 
  Settings, 
  User, 
  Calendar,
  BarChart3,
  FileImage,
  Clock,
  Moon,
  Sun,
  Shield,
  Plus,
  Eye,
  MapPin,
  Palette
} from "lucide-react";
import { GalleryCustomization } from "@/components/gallery/gallery-customization";
import { GalleryPreview } from "@/components/gallery/gallery-preview";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UserStats {
  totalShoots: number;
  totalImages: number;
  totalViews: number;
  totalDownloads: number;
  favoriteImages: number;
}

interface RecentActivity {
  id: number;
  type: 'view' | 'download' | 'share' | 'favorite';
  shootTitle: string;
  timestamp: string;
}

interface Shoot {
  id: number;
  title: string;
  shootDate: string;
  location: string;
  isPrivate: boolean;
  viewCount: number;
  imageCount: number;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'overview' | 'galleries' | 'settings'>('overview');
  const [selectedShoot, setSelectedShoot] = useState<any>(null);
  const [selectedShootImages, setSelectedShootImages] = useState<any[]>([]);

  // Mock data - in production, these would be real API calls
  const userStats: UserStats = {
    totalShoots: 3,
    totalImages: 247,
    totalViews: 1284,
    totalDownloads: 89,
    favoriteImages: 12
  };

  const recentActivity: RecentActivity[] = [
    {
      id: 1,
      type: 'view',
      shootTitle: 'Wedding Album',
      timestamp: '2 hours ago'
    },
    {
      id: 2,
      type: 'download',
      shootTitle: 'Portrait Session',
      timestamp: '1 day ago'
    },
    {
      id: 3,
      type: 'share',
      shootTitle: 'Family Photos',
      timestamp: '3 days ago'
    }
  ];

  const userShoots: Shoot[] = [
    {
      id: 1,
      title: 'Wedding Day Photos',
      shootDate: '2024-01-15',
      location: 'Cape Town Vineyards',
      isPrivate: false,
      viewCount: 245,
      imageCount: 128
    },
    {
      id: 2,
      title: 'Engagement Session',
      shootDate: '2023-12-10',
      location: 'Camps Bay Beach',
      isPrivate: true,
      viewCount: 89,
      imageCount: 67
    },
    {
      id: 3,
      title: 'Family Portrait',
      shootDate: '2023-11-22',
      location: 'Studio Session',
      isPrivate: false,
      viewCount: 156,
      imageCount: 52
    }
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground background-gradient-blobs">
        <Navigation />
        <div className="pt-32 pb-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl mb-6">Access Required</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Please sign in to access your dashboard.
            </p>
            <Link href="/">
              <Button className="bg-gold text-black hover:bg-gold-muted">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'view': return <Eye className="w-4 h-4" />;
      case 'download': return <Download className="w-4 h-4" />;
      case 'share': return <Share2 className="w-4 h-4" />;
      case 'favorite': return <Heart className="w-4 h-4" />;
      default: return <Camera className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* SEO Meta Tags */}
      <title>Dashboard | SlyFox Studios</title>
      <meta name="description" content="Manage your photos, view galleries, and track your memories with SlyFox Studios dashboard." />
      
      <Navigation />
      
      {/* Header */}
      <section className="pt-32 pb-8 bg-gradient-to-br from-black via-charcoal to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="bg-salmon text-white text-xl font-bold">
                  {user.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl">
                  Welcome back, <span className="text-salmon">{user.email.split('@')[0]}</span>
                </h1>
                <p className="text-muted-foreground">
                  {user.role === 'staff' ? 'Staff Account' : 'Client Account'}
                </p>
              </div>
            </div>
            
            {user.role === 'staff' && (
              <Link href="/admin">
                <Button className="bg-salmon text-white hover:bg-salmon-muted">
                  <Shield className="w-4 h-4 mr-2" />
                  Admin Panel
                </Button>
              </Link>
            )}
          </div>
          
          {/* Tab Navigation */}
          <div className="mt-8 flex space-x-8 border-b border-border">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'galleries', label: 'My Galleries', icon: Camera },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 pb-4 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-salmon text-salmon'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 bg-gradient-to-br from-indigo-900/30 via-background to-purple-900/20 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
                <Card className="bg-purple-dark border border-salmon/30 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Albums</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-salmon">{userStats.totalShoots}</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-cyan-dark border border-cyan/30 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Photos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-cyan">{userStats.totalImages}</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-purple-dark border border-salmon/30 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Views</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-salmon">{userStats.totalViews.toLocaleString()}</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-cyan-dark border border-cyan/30 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Downloads</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-cyan">{userStats.totalDownloads}</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-purple-dark border border-salmon/30 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Favorites</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-salmon">{userStats.favoriteImages}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                {/* Recent Activity */}
                <Card className="bg-cyan-dark border border-cyan/30 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl text-cyan">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/10 transition-colors">
                          <div className="text-salmon">
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {activity.type === 'view' && 'Viewed'}
                              {activity.type === 'download' && 'Downloaded from'}
                              {activity.type === 'share' && 'Shared'}
                              {activity.type === 'favorite' && 'Favorited'}
                              {' '}{activity.shootTitle}
                            </p>
                            <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="bg-purple-dark border border-salmon/30 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl text-salmon">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <Button 
                        variant="outline" 
                        className="h-20 flex-col gap-2 border-salmon/30 text-salmon hover:border-salmon hover:bg-salmon hover:text-white"
                      >
                        <Camera className="w-6 h-6" />
                        <span className="text-sm">View All Albums</span>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="h-20 flex-col gap-2 border-cyan/30 text-cyan hover:border-cyan hover:bg-cyan hover:text-white"
                      >
                        <Heart className="w-6 h-6" />
                        <span className="text-sm">My Favorites</span>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="h-20 flex-col gap-2 border-salmon/30 text-salmon hover:border-salmon hover:bg-salmon hover:text-white"
                      >
                        <Download className="w-6 h-6" />
                        <span className="text-sm">Download History</span>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="h-20 flex-col gap-2 border-cyan/30 text-cyan hover:border-cyan hover:bg-cyan hover:text-white"
                      >
                        <Settings className="w-6 h-6" />
                        <span className="text-sm">Account Settings</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'galleries' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl">
                  My <span className="text-salmon">Galleries</span>
                </h2>
                <Button className="bg-salmon text-white hover:bg-salmon-muted">
                  <Plus className="w-4 h-4 mr-2" />
                  Request New Shoot
                </Button>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userShoots.map((shoot) => (
                  <Dialog key={shoot.id}>
                    <DialogTrigger asChild>
                      <Card className="bg-salmon-dark border border-salmon/30 hover:border-salmon shadow-lg transition-colors group cursor-pointer">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg font-saira font-bold text-salmon group-hover:text-salmon-muted transition-colors">
                                {shoot.title}
                              </CardTitle>
                              <div className="flex items-center gap-2 mt-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  {new Date(shoot.shootDate).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            {shoot.isPrivate && (
                              <Badge variant="secondary" className="bg-salmon/20 text-salmon border-salmon/30">
                                Private
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">{shoot.location}</span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <FileImage className="w-4 h-4 text-salmon" />
                                <span>{shoot.imageCount} photos</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Eye className="w-4 h-4 text-cyan" />
                                <span>{shoot.viewCount} views</span>
                              </div>
                            </div>
                            
                            <div className="flex gap-2 pt-2">
                              <Button size="sm" className="flex-1 bg-salmon text-white hover:bg-salmon-muted">
                                <Palette className="w-4 h-4 mr-2" />
                                Customize Gallery
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </DialogTrigger>
                    <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-saira font-bold">
                          {shoot.title} - Gallery Customization
                        </DialogTitle>
                        <DialogDescription>
                          Customize the appearance and layout of your photo gallery
                        </DialogDescription>
                      </DialogHeader>
                      
                      <Tabs defaultValue="customize" className="mt-6">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="customize">Customize</TabsTrigger>
                          <TabsTrigger value="preview">Preview</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="customize" className="mt-6">
                          <div className="grid lg:grid-cols-2 gap-6">
                            <GalleryCustomization 
                              shoot={{
                                ...shoot,
                                backgroundColor: shoot.backgroundColor || 'white',
                                layoutType: shoot.layoutType || 'masonry',
                                borderRadius: shoot.borderRadius || 8,
                                imagePadding: shoot.imagePadding || 4,
                              }}
                              images={[
                                // Mock images for now
                                { id: 1, filename: 'image1.jpg', storagePath: '/api/placeholder/400/600', sequence: 0, isPrivate: false, shootId: shoot.id, thumbnailPath: '', downloadCount: 0, createdAt: new Date() },
                                { id: 2, filename: 'image2.jpg', storagePath: '/api/placeholder/600/400', sequence: 1, isPrivate: false, shootId: shoot.id, thumbnailPath: '', downloadCount: 0, createdAt: new Date() },
                                { id: 3, filename: 'image3.jpg', storagePath: '/api/placeholder/400/500', sequence: 2, isPrivate: false, shootId: shoot.id, thumbnailPath: '', downloadCount: 0, createdAt: new Date() },
                                { id: 4, filename: 'image4.jpg', storagePath: '/api/placeholder/500/600', sequence: 3, isPrivate: false, shootId: shoot.id, thumbnailPath: '', downloadCount: 0, createdAt: new Date() },
                              ]}
                              onUpdate={(updatedShoot) => {
                                console.log('Gallery updated:', updatedShoot);
                              }}
                            />
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold">Live Preview</h3>
                              <div className="border rounded-lg overflow-hidden bg-muted/10 p-4 max-h-96 overflow-y-auto">
                                <GalleryPreview 
                                  shoot={{
                                    ...shoot,
                                    backgroundColor: shoot.backgroundColor || 'white',
                                    layoutType: shoot.layoutType || 'masonry',
                                    borderRadius: shoot.borderRadius || 8,
                                    imagePadding: shoot.imagePadding || 4,
                                  }}
                                  images={[
                                    { id: 1, filename: 'image1.jpg', storagePath: '/api/placeholder/400/600', sequence: 0, isPrivate: false, shootId: shoot.id, thumbnailPath: '', downloadCount: 0, createdAt: new Date() },
                                    { id: 2, filename: 'image2.jpg', storagePath: '/api/placeholder/600/400', sequence: 1, isPrivate: false, shootId: shoot.id, thumbnailPath: '', downloadCount: 0, createdAt: new Date() },
                                    { id: 3, filename: 'image3.jpg', storagePath: '/api/placeholder/400/500', sequence: 2, isPrivate: false, shootId: shoot.id, thumbnailPath: '', downloadCount: 0, createdAt: new Date() },
                                    { id: 4, filename: 'image4.jpg', storagePath: '/api/placeholder/500/600', sequence: 3, isPrivate: false, shootId: shoot.id, thumbnailPath: '', downloadCount: 0, createdAt: new Date() },
                                  ]}
                                  className="scale-75 origin-top-left transform"
                                />
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="preview" className="mt-6">
                          <div className="border rounded-lg overflow-hidden">
                            <GalleryPreview 
                              shoot={{
                                ...shoot,
                                backgroundColor: shoot.backgroundColor || 'white',
                                layoutType: shoot.layoutType || 'masonry',
                                borderRadius: shoot.borderRadius || 8,
                                imagePadding: shoot.imagePadding || 4,
                              }}
                              images={[
                                { id: 1, filename: 'image1.jpg', storagePath: '/api/placeholder/400/600', sequence: 0, isPrivate: false, shootId: shoot.id, thumbnailPath: '', downloadCount: 0, createdAt: new Date() },
                                { id: 2, filename: 'image2.jpg', storagePath: '/api/placeholder/600/400', sequence: 1, isPrivate: false, shootId: shoot.id, thumbnailPath: '', downloadCount: 0, createdAt: new Date() },
                                { id: 3, filename: 'image3.jpg', storagePath: '/api/placeholder/400/500', sequence: 2, isPrivate: false, shootId: shoot.id, thumbnailPath: '', downloadCount: 0, createdAt: new Date() },
                                { id: 4, filename: 'image4.jpg', storagePath: '/api/placeholder/500/600', sequence: 3, isPrivate: false, shootId: shoot.id, thumbnailPath: '', downloadCount: 0, createdAt: new Date() },
                                { id: 5, filename: 'image5.jpg', storagePath: '/api/placeholder/600/800', sequence: 4, isPrivate: false, shootId: shoot.id, thumbnailPath: '', downloadCount: 0, createdAt: new Date() },
                                { id: 6, filename: 'image6.jpg', storagePath: '/api/placeholder/500/400', sequence: 5, isPrivate: false, shootId: shoot.id, thumbnailPath: '', downloadCount: 0, createdAt: new Date() },
                              ]}
                            />
                          </div>
                        </TabsContent>
                      </Tabs>
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-8 max-w-2xl">
              <h2 className="text-3xl font-saira font-black">
                Account <span className="text-salmon">Settings</span>
              </h2>

              <div className="space-y-6">
                {/* Profile Settings */}
                <Card className="bg-black border-border">
                  <CardHeader>
                    <CardTitle className="text-xl font-saira font-bold text-salmon">Profile Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Email Address</label>
                      <p className="text-muted-foreground">{user.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Account Type</label>
                      <Badge variant={user.role === 'staff' ? 'default' : 'secondary'}>
                        {user.role === 'staff' ? 'Staff Member' : 'Client'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Theme Settings */}
                <Card className="bg-black border-border">
                  <CardHeader>
                    <CardTitle className="text-xl font-saira font-bold text-salmon">Appearance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Theme</p>
                        <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
                      </div>
                      <Button 
                        onClick={toggleTheme}
                        variant="outline"
                        size="sm"
                        className="border-border hover:border-salmon"
                      >
                        {theme === 'dark' ? (
                          <>
                            <Sun className="w-4 h-4 mr-2" />
                            Light Mode
                          </>
                        ) : (
                          <>
                            <Moon className="w-4 h-4 mr-2" />
                            Dark Mode
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Account Actions */}
                <Card className="bg-black border-border">
                  <CardHeader>
                    <CardTitle className="text-xl font-saira font-bold text-salmon">Account Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button 
                      onClick={signOut}
                      variant="outline" 
                      className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      Sign Out
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
