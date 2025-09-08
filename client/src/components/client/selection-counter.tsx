import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Heart,
  Package,
  ShoppingCart,
  AlertTriangle,
  CheckCircle,
  Plus
} from 'lucide-react';

interface SelectionCounterProps {
  currentSelections: number;
  limit: number;
  totalAllowed: number;
  onUpgrade?: () => void;
  upgradeOptions?: {
    bundle5Price: string;
    bundle10Price: string;
    unlimitedPrice: string;
  };
  className?: string;
}

export function SelectionCounter({
  currentSelections,
  limit,
  totalAllowed,
  onUpgrade,
  upgradeOptions,
  className = ''
}: SelectionCounterProps) {
  const percentage = Math.min((currentSelections / limit) * 100, 100);
  const isAtLimit = currentSelections >= limit;
  const isNearLimit = currentSelections >= limit * 0.8; // 80% of limit
  const remainingSelections = Math.max(0, limit - currentSelections);
  const hasUpgraded = totalAllowed > limit;

  return (
    <Card className={`sticky top-4 z-10 border-2 ${isAtLimit ? 'border-red-500/50 bg-red-500/10' : isNearLimit ? 'border-yellow-500/50 bg-yellow-500/10' : 'border-green-500/50 bg-green-500/10'} ${className}`}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className={`w-5 h-5 ${isAtLimit ? 'text-red-500' : 'text-pink-500'}`} />
              <h3 className="font-semibold text-lg">Image Selection</h3>
            </div>
            {hasUpgraded && (
              <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">
                <Package className="w-3 h-3 mr-1" />
                Upgraded
              </Badge>
            )}
          </div>

          {/* Progress Section */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Selected: {currentSelections} of {totalAllowed} images
              </span>
              <span className={`text-sm font-medium ${isAtLimit ? 'text-red-500' : isNearLimit ? 'text-yellow-500' : 'text-green-500'}`}>
                {Math.round(percentage)}%
              </span>
            </div>
            <Progress 
              value={percentage} 
              className={`h-3 ${isAtLimit ? 'progress-red' : isNearLimit ? 'progress-yellow' : 'progress-green'}`}
            />
          </div>

          {/* Status Messages */}
          <div className="space-y-2">
            {currentSelections === 0 && (
              <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <Heart className="w-4 h-4 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-500">Start Selecting</p>
                  <p className="text-xs text-muted-foreground">
                    Click the heart icon on images to mark your favorites
                  </p>
                </div>
              </div>
            )}

            {currentSelections > 0 && !isAtLimit && (
              <div className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-500">
                    {remainingSelections} more images available
                  </p>
                  <p className="text-xs text-muted-foreground">
                    These will receive professional retouching
                  </p>
                </div>
              </div>
            )}

            {isAtLimit && !hasUpgraded && (
              <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-500">Selection Limit Reached</p>
                  <p className="text-xs text-muted-foreground">
                    You've selected the maximum number of included images
                  </p>
                </div>
              </div>
            )}

            {isAtLimit && hasUpgraded && currentSelections < totalAllowed && (
              <div className="flex items-start gap-2 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <Package className="w-4 h-4 text-purple-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-purple-500">
                    {totalAllowed - currentSelections} bonus images remaining
                  </p>
                  <p className="text-xs text-muted-foreground">
                    From your upgraded package
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Upgrade Options */}
          {upgradeOptions && onUpgrade && (isNearLimit || isAtLimit) && (
            <div className="space-y-3 pt-3 border-t border-border">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingCart className="w-4 h-4 text-cyan" />
                <span className="text-sm font-medium">Need more images?</span>
              </div>
              
              <div className="grid gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onUpgrade}
                  className="justify-between p-3 h-auto border-green-500/30 hover:border-green-500 hover:bg-green-500/10"
                >
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    <span>Add 5 Images</span>
                  </div>
                  <span className="text-green-500 font-semibold">
                    ${upgradeOptions.bundle5Price}
                  </span>
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onUpgrade}
                  className="justify-between p-3 h-auto border-blue-500/30 hover:border-blue-500 hover:bg-blue-500/10"
                >
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    <span>Add 10 Images</span>
                  </div>
                  <span className="text-blue-500 font-semibold">
                    ${upgradeOptions.bundle10Price}
                  </span>
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onUpgrade}
                  className="justify-between p-3 h-auto border-purple-500/30 hover:border-purple-500 hover:bg-purple-500/10"
                >
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    <span>Unlimited Selection</span>
                  </div>
                  <span className="text-purple-500 font-semibold">
                    ${upgradeOptions.unlimitedPrice}
                  </span>
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground text-center">
                Upgrade pricing will be finalized during checkout
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}