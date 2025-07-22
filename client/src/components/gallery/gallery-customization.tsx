import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Palette, Grid, RotateCcw, Move, Save } from "lucide-react";
import type { Shoot, Image, UpdateShootCustomization } from "@shared/schema";

interface GalleryCustomizationProps {
  shoot: Shoot;
  images: Image[];
  onUpdate?: (updatedShoot: Shoot) => void;
}

export function GalleryCustomization({ shoot, images, onUpdate }: GalleryCustomizationProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [settings, setSettings] = useState<UpdateShootCustomization>({
    albumCoverId: shoot.albumCoverId || undefined,
    backgroundColor: shoot.backgroundColor,
    layoutType: shoot.layoutType,
    borderRadius: shoot.borderRadius,
    imagePadding: shoot.imagePadding,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateShootCustomization) => {
      const response = await fetch(`/api/shoots/${shoot.id}/customization`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update customization");
      return response.json();
    },
    onSuccess: (updatedShoot) => {
      toast({
        title: "Gallery Updated",
        description: "Your gallery customization has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/shoots", shoot.id] });
      onUpdate?.(updatedShoot);
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "There was an error updating your gallery settings.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate(settings);
  };

  const backgroundOptions = [
    { value: "white", label: "White", preview: "#ffffff" },
    { value: "black", label: "Black", preview: "#000000" },
    { value: "dark-grey", label: "Dark Grey", preview: "#374151" },
  ];

  const layoutOptions = [
    { value: "masonry", label: "Masonry Layout", description: "Natural image proportions with varied heights" },
    { value: "square", label: "Square Grid", description: "Uniform squares with cropped center focus" },
  ];

  return (
    <Card className="bg-card border border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-salmon" />
          Gallery Customization
        </CardTitle>
        <CardDescription>
          Customize the appearance and layout of your photo gallery
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Cover Image Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Cover Image</Label>
          <Select
            value={settings.albumCoverId?.toString() || ""}
            onValueChange={(value) => 
              setSettings(prev => ({ ...prev, albumCoverId: value ? parseInt(value) : undefined }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a cover image" />
            </SelectTrigger>
            <SelectContent>
              {images.map((image) => (
                <SelectItem key={image.id} value={image.id.toString()}>
                  {image.filename}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Background Color */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Background Color</Label>
          <div className="grid grid-cols-3 gap-2">
            {backgroundOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSettings(prev => ({ ...prev, backgroundColor: option.value }))}
                className={`
                  p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2
                  ${settings.backgroundColor === option.value 
                    ? 'border-salmon shadow-md' 
                    : 'border-border hover:border-salmon/50'
                  }
                `}
              >
                <div 
                  className="w-8 h-8 rounded border border-border" 
                  style={{ backgroundColor: option.preview }}
                />
                <span className="text-sm">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Layout Type */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Grid className="w-4 h-4" />
            Layout Type
          </Label>
          <div className="space-y-2">
            {layoutOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSettings(prev => ({ ...prev, layoutType: option.value }))}
                className={`
                  w-full p-3 rounded-lg border-2 transition-all duration-200 text-left
                  ${settings.layoutType === option.value 
                    ? 'border-salmon bg-salmon/5' 
                    : 'border-border hover:border-salmon/50 hover:bg-salmon/5'
                  }
                `}
              >
                <div className="font-medium">{option.label}</div>
                <div className="text-sm text-muted-foreground mt-1">{option.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Border Radius */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <RotateCcw className="w-4 h-4" />
            Corner Roundness: {settings.borderRadius}px
          </Label>
          <Slider
            value={[settings.borderRadius || 8]}
            onValueChange={([value]) => setSettings(prev => ({ ...prev, borderRadius: value }))}
            max={30}
            min={0}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Sharp (0px)</span>
            <span>Rounded (30px)</span>
          </div>
        </div>

        {/* Image Padding */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Move className="w-4 h-4" />
            Image Spacing: {settings.imagePadding}px
          </Label>
          <Slider
            value={[settings.imagePadding || 4]}
            onValueChange={([value]) => setSettings(prev => ({ ...prev, imagePadding: value }))}
            max={30}
            min={1}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Tight (1px)</span>
            <span>Spacious (30px)</span>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-border">
          <Button 
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="w-full bg-salmon hover:bg-salmon-muted text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}