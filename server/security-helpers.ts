/**
 * Verify reCAPTCHA v2 token with Google's API
 */
export async function verifyRecaptcha(token: string, secretKey: string): Promise<boolean> {
  if (!token || !secretKey) {
    return false;
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(token)}`,
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('[RECAPTCHA] Verification error:', error);
    return false;
  }
}
