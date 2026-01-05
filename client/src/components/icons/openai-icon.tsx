/**
 * OpenAI/ChatGPT Brand Icon
 * Official ChatGPT logo image
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface OpenAIIconProps {
  className?: string;
  size?: number;
}

export const OpenAIIcon: React.FC<OpenAIIconProps> = ({ 
  className = "", 
  size 
}) => {
  return (
    <img
      src="/images/logos/ChatGPT-Logo.png"
      alt="ChatGPT"
      className={cn(className)}
    />
  );
};