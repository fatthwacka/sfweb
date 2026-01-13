/**
 * Vertex AI VEO Video Generator Service
 * Handles AI-powered video generation using Google Vertex AI VEO models with proper service account authentication
 */

import { GoogleAuth } from 'google-auth-library';

export interface VideoGenerationRequest {
  prompt: string;
  model: string;
  resolution: string; // '720p' | '1080p'
  aspectRatio: string; // '16:9' | '9:16'
  duration: number; // 4 | 6 | 8
  sampleCount: number; // ALWAYS 1 for cost control
  image: {
    bytesBase64Encoded: string;
    mimeType: string; // 'image/jpeg' | 'image/png'
  };
}

export interface VideoGenerationResult {
  videoUrl: string;
  prompt: string;
  metadata: {
    model: string;
    resolution: string;
    aspectRatio: string;
    duration: number;
    generatedAt: string;
  };
}

export class VertexAIVeoGenerator {
  private projectId = process.env.GOOGLE_PROJECT_ID;
  private location = process.env.GOOGLE_VERTEX_LOCATION || 'us-central1';
  private serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  private serviceAccountKey = process.env.GOOGLE_PRIVATE_KEY;
  private lastRequestTime = 0;
  private minRequestInterval = 30000; // 30 seconds minimum between requests (conservative rate limiting)
  private auth: GoogleAuth;

