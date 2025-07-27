import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ImageUrl } from "@/lib/image-utils";
import { useAuth } from "@/hooks/use-auth";
import { 
  Camera, 
  Calendar, 
  MapPin, 
  Eye, 
  Download, 
  Search,
  Heart,
  Share2,
  Filter,
  Grid3X3,
  List,
  LogOut,
  User
} from "lucide-react";

interface Shoot {
  id: string;
  title: string;
  description: string;
  shootType: string;
  shootDate: string;
  location: string;
  customTitle: string;
  viewCount: number;
  isPrivate: boolean;
  createdAt: string;
}

interface Image {
  id: string;
  shootId: string;
  filename: string;
  storagePath: string;
  originalName: string;
  sequence: number;
  downloadCount: number;
  createdAt: string;
}

interface ClientPortalProps {
  userEmail: string;
  userName?: string;
}

export function ClientPortal({ userEmail, userName }: ClientPortalProps) {
  const { logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedShoot, setSelectedShoot] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<string>('all');

  // Fetch client's shoots based on email
  const { data: shoots = [], isLoading: shootsLoading } = useQuery<Shoot[]>({
    queryKey: ["/api/client/shoots"],
    queryFn: () => fetch(`/api/client/shoots?email=${encodeURIComponent(userEmail)}`).then(res => res.json()),
  });

  // Fetch images for selected shoot
  const { data: images = [], isLoading: imagesLoading } = useQuery<Image[]>({
    queryKey: ["/api/shoots", selectedShoot, "images"],
    queryFn: () => fetch(`/api/shoots/${selectedShoot}/images`).then(res => res.json()),
    enabled: !!selectedShoot,
  });

  const filteredShoots = shoots.filter(shoot => {
    const matchesSearch = shoot.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shoot.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shoot.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || shoot.shootType === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const uniqueShootTypes = Array.from(new Set(shoots.map(shoot => shoot.shootType)));

  const handleDownloadImage = async (image: Image) => {
    try {
      // Use full resolution URL for downloads
      const response = await fetch(ImageUrl.forFullSize(image.storagePath));
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = image.originalName || image.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleViewFullRes = (image: Image) => {
    // Open full resolution image in new tab
    window.open(ImageUrl.forFullSize(image.storagePath), '_blank');
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getShootTypeColor = (type: string) => {
    const colors = {
      'wedding': 'bg-pink-500',
      'portrait': 'bg-blue-500',
      'commercial': 'bg-green-500',
      'event': 'bg-purple-500',
      'lifestyle': 'bg-cyan-500',
      'other': 'bg-gray-500'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500';
  };

  if (shootsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-dark via-background to-grey-dark flex items-center justify-center">
        <div className="text-center">
          <Camera className="w-12 h-12 text-salmon mx-auto mb-4 animate-pulse" />
          <p className="text-lg text-muted-foreground">Loading your galleries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-dark via-background to-grey-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header with User Menu */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-saira font-bold text-salmon mb-2">
                Welcome back{userName ? `, ${userName}` : ''}
              </h1>
              <p className="text-muted-foreground">
                Access your private galleries and download your photos
              </p>
            </div>
            
            {/* User Menu */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-background/50 rounded-lg border border-border">
                <User className="w-4 h-4 text-cyan" />
                <span className="text-sm">{userEmail}</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={logout}
                className="border-border hover:border-salmon"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-cyan" />
              <span>{shoots.length} galleries available</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-salmon" />
              <span>{shoots.reduce((total, shoot) => total + shoot.viewCount, 0)} total views</span>
            </div>
          </div>
        </div>

        {/* Gallery Selection */}
        {!selectedShoot && (
          <>
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search your galleries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 bg-background border border-border rounded-md text-sm"
                >
                  <option value="all">All Types</option>
                  {uniqueShootTypes.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  className="border-border hover:border-salmon"
                >
                  {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Shoots Grid/List */}
            {filteredShoots.length === 0 ? (
              <Card className="admin-gradient-card">
                <CardContent className="p-8 text-center">
                  <Camera className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Galleries Found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || filterType !== 'all' 
                      ? 'Try adjusting your search or filter settings.'
                      : 'Your photographer will share galleries with you soon.'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className={viewMode === 'grid' 
                ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6" 
                : "space-y-4"
              }>
                {filteredShoots.map(shoot => (
                  <Card 
                    key={shoot.id} 
                    className="admin-gradient-card hover:border-salmon transition-colors cursor-pointer"
                    onClick={() => setSelectedShoot(shoot.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-salmon text-lg">
                            {shoot.customTitle || shoot.title}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge className={`${getShootTypeColor(shoot.shootType)} text-white text-xs`}>
                              {shoot.shootType}
                            </Badge>
                            {shoot.isPrivate && (
                              <Badge variant="outline" className="text-xs">
                                Private
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3">
                      {shoot.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {shoot.description}
                        </p>
                      )}
                      
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 icon-cyan" />
                          {formatDate(shoot.shootDate)}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 icon-salmon" />
                          {shoot.location}
                        </div>
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 icon-cyan" />
                          {shoot.viewCount} views
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full bg-salmon text-white hover:bg-salmon-muted"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedShoot(shoot.id);
                        }}
                      >
                        View Gallery
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Image Gallery View */}
        {selectedShoot && (
          <div className="space-y-6">
            {/* Gallery Header */}
            <div className="flex justify-between items-center">
              <Button 
                variant="outline"
                onClick={() => setSelectedShoot(null)}
                className="border-border hover:border-salmon"
              >
                ← Back to Galleries
              </Button>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="border-border hover:border-cyan">
                  <Heart className="w-4 h-4 mr-2" />
                  Favorites
                </Button>
                <Button variant="outline" size="sm" className="border-border hover:border-salmon">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            {/* Current Shoot Info */}
            {(() => {
              const currentShoot = shoots.find(s => s.id === selectedShoot);
              return currentShoot ? (
                <Card className="admin-gradient-card">
                  <CardContent className="p-6">
                    <h2 className="text-2xl font-saira font-bold text-salmon mb-2">
                      {currentShoot.customTitle || currentShoot.title}
                    </h2>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 icon-cyan" />
                        {formatDate(currentShoot.shootDate)}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 icon-salmon" />
                        {currentShoot.location}
                      </div>
                      <div className="flex items-center gap-2">
                        <Camera className="w-4 h-4 icon-cyan" />
                        {images.length} photos
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : null;
            })()}

            {/* Images Grid */}
            {imagesLoading ? (
              <div className="text-center py-8">
                <div className="animate-pulse">Loading images...</div>
              </div>
            ) : images.length === 0 ? (
              <Card className="admin-gradient-card">
                <CardContent className="p-8 text-center">
                  <Camera className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Images Yet</h3>
                  <p className="text-muted-foreground">
                    Images are being processed and will appear here soon.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {images.map(image => (
                  <Card key={image.id} className="admin-gradient-card group overflow-hidden">
                    <div className="relative aspect-square">
                      <img
                        src={ImageUrl.forViewing(image.storagePath)}
                        alt={image.originalName || image.filename}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleViewFullRes(image)}
                            className="bg-purple-600 text-white hover:bg-purple-700"
                            title="View Full Resolution"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleDownloadImage(image)}
                            className="bg-salmon text-white hover:bg-salmon-muted"
                            title="Download Original"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="bg-cyan text-black hover:bg-cyan-muted"
                            title="Add to Favorites"
                          >
                            <Heart className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>{image.originalName || image.filename}</span>
                        <div className="flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          {image.downloadCount}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}