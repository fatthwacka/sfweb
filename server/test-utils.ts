// Test utilities to avoid damaging production images
import fs from 'fs/promises';
import path from 'path';

export async function createDummyTestImage(): Promise<Buffer> {
  // Create a simple test image placeholder
  // This could be a minimal PNG or copy of an existing safe test file
  const testImagePath = path.join(process.cwd(), 'public', 'images', 'placeholder.png');
  
  try {
    return await fs.readFile(testImagePath);
  } catch {
    // If no placeholder exists, create minimal test data
    return Buffer.from('dummy-image-data-for-testing');
  }
}

export function validateImageUpload(filename: string, size: number): boolean {
  // Basic validation to prevent accidental overwriting with wrong files
  if (size < 10000) {
    console.warn('⚠️  Image too small, possibly not a real image');
    return false;
  }
  
  if (size > 10 * 1024 * 1024) {
    console.warn('⚠️  Image too large');
    return false;
  }
  
  return true;
}