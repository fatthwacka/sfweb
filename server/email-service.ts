// Email service using Nodemailer
// NOTE: Requires npm install nodemailer @types/nodemailer

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  service?: string;
  message: string;
}

interface EmailConfig {
  service: string;
  auth: {
    user: string;
    pass: string;
  };
}

export async function sendContactEmail(data: ContactFormData): Promise<void> {
  try {
    // Dynamic import to handle missing dependency gracefully
    const nodemailer = await import('nodemailer');
    
    // Email configuration (use environment variables in production)
    const emailConfig: EmailConfig = {
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL || 'your-email@gmail.com',
        pass: process.env.SMTP_PASSWORD || 'your-app-password'
      }
    };

    // Create transporter
    const transporter = nodemailer.createTransport(emailConfig);

    // Email content
    const mailOptions = {
      from: `"SlyFox Studios Contact Form" <${emailConfig.auth.user}>`,
      to: 'dax@slyfox.co.za',
      subject: `New Contact Form Submission - ${data.service || 'General Inquiry'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ff6b6b;">New Contact Form Submission</h2>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Contact Details</h3>
            <p><strong>Name:</strong> ${data.firstName} ${data.lastName}</p>
            <p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
            ${data.phone ? `<p><strong>Phone:</strong> <a href="tel:${data.phone}">${data.phone}</a></p>` : ''}
            ${data.service ? `<p><strong>Service:</strong> ${data.service}</p>` : ''}
          </div>
          
          <div style="background: #fff; padding: 20px; border-left: 4px solid #ff6b6b; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Message</h3>
            <p style="white-space: pre-wrap; line-height: 1.6;">${data.message}</p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
            <p>This email was sent from the SlyFox Studios contact form at ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `,
      text: `
New Contact Form Submission

Name: ${data.firstName} ${data.lastName}
Email: ${data.email}
${data.phone ? `Phone: ${data.phone}\n` : ''}${data.service ? `Service: ${data.service}\n` : ''}
Message:
${data.message}

Sent at: ${new Date().toLocaleString()}
      `
    };

    // Send email
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Contact email sent successfully:', result.messageId);
    
  } catch (error) {
    console.error('❌ Failed to send contact email:', error);
    throw new Error('Failed to send email notification');
  }
}

interface SelectionSubmissionData {
  clientEmail: string;
  clientName?: string;
  shootTitle: string;
  shootDate: string;
  favorites: string[];
  likes: string[];
  dislikes: string[];
  totalImages: number;
}

