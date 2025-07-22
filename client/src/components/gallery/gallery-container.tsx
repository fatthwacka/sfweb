import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette } from "lucide-react";
import { GalleryCustomization } from "./gallery-customization";
import { GalleryPreview } from "./gallery-preview";
import type { Shoot, Image } from "@shared/schema";

interface GalleryContainerProps {
  shoot: Shoot;
}

export function GalleryContainer({ shoot }: GalleryContainerProps) {
  const queryClient = useQueryClient();
  
  // Fetch images for this shoot
  const { data: shootData, isLoading } = useQuery({
    queryKey: ["/api/shoots", shoot.id],
    queryFn: async () => {
      const response = await fetch(`/api/shoots/${shoot.id}`);
      if (!response.ok) throw new Error("Failed to fetch shoot");
      return response.json();
    }
  });

  const images: Image[] = shootData?.images || [];
  const fullShoot: Shoot = shootData?.shoot || shoot;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-salmon"></div>
      </div>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" className="flex-1 bg-salmon text-white hover:bg-salmon-muted">
          <Palette className="w-4 h-4 mr-2" />
          Customize Gallery
        </Button>
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
                shoot={fullShoot}
                images={images}
                onUpdate={(updatedShoot) => {
                  queryClient.invalidateQueries({ queryKey: ["/api/shoots", shoot.id] });
                  queryClient.invalidateQueries({ queryKey: ["/api/shoots"] });
                }}
              />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Live Preview</h3>
                <div className="border rounded-lg overflow-hidden bg-muted/10 p-4 max-h-96 overflow-y-auto">
                  <GalleryPreview 
                    shoot={fullShoot}
                    images={images}
                    className="scale-75 origin-top-left transform"
                  />
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="preview" className="mt-6">
            <div className="border rounded-lg overflow-hidden">
              <GalleryPreview 
                shoot={fullShoot}
                images={images}
              />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}