  constructor() {
    if (!this.projectId) {
      throw new Error('Google Project ID not configured (GOOGLE_PROJECT_ID)');
    }
    if (!this.serviceAccountEmail) {
      throw new Error('Google Service Account Email not configured (GOOGLE_SERVICE_ACCOUNT_EMAIL)');
    }
    if (!this.serviceAccountKey) {
      throw new Error('Google Service Account Key not configured (GOOGLE_PRIVATE_KEY)');
    }

    console.log('🎬 Initializing Vertex AI VEO with service account authentication...');
    console.log('📧 Service Account Email:', this.serviceAccountEmail);
    console.log('🏗️ Project ID:', this.projectId);
    console.log('🗝️ Key format check:', this.serviceAccountKey.substring(0, 30) + '...');

    // Check if the key looks like a proper private key
    if (!this.serviceAccountKey.includes('BEGIN PRIVATE KEY')) {
      console.warn('⚠️  Warning: Key does not appear to be in private key format');
      console.log('💡 Expected format: -----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n');

      // Try to use it as-is but with alternative authentication
      this.auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      });
    } else {
      // Use minimal service account credentials for compatibility
      this.auth = new GoogleAuth({
        credentials: {
          type: 'service_account',
          project_id: this.projectId,
          private_key: this.serviceAccountKey.replace(/\\n/g, '\n'), // Fix escaped newlines
          client_email: this.serviceAccountEmail,
        },
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      });
    }
  }

  async generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResult> {
    console.log('🎬 Starting Vertex AI VEO video generation...');

    // CRITICAL: Force sample count to 1 for cost control
    if (request.sampleCount !== 1) {
      console.warn('⚠️ Sample count forced to 1 for cost control!');
      request.sampleCount = 1;
    }

    // Rate limiting - ensure minimum delay between requests
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minRequestInterval) {
      const delay = this.minRequestInterval - timeSinceLastRequest;
      console.log(`⏳ Rate limiting: waiting ${delay}ms before VEO API call...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    this.lastRequestTime = Date.now();

    // Enhance prompt for video generation
    const enhancedPrompt = this.buildVideoPrompt(request);
    console.log('📝 Enhanced video prompt:', enhancedPrompt);
    console.log('🎥 Video specifications:', {
      model: request.model,
      resolution: request.resolution,
      aspectRatio: request.aspectRatio,
      duration: request.duration + 's',
      sampleCount: request.sampleCount
    });

    try {
      console.log('🤖 Generating video with Vertex AI VEO...');
      console.log('🔑 Service Account configured:', !!this.serviceAccountKey);
      console.log('🏗️ Project ID:', this.projectId);
      console.log('📍 Location:', this.location);

      // Call VEO API
      const videoUrl = await this.callVeoAPI(enhancedPrompt, request);

      console.log('✅ Video generated successfully with VEO');
      console.log('🔗 Generated video URL:', videoUrl);

      return {
        videoUrl,
        prompt: enhancedPrompt,
        metadata: {
          model: request.model,
          resolution: request.resolution,
          aspectRatio: request.aspectRatio,
          duration: request.duration,
          generatedAt: new Date().toISOString(),
        },
      };

    } catch (error: any) {
      console.error('💥 Error generating video:', error);
      throw new Error(`Video generation failed: ${error.message}`);
    }
  }

  private buildVideoPrompt(request: VideoGenerationRequest): string {
    let prompt = request.prompt;

    // Add video-specific enhancements
    const videoEnhancements = [];

    // CRITICAL: Always enforce single continuous shot - VEO handles cuts poorly
    videoEnhancements.push('single continuous shot');
    videoEnhancements.push('one unbroken take');

    // Add smooth camera motion descriptors (only if user hasn't specified camera movement)
    const hasUserCameraDirection = /\b(pan|dolly|orbit|zoom|tracking|static|steadicam)\b/i.test(prompt);
    if (!hasUserCameraDirection) {
      videoEnhancements.push('smooth gradual camera movement');
    }

    // Add motion descriptions
    if (!prompt.toLowerCase().includes('motion') && !prompt.toLowerCase().includes('movement')) {
      videoEnhancements.push('fluid natural motion');
    }

    // Add cinematic quality
    if (!prompt.toLowerCase().includes('cinematic')) {
      videoEnhancements.push('cinematic quality');
    }

    // Add resolution-based quality descriptors
    if (request.resolution === '1080p') {
      videoEnhancements.push('high definition');
    } else {
      videoEnhancements.push('good quality');
    }

    // Add duration-appropriate pacing - always smooth
    if (request.duration <= 4) {
      videoEnhancements.push('focused smooth action');
    } else if (request.duration >= 8) {
      videoEnhancements.push('steady deliberate movement');
    }

    if (videoEnhancements.length > 0) {
      prompt += `, ${videoEnhancements.join(', ')}`;
    }

    // Add technical specifications emphasising continuous shot
    prompt += ', professional video production, well-composed framing, stable camera work, seamless flow';

    // CRITICAL: Explicit prohibitions - VEO produces poor results with these
    const prohibitions = [
      'no cuts',
      'no scene changes',
      'no angle changes',
      'no jump cuts',
      'no sudden camera movements',
      'no abrupt transitions',
      'no switching perspectives',
      'no multiple shots'
    ];
    prompt += `. IMPORTANT: ${prohibitions.join(', ')}`;

    // Additional negative prompts for quality
    const negativePrompts = [
      'blurry motion',
      'unstable camera',
      'poor quality',
      'jarring movements',
      'unnatural motion',
      'choppy editing',
      'disjointed footage'
    ];
    prompt += `. Avoid: ${negativePrompts.join(', ')}`;

    return prompt;
  }

  private async getAccessToken(): Promise<string> {
    try {
      console.log('🔑 Getting OAuth 2.0 access token for VEO...');

      // Get an authenticated client using service account credentials
      const authClient = await this.auth.getClient();

      // Get access token from the authenticated client
      const accessTokenResponse = await authClient.getAccessToken();

      if (!accessTokenResponse.token) {
        throw new Error('Failed to get access token from service account');
      }

      console.log('✅ Successfully obtained OAuth 2.0 access token for VEO');
      return accessTokenResponse.token;

    } catch (error) {
      console.error('❌ Failed to get OAuth access token:', error);
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  private async callVeoAPI(prompt: string, request: VideoGenerationRequest): Promise<string> {
    console.log('🎬 ENTERING VEO API METHOD');
    
    // VEO uses predictLongRunning endpoint for video generation
    const endpoint = `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${request.model}:predictLongRunning`;

    console.log('🌐 VEO endpoint:', endpoint);
    console.log('🤖 Using VEO model:', request.model);
    console.log('🔄 Getting access token...');

    const accessToken = await this.getAccessToken();
    console.log('🔑 Access token length:', accessToken.length);

    // Build the request payload for VEO image-to-video generation
    const requestBody = {
      instances: [{
        prompt: prompt,
        image: {
          bytesBase64Encoded: request.image.bytesBase64Encoded,
          mimeType: request.image.mimeType
        }
      }],
      parameters: {
        aspectRatio: request.aspectRatio,
        resolution: request.resolution,
        durationSeconds: request.duration, // Correct VEO API parameter name
        sampleCount: request.sampleCount, // ALWAYS 1
      }
    };

    console.log('📋 VEO request body structure:', {
      instances: [{
        prompt: prompt.substring(0, 100) + '...',
        image: {
          bytesBase64Encoded: `[base64 data ${request.image.bytesBase64Encoded.length} chars]`,
          mimeType: request.image.mimeType
        }
      }],
      parameters: requestBody.parameters
    });

    console.log('📡 Making API call to VEO (this may take 2-3 minutes)...');

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📈 VEO response status:', response.status);
      console.log('📋 VEO response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ VEO API error:', response.status, errorText);
        throw new Error(`VEO API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('📝 VEO response keys:', Object.keys(result));
      console.log('📝 VEO operation name:', result.name);

      // VEO uses long-running operations - need to poll for completion
      if (result.name) {
        console.log('🔄 VEO started long-running operation:', result.name);
        return await this.pollLongRunningOperation(result.name, accessToken);
      } else {
        throw new Error('No operation name returned from VEO API');
      }

    } catch (error: any) {
      console.error('💥 VEO generation error:', error);
      throw error;
    }
  }

  private async pollLongRunningOperation(operationName: string, accessToken: string): Promise<string> {
    console.log('🔄 Polling VEO long-running operation...');
    console.log('🔄 Full operation name from VEO:', operationName);
    
    const maxAttempts = 60; // 5 minutes max (5s * 60 attempts)
    const pollInterval = 5000; // 5 seconds between polls

    // Use the CORRECT Google VEO polling pattern - fetchPredictOperation with full operation name
    // From Google docs: POST to fetchPredictOperation with the complete operation name
    console.log('🔑 Using full operation name (no extraction):', operationName);
    
    // Use the VEO-specific fetchPredictOperation endpoint as documented by Google
    // Call fetchPredictOperation on the MODEL endpoint, not the operation
    const modelPath = operationName.substring(0, operationName.lastIndexOf('/operations/'));
    console.log('🔍 Debug - Full operation name:', operationName);
    console.log('🔍 Debug - Extracted model path:', modelPath);
    const fetchOperationEndpoint = `https://${this.location}-aiplatform.googleapis.com/v1/${modelPath}:fetchPredictOperation`;
    console.log('📡 VEO fetchPredictOperation endpoint:', fetchOperationEndpoint);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`🔍 Poll attempt ${attempt}/${maxAttempts}...`);
        
        const response = await fetch(fetchOperationEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            operationName: operationName
          })
        });

        console.log('📈 VEO operation polling response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ VEO fetchPredictOperation polling failed: ${response.status}`);
          console.error(`❌ Full error response: ${errorText}`);
          console.error(`❌ fetchPredictOperation endpoint used: ${fetchOperationEndpoint}`);
          console.error(`❌ Operation name used: ${operationName}`);
          throw new Error(`Operation polling failed: ${response.status} - ${errorText}`);
        }

        const operation = await response.json();
        console.log('📋 Operation status:', operation.done ? 'COMPLETE' : 'RUNNING');

        if (operation.done) {
          if (operation.error) {
            console.error('❌ VEO operation failed:', operation.error);
            throw new Error(`VEO operation failed: ${JSON.stringify(operation.error)}`);
          }

          console.log('✅ VEO operation completed successfully');
          console.log('📋 Operation response structure:', Object.keys(operation.response || {}));
          
          // VEO returns videos in the documented format: response.videos array
          if (operation.response && operation.response.videos && operation.response.videos.length > 0) {
            console.log('🎥 Processing VEO videos format (official format)...');
            const video = operation.response.videos[0];
            
            console.log('📹 Video object keys:', Object.keys(video));
            console.log('🗂️ Video mimeType:', video.mimeType);
            
            if (video.gcsUri) {
              console.log('📁 VEO video stored at GCS:', video.gcsUri);
              // Convert GCS URI to public URL for frontend
              return this.convertGcsToPublicUrl(video.gcsUri);
            }
            
            if (video.bytesBase64Encoded) {
              console.log('🎥 Processing VEO base64 video data...');
              const videoUrl = await this.uploadVideoToCloudStorage(video.bytesBase64Encoded);
              return videoUrl;
            }
            
            console.log('⚠️ Video object has no gcsUri or bytesBase64Encoded:', video);
            throw new Error('Video found but no accessible data format (gcsUri or bytesBase64Encoded)');
          }
          
          // Fallback: Check for other possible formats
          if (operation.response) {
            console.log('📋 Complete VEO response for debugging:', JSON.stringify(operation.response, null, 2));
          }
          
          throw new Error('No video data found in VEO response - expected response.videos array');
        }

        // Wait before next poll
        if (attempt < maxAttempts) {
          console.log(`⏳ Waiting ${pollInterval/1000}s before next poll...`);
          await new Promise(resolve => setTimeout(resolve, pollInterval));
        }

      } catch (error) {
        console.error(`❌ Poll attempt ${attempt} failed:`, error);
        throw error;
      }
    }

    throw new Error('VEO operation timed out after 5 minutes');
  }

  private convertGcsToPublicUrl(gcsUri: string): string {
    // Convert gs://bucket/path to https://storage.googleapis.com/bucket/path
    if (gcsUri.startsWith('gs://')) {
      const path = gcsUri.replace('gs://', '');
      const publicUrl = `https://storage.googleapis.com/${path}`;
      console.log('🔗 Converted GCS URI to public URL:', publicUrl);
      return publicUrl;
    }
    
    // If already a public URL, return as-is
    console.log('🔗 Using GCS URI as provided:', gcsUri);
    return gcsUri;
  }

  private async uploadVideoToCloudStorage(base64Data: string): Promise<string> {
    const bucketName = 'netfox-veo-generations';
    const fileName = `ai-videos/generated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.mp4`;

    try {
      console.log(`📤 Uploading video to Cloud Storage: gs://${bucketName}/${fileName}`);

      // Convert base64 to buffer
      const videoBuffer = Buffer.from(base64Data, 'base64');
      console.log(`📊 Video size: ${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB`);

      // Get access token using our auth client
      const authClient = await this.auth.getClient();
      const accessToken = await authClient.getAccessToken();

      // Upload to Cloud Storage using REST API
      const uploadUrl = `https://storage.googleapis.com/upload/storage/v1/b/${bucketName}/o?uploadType=media&name=${encodeURIComponent(fileName)}`;

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken.token}`,
          'Content-Type': 'video/mp4',
          'Content-Length': videoBuffer.length.toString(),
        },
        body: videoBuffer,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cloud Storage upload failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      // Make the object publicly readable
      const aclUrl = `https://storage.googleapis.com/storage/v1/b/${bucketName}/o/${encodeURIComponent(fileName)}/acl`;
      const aclResponse = await fetch(aclUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entity: 'allUsers',
          role: 'READER'
        }),
      });

      if (!aclResponse.ok) {
        console.warn('⚠️ Failed to make video object public, but upload succeeded');
      } else {
        console.log('🔓 Video object made publicly readable');
      }

      // Generate public URL
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;

      console.log('✅ Cloud Storage video upload successful');
      console.log('🔗 Public video URL:', publicUrl);

      return publicUrl;

    } catch (error: any) {
      console.error('❌ Cloud Storage video upload error:', error);
      throw new Error(`Cloud Storage video upload failed: ${error.message}`);
    }
  }
}