export async function sendSelectionSubmissionEmail(data: SelectionSubmissionData): Promise<void> {
  try {
    // Dynamic import to handle missing dependency gracefully
    const nodemailer = await import('nodemailer');
    
    // Email configuration (use environment variables in production)
    const emailConfig: EmailConfig = {
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL || 'your-email@gmail.com',
        pass: process.env.SMTP_PASSWORD || 'your-app-password'
      }
    };

    // Create transporter
    const transporter = nodemailer.createTransport(emailConfig);

    // Format the lists of images
    const formatImageList = (images: string[], maxToShow: number = 10) => {
      if (images.length === 0) return '<p style="color: #999;">None selected</p>';
      
      const displayImages = images.slice(0, maxToShow);
      const remainingCount = images.length - maxToShow;
      
      let html = '<ul style="margin: 10px 0; padding-left: 20px;">';
      displayImages.forEach(img => {
        html += `<li style="margin: 5px 0;">${img}</li>`;
      });
      if (remainingCount > 0) {
        html += `<li style="margin: 5px 0; color: #666;">...and ${remainingCount} more</li>`;
      }
      html += '</ul>';
      return html;
    };

    // Email content
    const mailOptions = {
      from: `"SlyFox Studios Image Selection" <${emailConfig.auth.user}>`,
      to: 'dax@slyfox.co.za',
      subject: `Image Selection Submitted - ${data.shootTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
          <h2 style="color: #ff6b6b;">Image Selection Submitted</h2>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Client Details</h3>
            <p><strong>Email:</strong> <a href="mailto:${data.clientEmail}">${data.clientEmail}</a></p>
            ${data.clientName ? `<p><strong>Name:</strong> ${data.clientName}</p>` : ''}
            <p><strong>Shoot:</strong> ${data.shootTitle}</p>
            <p><strong>Date:</strong> ${data.shootDate}</p>
            <p><strong>Total Images Available:</strong> ${data.totalImages}</p>
          </div>
          
          <div style="margin: 20px 0;">
            <h3 style="color: #333;">Selection Summary</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd; background: #fef0f0;">
                  <strong style="color: #e74c3c;">❤️ Favorites (${data.favorites.length})</strong>
                </td>
                <td style="padding: 10px; border: 1px solid #ddd; background: #f0fef4;">
                  <strong style="color: #27ae60;">👍 Likes (${data.likes.length})</strong>
                </td>
                <td style="padding: 10px; border: 1px solid #ddd; background: #fef9f0;">
                  <strong style="color: #f39c12;">👎 Dislikes (${data.dislikes.length})</strong>
                </td>
              </tr>
            </table>
          </div>
          
          <div style="background: #fff; padding: 20px; border-left: 4px solid #ff6b6b; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #e74c3c;">❤️ Favorite Images (Priority for Editing)</h3>
            ${formatImageList(data.favorites, 20)}
          </div>
          
          <div style="background: #fff; padding: 20px; border-left: 4px solid #27ae60; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #27ae60;">👍 Liked Images (Secondary Choices)</h3>
            ${formatImageList(data.likes, 15)}
          </div>
          
          <div style="background: #fff; padding: 20px; border-left: 4px solid #f39c12; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #f39c12;">👎 Disliked Images (Do Not Edit)</h3>
            ${formatImageList(data.dislikes, 10)}
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
            <p>This selection was submitted at ${new Date().toLocaleString()}</p>
            <p>Client has selected ${data.favorites.length + data.likes.length} images for potential editing out of ${data.totalImages} total images.</p>
          </div>
        </div>
      `,
      text: `
Image Selection Submitted

Client: ${data.clientEmail}
${data.clientName ? `Name: ${data.clientName}\n` : ''}Shoot: ${data.shootTitle}
Date: ${data.shootDate}
Total Images: ${data.totalImages}

FAVORITES (${data.favorites.length} images - Priority for editing):
${data.favorites.join('\n')}

LIKES (${data.likes.length} images - Secondary choices):
${data.likes.join('\n')}

DISLIKES (${data.dislikes.length} images - Do not edit):
${data.dislikes.join('\n')}

Submitted at: ${new Date().toLocaleString()}
      `
    };

    // Send email
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Selection submission email sent successfully:', result.messageId);
    
  } catch (error) {
    console.error('❌ Failed to send selection submission email:', error);
    throw new Error('Failed to send email notification');
  }
}

interface AlbumReadyData {
  clientEmail: string;
  clientName: string;
  shootTitle: string;
  galleryUrl: string;
  clientPortalUrl: string;
  customSlug?: string;
  professionalRetouchCount?: number;
  totalImagesCount?: number;
  coverImageUrl?: string;
  statisticsImageUrl?: string;
}

