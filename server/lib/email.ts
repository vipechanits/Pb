import nodemailer from 'nodemailer';

/**
 * Email Service
 * Sends transactional emails (verification, password reset, etc.)
 * 
 * SETUP: Add these environment variables to use real email sending:
 * - EMAIL_HOST (e.g., smtp.gmail.com, smtp.sendgrid.net)
 * - EMAIL_PORT (e.g., 587 for TLS, 465 for SSL)
 * - EMAIL_USER (SMTP username/email)
 * - EMAIL_PASS (SMTP password/API key)
 * - EMAIL_FROM (sender email, e.g., noreply@payback247.com)
 * 
 * If not configured, emails will be logged to console (development mode)
 */

const EMAIL_HOST = process.env.EMAIL_HOST;
const EMAIL_PORT = process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) : 587;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@payback247.com';

const isDevelopment = process.env.NODE_ENV === 'development';
const isEmailConfigured = EMAIL_HOST && EMAIL_USER && EMAIL_PASS;

let transporter: nodemailer.Transporter | null = null;

if (isEmailConfigured) {
  transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_PORT === 465, // true for 465 (SSL), false for other ports (TLS)
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });
  
  console.log('[EMAIL] ✓ Email service configured (SMTP)');
} else {
  console.log('[EMAIL] ⚠ Email service running in CONSOLE MODE (no SMTP configured)');
  console.log('[EMAIL] Configure EMAIL_HOST, EMAIL_USER, EMAIL_PASS to send real emails');
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string; // Plain text fallback
}

/**
 * Send an email
 * In development or when SMTP is not configured, logs to console instead
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  if (!transporter) {
    // Development mode: Log to console
    console.log('\n' + '='.repeat(80));
    console.log('[EMAIL] Console Mode Email');
    console.log('='.repeat(80));
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log('-'.repeat(80));
    console.log(options.html.replace(/<[^>]*>/g, '')); // Strip HTML tags for console
    console.log('='.repeat(80) + '\n');
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    });

    console.log(`[EMAIL] ✓ Email sent to ${options.to} (Message ID: ${info.messageId})`);
  } catch (error) {
    console.error(`[EMAIL] ✗ Failed to send email to ${options.to}:`, error);
    throw new Error('Failed to send email');
  }
}

/**
 * Send email verification link
 */
export async function sendVerificationEmail(
  email: string,
  token: string,
  baseUrl: string
): Promise<void> {
  const verificationUrl = `${baseUrl}/auth/verify-email/${token}`;
  
  await sendEmail({
    to: email,
    subject: 'Verify Your Email - PAYBACK247',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">PAYBACK247</h1>
            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Verify Your Email Address</p>
          </div>
          
          <!-- Body -->
          <div style="padding: 40px 30px;">
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Welcome to PAYBACK247! Please verify your email address to activate your account.
            </p>
            
            <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0 0 30px 0;">
              Click the button below to confirm your email address:
            </p>
            
            <!-- Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
                Verify Email Address
              </a>
            </div>
            
            <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
              Or copy and paste this link in your browser:
            </p>
            <p style="color: #667eea; font-size: 14px; word-break: break-all; margin: 10px 0 0 0;">
              ${verificationUrl}
            </p>
            
            <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #eeeeee;">
              <p style="color: #999999; font-size: 12px; line-height: 1.6; margin: 0;">
                This verification link will expire in 24 hours. If you didn't create an account with PAYBACK247, please ignore this email.
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f9f9f9; padding: 20px 30px; text-align: center; border-top: 1px solid #eeeeee;">
            <p style="color: #999999; font-size: 12px; margin: 0;">
              © 2025 PAYBACK247. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

/**
 * Send password reset email (reusing from password reset system)
 */
export async function sendPasswordResetEmail(
  email: string,
  token: string,
  baseUrl: string
): Promise<void> {
  const resetUrl = `${baseUrl}/auth/reset-password/${token}`;
  
  await sendEmail({
    to: email,
    subject: 'Reset Your Password - PAYBACK247',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">PAYBACK247</h1>
            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Password Reset Request</p>
          </div>
          
          <div style="padding: 40px 30px;">
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              We received a request to reset your password. Click the button below to create a new password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
              Or copy and paste this link in your browser:
            </p>
            <p style="color: #667eea; font-size: 14px; word-break: break-all; margin: 10px 0 0 0;">
              ${resetUrl}
            </p>
            
            <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #eeeeee;">
              <p style="color: #999999; font-size: 12px; line-height: 1.6; margin: 0;">
                This password reset link will expire in 24 hours. If you didn't request a password reset, please ignore this email.
              </p>
            </div>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 20px 30px; text-align: center; border-top: 1px solid #eeeeee;">
            <p style="color: #999999; font-size: 12px; margin: 0;">
              © 2025 PAYBACK247. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

/**
 * Send password changed confirmation email
 */
export async function sendPasswordChangedEmail(
  email: string,
  userName: string | null
): Promise<void> {
  await sendEmail({
    to: email,
    subject: 'Your Password Has Been Changed - PAYBACK247',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Changed</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">PAYBACK247</h1>
            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Password Changed Successfully</p>
          </div>
          
          <div style="padding: 40px 30px;">
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              ${userName ? `Hi ${userName},` : 'Hello,'}
            </p>
            
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Your password has been successfully changed. You can now log in using your new password.
            </p>
            
            <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
              If you didn't make this change, please contact support immediately.
            </p>
            
            <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #eeeeee;">
              <p style="color: #999999; font-size: 12px; line-height: 1.6; margin: 0;">
                This is an automated security notification. For your security, we recommend using a strong, unique password.
              </p>
            </div>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 20px 30px; text-align: center; border-top: 1px solid #eeeeee;">
            <p style="color: #999999; font-size: 12px; margin: 0;">
              © 2025 PAYBACK247. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}
