import { authenticator } from 'otplib';
import QRCode from 'qrcode';

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

/**
 * Generate a new TOTP secret for 2FA
 */
export function generate2FASecret(): string {
  return authenticator.generateSecret();
}

/**
 * Generate QR code URL for TOTP secret
 */
export async function generate2FAQRCode(email: string, secret: string, issuer: string = 'PAYBACK247'): Promise<string> {
  const otpauthUrl = authenticator.keyuri(email, issuer, secret);
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
  return qrCodeDataUrl;
}

/**
 * Verify TOTP token against secret
 */
export function verify2FAToken(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch (error) {
    console.error('[2FA] Token verification error:', error);
    return false;
  }
}

/**
 * Generate backup codes for 2FA recovery
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  
  for (let i = 0; i < count; i++) {
    let code = '';
    for (let j = 0; j < 8; j++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    // Format as XXXX-XXXX
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  
  return codes;
}