export async function sendAlbumReadyEmail(data: AlbumReadyData): Promise<void> {
  try {
    // Dynamic import to handle missing dependency gracefully
    const nodemailer = await import('nodemailer');
    
    // Email configuration (use environment variables in production)
    const emailConfig: EmailConfig = {
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL || 'your-email@gmail.com',
        pass: process.env.SMTP_PASSWORD || 'your-app-password'
      }
    };

    // Create transporter
    const transporter = nodemailer.createTransport(emailConfig);

    // Email content
    const mailOptions = {
      from: `"SlyFox Studios" <${emailConfig.auth.user}>`,
      to: data.clientEmail,
      bcc: 'dax@slyfox.co.za', // BCC copy to photographer
      subject: `🎉 Your Beautiful Photos Are Ready! - ${data.shootTitle}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; border-radius: 0;">
          <div style="background: white; border-radius: 0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            
            <!-- Header Section -->
            <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%); color: white; text-align: left; padding: 40px 30px;">
              <h1 style="margin: 0; font-size: 32px; font-weight: 300; letter-spacing: 1px;">✨ Your Photos Are Ready!</h1>
              <p style="margin: 15px 0 0 0; font-size: 18px; opacity: 0.95;">Professional editing complete</p>
            </div>
            
            <!-- Main Content -->
            <div style="padding: 40px 0px;">
              <p style="font-size: 18px; color: #333; margin: 0 0 25px 30px; line-height: 1.6; text-align: left;">
                Hi ${data.clientName},
              </p>
              
              <p style="font-size: 16px; color: #555; line-height: 1.7; margin: 0 0 20px 30px; text-align: left;">
                Exciting news! 🎊 Your professional photo retouching and editing for <strong style="color: #ff6b6b;">"${data.shootTitle}"</strong> is now complete, and your stunning album is live and ready for you to explore!
              </p>
              
              ${data.coverImageUrl ? `
              <!-- Album Preview Image -->
              <div style="margin: 30px 30px 30px 30px; text-align: left;">
                <img src="${data.coverImageUrl}" alt="Album Preview" style="width: calc(100% - 60px); max-width: 570px; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />
              </div>
              ` : ''}
              
              <!-- CTA Button -->
              <div style="text-align: left; margin: 35px 30px;">
                <a href="${data.galleryUrl}" style="display: inline-block; background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%); color: white; text-decoration: none; padding: 16px 35px; border-radius: 50px; font-size: 18px; font-weight: 600; letter-spacing: 0.5px; box-shadow: 0 8px 25px rgba(255, 107, 107, 0.3); transition: all 0.3s ease;">
                  🖼️ View Your Gallery
                </a>
              </div>
              
              <!-- Direct Link -->
              <div style="background: #f7fafc; border-radius: 8px; padding: 20px; margin: 25px 30px;">
                <p style="margin: 0 0 10px 0; color: #4a5568; font-weight: 600; text-align: left;">🔗 Direct Gallery Link:</p>
                <p style="margin: 0; word-break: break-all; text-align: left;">
                  <a href="${data.galleryUrl}" style="color: #4299e1; text-decoration: none; font-family: monospace; font-size: 14px;">${data.galleryUrl}</a>
                </p>
              </div>
              
              <!-- Sharing Section -->
              <div style="text-align: left; margin: 35px 30px;">
                <p style="color: #666; font-size: 15px; margin: 0 0 15px 0; text-align: left;">📤 Share your beautiful photos with family and friends!</p>
                <p style="color: #888; font-size: 13px; margin: 0; text-align: left;">Simply copy and share the gallery link above</p>
              </div>
              
              ${data.statisticsImageUrl ? `
              <!-- Album Preview -->
              <div style="margin: 30px 30px; text-align: left;">
                <a href="${data.galleryUrl}" style="text-decoration: none; display: block; float: left; margin-right: 20px;">
                  <img src="${data.statisticsImageUrl}" alt="Album Preview" style="width: 300px; height: 300px; object-fit: cover; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); transition: transform 0.2s ease; cursor: pointer;" />
                </a>
                <div style="overflow: hidden;">
                  <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px; text-align: left;">📊 Your Album Statistics</h3>
                  <div style="text-align: left;">
                    <div style="font-size: 32px; font-weight: bold; color: #ff6b6b; margin: 0; text-align: left;">${data.totalImagesCount || 0}</div>
                    <div style="font-size: 14px; color: #666; margin-top: 5px; text-align: left;">Total Album Images</div>
                    <div style="font-size: 12px; color: #999; margin-top: 2px; text-align: left;">(All professionally edited photos)</div>
                  </div>
                  <div style="margin-top: 30px;">
                    <p style="color: #666; font-size: 14px; line-height: 1.6; text-align: left; margin: 0;">
                      Each image has been carefully edited and enhanced to showcase the best moments from your session.
                    </p>
                  </div>
                </div>
                <div style="clear: both;"></div>
              </div>
              ` : `
              <!-- Album Statistics (No Image) -->
              <div style="background: #f8f9ff; padding: 20px; margin: 25px 30px; border-radius: 8px;">
                <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px; text-align: left;">📊 Your Album Statistics</h3>
                <div style="text-align: left;">
                  <div style="font-size: 32px; font-weight: bold; color: #ff6b6b; margin: 0; text-align: left;">${data.totalImagesCount || 0}</div>
                  <div style="font-size: 14px; color: #666; margin-top: 5px; text-align: left;">Total Album Images</div>
                  <div style="font-size: 12px; color: #999; margin-top: 2px; text-align: left;">(All professionally edited photos)</div>
                </div>
              </div>
              `}
              
              <!-- Features Section -->
              <div style="background: #f8f9ff; border-radius: 12px; padding: 25px; margin: 30px 0;">
                <h3 style="color: #4a5568; margin: 0 0 20px 0; font-size: 20px; text-align: left; padding-left: 0;">🎨 Customise Your Gallery</h3>
                
                <p style="color: #666; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0; text-align: left; padding-left: 0;">
                  Your photographer has already created your album with beautiful settings, but if you would like to customise it further, simply login to your dashboard.
                </p>
                <p style="color: #666; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0; text-align: left; padding-left: 0;">
                  Login to your <a href="${data.clientPortalUrl}" style="color: #ff6b6b; text-decoration: none; font-weight: 600;">🏠 SlyFox Dashboard</a> to customise your gallery:
                </p>
                
                <div style="display: grid; gap: 15px; text-align: left;">
                  <div style="display: flex; align-items: center; gap: 12px; text-align: left;">
                    <span style="background: #96ceb4; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0;">📱</span>
                    <span style="color: #555; font-size: 15px; text-align: left;">Download high-resolution images for <strong>printing and sharing</strong></span>
                  </div>
                  
                  <div style="display: flex; align-items: center; gap: 12px; text-align: left;">
                    <span style="background: #ff6b6b; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0;">👑</span>
                    <span style="color: #555; font-size: 15px; text-align: left;">Click the <strong>crown icon</strong> on any image to set it as your gallery cover</span>
                  </div>
                  
                  <div style="display: flex; align-items: center; gap: 12px; text-align: left;">
                    <span style="background: #4ecdc4; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0;">🎯</span>
                    <span style="color: #555; font-size: 15px; text-align: left;">Drag and drop images to <strong>reorder</strong> them to your preference</span>
                  </div>
                  
                  <div style="display: flex; align-items: center; gap: 12px; text-align: left;">
                    <span style="background: #45b7d1; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0;">🎨</span>
                    <span style="color: #555; font-size: 15px; text-align: left;">Change the <strong>background color</strong> to match your style</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%); color: white; text-align: left; padding: 30px; padding-left: 30px;">
              <div style="display: flex; align-items: center; gap: 20px; flex-wrap: wrap;">
                <img src="${data.galleryUrl.split('/gallery/')[0]}/images/logos/slyfox-logo-white.png" alt="SlyFox Studios" style="height: 50px; width: auto;" />
                <div style="flex: 1;">
                  <p style="margin: 0 0 10px 0; font-size: 18px; font-weight: 600; text-align: left;">Thank you for choosing SlyFox Studios!</p>
                  <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 14px; text-align: left;">
                    Questions? Reply to this email or contact us at 
                    <a href="tel:+27769163113" style="color: white; text-decoration: none; font-weight: 600;">076 916 3113</a>
                  </p>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      `,
      text: `
🎉 YOUR PHOTOS ARE READY! 🎉

Hi ${data.clientName},

Exciting news! Your professional photo retouching and editing for "${data.shootTitle}" is now complete, and your stunning album is live and ready for you to explore!

ALBUM STATISTICS:
• Professional Retouches: ${data.professionalRetouchCount || 0} images (marked with ❤️)
• Total Album Images: ${data.totalImagesCount || 0} edited photos

VIEW YOUR GALLERY: ${data.galleryUrl}

Your Gallery Features:
Your photographer has already created your album with beautiful settings, but if you would like to customise it further, simply login to your dashboard.

Login to your SlyFox Dashboard to customise your gallery: ${data.clientPortalUrl}

• Download high-resolution images for printing and sharing
• Click the crown icon on any image to set it as your gallery cover  
• Drag and drop images to reorder them to your preference
• Change the background color to match your style

Direct Gallery Link: ${data.galleryUrl}
SlyFox Dashboard: ${data.clientPortalUrl}

Share your beautiful photos with family and friends by copying and sharing the gallery link above.

Thank you for choosing SlyFox Studios! 📸
Questions? Reply to this email or contact us at 076 916 3113

Sent at: ${new Date().toLocaleString()}
      `
    };

    // Send email
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Album ready email sent successfully:', result.messageId);
    
  } catch (error) {
    console.error('❌ Failed to send album ready email:', error);
    throw new Error('Failed to send album ready email notification');
  }
}

export function validateEmailConfig(): boolean {
  const requiredEnvVars = ['SMTP_EMAIL', 'SMTP_PASSWORD'];
  const missing = requiredEnvVars.filter(env => !process.env[env]);
  
  if (missing.length > 0) {
    console.warn(`⚠️ Missing email configuration: ${missing.join(', ')}`);
    return false;
  }
  
  return true;
}