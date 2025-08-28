// Google reCAPTCHA v3 verification service

interface RecaptchaResponse {
  success: boolean;
  score: number;
  action: string;
  challenge_ts: string;
  hostname: string;
  'error-codes'?: string[];
}

export async function verifyRecaptcha(token: string): Promise<{
  success: boolean;
  score: number;
  error?: string;
}> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  
  if (!secretKey) {
    console.warn('⚠️ RECAPTCHA_SECRET_KEY not configured - skipping verification');
    return { success: true, score: 0.9 }; // Allow through in development
  }

  if (!token) {
    return { 
      success: false, 
      score: 0, 
      error: 'No reCAPTCHA token provided' 
    };
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: RecaptchaResponse = await response.json();

    if (!result.success) {
      const errorCodes = result['error-codes'] || [];
      console.error('❌ reCAPTCHA verification failed:', errorCodes);
      return {
        success: false,
        score: 0,
        error: `reCAPTCHA verification failed: ${errorCodes.join(', ')}`
      };
    }

    console.log(`✅ reCAPTCHA verified - Score: ${result.score}, Action: ${result.action}`);

    // For contact forms, we typically want a score >= 0.5
    // Higher scores (closer to 1.0) indicate more likely human behavior
    const minimumScore = 0.5;
    if (result.score < minimumScore) {
      return {
        success: false,
        score: result.score,
        error: `reCAPTCHA score too low: ${result.score} (minimum: ${minimumScore})`
      };
    }

    return {
      success: true,
      score: result.score
    };

  } catch (error) {
    console.error('❌ reCAPTCHA verification error:', error);
    return {
      success: false,
      score: 0,
      error: `reCAPTCHA verification error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}