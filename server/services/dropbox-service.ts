// Using native fetch available in Node.js 18+

export interface DropboxFile {
  name: string;
  path_lower: string;
  path_display: string;
  id: string;
  size?: number;
  server_modified?: string;
  is_downloadable?: boolean;
}

interface DropboxListResponse {
  entries: DropboxFile[];
  cursor: string;
  has_more: boolean;
}

interface DropboxTempLinkResponse {
  link: string;
  metadata: DropboxFile;
}

class DropboxService {
  private accessToken: string;
  private apiBase = 'https://api.dropboxapi.com/2';
  private contentBase = 'https://content.dropboxapi.com/2';

  constructor() {
    this.accessToken = process.env.DROPBOX_ACCESS_TOKEN || '';
    console.log(`🔑 Dropbox token configured: ${this.accessToken ? 'YES' : 'NO'} (ends with: ${this.accessToken.slice(-10)})`);
    if (!this.accessToken) {
      console.warn('Dropbox access token not configured. Preview features will be limited.');
    }
  }

  /**
   * List files in a Dropbox folder
   */
  async listFiles(folderPath: string): Promise<DropboxFile[]> {
    if (!this.accessToken) {
      throw new Error('Dropbox access token not configured');
    }

    try {
      const response = await fetch(`${this.apiBase}/files/list_folder`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: folderPath,
          recursive: false,
          include_media_info: true,
          include_deleted: false,
          include_has_explicit_shared_members: false,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Dropbox API error: ${error}`);
      }

      const data = (await response.json()) as DropboxListResponse;
      
      // Filter only image files
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
      const imageFiles = data.entries.filter(file => 
        imageExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
      );

      // If there are more files, fetch them
      let allFiles = [...imageFiles];
      let cursor = data.cursor;
      let hasMore = data.has_more;

      while (hasMore) {
        const moreResponse = await fetch(`${this.apiBase}/files/list_folder/continue`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ cursor }),
        });

        if (!moreResponse.ok) {
          break;
        }

        const moreData = (await moreResponse.json()) as DropboxListResponse;
        const moreImages = moreData.entries.filter(file => 
          imageExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
        );
        allFiles = [...allFiles, ...moreImages];
        cursor = moreData.cursor;
        hasMore = moreData.has_more;
      }

      return allFiles;
    } catch (error) {
      console.error('Error listing Dropbox files:', error);
      throw error;
    }
  }

  /**
   * List files from a shared link using the proper sharing API
   */
  async listFilesFromSharedLink(sharedLink: string): Promise<DropboxFile[]> {
    if (!this.accessToken) {
      throw new Error('Dropbox access token not configured');
    }

    try {
      console.log('Listing files from shared link:', sharedLink);
      
      // Use the files/list_folder endpoint with shared_link parameter for shared links
      const response = await fetch(`${this.apiBase}/files/list_folder`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: "", // Start at root of shared folder
          recursive: false,
          include_media_info: true,
          include_deleted: false,
          shared_link: {
            url: sharedLink,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Dropbox sharing/list_folder error:', error);
        throw new Error(`Dropbox API error: ${error}`);
      }

      const data = (await response.json()) as DropboxListResponse;
      console.log('Shared folder contents:', data.entries.length, 'entries found');
      
      // Filter only image files
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
      const imageFiles = data.entries.filter(file => 
        imageExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
      );

      console.log('Image files found:', imageFiles.length);
      console.log('First few image files (debug):', imageFiles.slice(0, 2).map(f => ({ name: f.name, path_display: f.path_display, id: f.id })));

      // If there are more files, fetch them
      let allFiles = [...imageFiles];
      let cursor = data.cursor;
      let hasMore = data.has_more;

      while (hasMore) {
        const moreResponse = await fetch(`${this.apiBase}/files/list_folder/continue`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            cursor,
          }),
        });

        if (!moreResponse.ok) {
          console.warn('Failed to get more files from shared folder');
          break;
        }

        const moreData = (await moreResponse.json()) as DropboxListResponse;
        const moreImages = moreData.entries.filter(file => 
          imageExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
        );
        allFiles = [...allFiles, ...moreImages];
        cursor = moreData.cursor;
        hasMore = moreData.has_more;
        
        console.log('Additional images loaded, total now:', allFiles.length);
      }

      console.log('Final image count from shared link:', allFiles.length);
      return allFiles;
    } catch (error) {
      console.error('Error listing Dropbox files from shared link:', error);
      throw error;
    }
  }

  /**
   * Get a temporary download link for a file (valid for 4 hours)
   */
  async getTemporaryLink(filePath: string): Promise<string> {
    if (!this.accessToken) {
      throw new Error('Dropbox access token not configured');
    }

    try {
      const response = await fetch(`${this.apiBase}/files/get_temporary_link`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path: filePath }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Dropbox API error: ${error}`);
      }

      const data = (await response.json()) as DropboxTempLinkResponse;
      return data.link;
    } catch (error) {
      console.error('Error getting temporary link:', error);
      throw error;
    }
  }

  /**
   * Download file directly from Dropbox
   */
  async downloadFile(filePath: string): Promise<Buffer> {
    if (!this.accessToken) {
      throw new Error('Dropbox access token not configured');
    }

    try {
      const response = await fetch(`${this.contentBase}/files/download`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Dropbox-API-Arg': JSON.stringify({ path: filePath }),
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Dropbox download error: ${error}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  /**
   * Download file from shared link (using sharing/get_shared_link_file endpoint)
   */
  async downloadFileFromSharedLink(sharedLink: string, filePath: string): Promise<Buffer> {
    if (!this.accessToken) {
      throw new Error('Dropbox access token not configured');
    }

    try {
      console.log(`📥 Downloading shared link file: ${filePath}`);
      
      // Use the sharing/get_shared_link_file endpoint for shared links
      const response = await fetch(`${this.contentBase}/sharing/get_shared_link_file`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Dropbox-API-Arg': JSON.stringify({
            url: sharedLink,
            path: filePath
          }),
        },
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`❌ Shared link download failed for ${filePath}:`, error);
        throw new Error(`Dropbox shared link download error: ${error}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      console.log(`✅ Downloaded ${filePath}: ${buffer.length} bytes`);
      return buffer;
    } catch (error) {
      console.error('Error downloading file from shared link:', error);
      throw error;
    }
  }

  /**
   * Get temporary link (updated to handle shared links)
   */
  async getTemporaryLink(sharedLink: string, filePath: string): Promise<string | null> {
    // For shared links, we should use downloadFileFromSharedLink method
    // Return null to indicate we should use the proper shared link download method
    return null;
  }

  /**
   * Get temporary link from a shared link file
   */
  async getTemporaryLinkFromSharedLink(sharedLink: string, filePath: string): Promise<string> {
    if (!this.accessToken) {
      throw new Error('Dropbox access token not configured');
    }

    try {
      console.log('Getting temporary link for shared file:', filePath);
      
      // For shared links, we can't use get_temporary_link API with shared_link parameter
      // Instead, construct a direct download link from the shared link
      const linkBase = sharedLink.replace('?dl=0', '').replace('&dl=0', '');
      const fileName = filePath.split('/').pop() || '';
      const directLink = `${linkBase}/${encodeURIComponent(fileName)}?dl=1`;
      
      console.log('Constructed direct link for:', filePath);
      return directLink;
    } catch (error) {
      console.error('Error constructing direct link from shared link:', error);
      console.error('File path that failed:', filePath);
      
      // Final fallback: construct a basic direct download link
      const linkBase = sharedLink.replace('?dl=0', '').replace('&dl=0', '');
      const fileName = filePath.split('/').pop() || '';
      return `${linkBase}/${encodeURIComponent(fileName)}?dl=1`;
    }
  }

  /**
   * Get thumbnail from a shared link file
   */
  async getThumbnailFromSharedLink(sharedLink: string, filePath: string, size: 'w32h32' | 'w64h64' | 'w128h128' | 'w256h256' = 'w256h256'): Promise<string> {
    if (!this.accessToken) {
      throw new Error('Dropbox access token not configured');
    }

    try {
      console.log('Getting thumbnail for shared file:', filePath, 'size:', size);
      
      const response = await fetch(`${this.contentBase}/files/get_thumbnail_v2`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Dropbox-API-Arg': JSON.stringify({
            resource: { 
              '.tag': 'link',
              url: sharedLink,
              path: filePath
            },
            format: 'jpeg',
            size: { '.tag': size },
            mode: 'strict',
          }),
        },
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Error getting thumbnail from shared link:', error);
        console.error('Response status:', response.status, 'for file:', filePath);
        
        // Fallback to temporary link if thumbnail fails
        return this.getTemporaryLinkFromSharedLink(sharedLink, filePath);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');
      console.log('Successfully got thumbnail for:', filePath);
      return `data:image/jpeg;base64,${base64}`;
    } catch (error) {
      console.error('Error getting thumbnail from shared link:', error);
      console.error('File path that failed:', filePath);
      // Fallback to temporary link
      return this.getTemporaryLinkFromSharedLink(sharedLink, filePath);
    }
  }

  /**
   * Get thumbnail for an image (returns base64 encoded thumbnail)
   */
  async getThumbnail(filePath: string, size: 'w32h32' | 'w64h64' | 'w128h128' | 'w256h256' = 'w256h256'): Promise<string> {
    if (!this.accessToken) {
      throw new Error('Dropbox access token not configured');
    }

    try {
      const response = await fetch(`${this.contentBase}/files/get_thumbnail_v2`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Dropbox-API-Arg': JSON.stringify({
            resource: { '.tag': 'path', path: filePath },
            format: 'jpeg',
            size: { '.tag': size },
            mode: 'strict',
          }),
        },
      });

      if (!response.ok) {
        // Fallback to temporary link if thumbnail fails
        return this.getTemporaryLink(filePath);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');
      return `data:image/jpeg;base64,${base64}`;
    } catch (error) {
      console.error('Error getting thumbnail:', error);
      // Fallback to temporary link
      return this.getTemporaryLink(filePath);
    }
  }

  /**
   * Convert a shared link to direct download link
   */
  convertSharedLink(sharedLink: string): string {
    // Convert Dropbox shared links to direct download links
    // Change ?dl=0 to ?raw=1 for direct access
    return sharedLink.replace('?dl=0', '?raw=1').replace('www.dropbox.com', 'dl.dropboxusercontent.com');
  }

  /**
   * Parse folder path from shared link (if possible)
   */
  parseFolderFromLink(sharedLink: string): string | null {
    // Extract folder path from shared link if available
    const match = sharedLink.match(/\/sh\/[^/]+\/([^?]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  /**
   * Batch get temporary links for multiple files
   */
  async getBatchTemporaryLinks(filePaths: string[]): Promise<Map<string, string>> {
    if (!this.accessToken) {
      throw new Error('Dropbox access token not configured');
    }

    const links = new Map<string, string>();
    
    // Process in batches of 10 to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < filePaths.length; i += batchSize) {
      const batch = filePaths.slice(i, i + batchSize);
      const promises = batch.map(path => 
        this.getTemporaryLink(path)
          .then(link => ({ path, link }))
          .catch(() => ({ path, link: null }))
      );
      
      const results = await Promise.all(promises);
      results.forEach(result => {
        if (result.link) {
          links.set(result.path, result.link);
        }
      });
    }

    return links;
  }

  /**
   * Check if service is configured
   */
  isConfigured(): boolean {
    return !!this.accessToken;
  }
}

export const dropboxService = new DropboxService();