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

export function validateEmailConfig(): boolean {
  const requiredEnvVars = ['SMTP_EMAIL', 'SMTP_PASSWORD'];
  const missing = requiredEnvVars.filter(env => !process.env[env]);
  
  if (missing.length > 0) {
    console.warn(`⚠️ Missing email configuration: ${missing.join(', ')}`);
    return false;
  }
  
  return true;
}