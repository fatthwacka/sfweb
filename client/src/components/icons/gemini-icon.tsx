/**
 * Google Gemini Brand Icon
 * Official Google Gemini logo image
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface GeminiIconProps {
  className?: string;
  size?: number;
}

export const GeminiIcon: React.FC<GeminiIconProps> = ({ 
  className = "", 
  size 
}) => {
  return (
    <img
      src="/images/logos/Google_Gemini_logo.svg.png"
      alt="Google Gemini"
      className={cn(className)}
    />
  );
};