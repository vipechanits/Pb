import nodemailer from 'nodemailer';

/**
 * Email Service
 * Sends transactional emails (verification, password reset, etc.)
 * 
 * Configuration priority:
 * 1. Database system configuration (set via Admin panel)
 * 2. Environment variables (fallback)
 * 
 * If neither is configured, emails will be logged to console (development mode)
 */

export interface EmailConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  from: string;
  secure: boolean;
  enabled: boolean;
}

// Store active email configuration
let currentEmailConfig: EmailConfig | null = null;
let transporter: nodemailer.Transporter | null = null;

/**
 * Initialize email service with configuration from database or environment
 */
export function initializeEmailService(dbConfig?: Partial<EmailConfig> | null): void {
  const hasDbConfig = dbConfig && typeof dbConfig.enabled !== 'undefined';
  
  // Priority 1: Database configuration (if database config exists)
  if (hasDbConfig) {
    // Check if email is explicitly disabled in database
    if (!dbConfig.enabled) {
      currentEmailConfig = null;
      transporter = null;
      console.log('[EMAIL] ✗ Email service DISABLED via Admin panel');
      return;
    }
    
    // Database config enabled - use it if complete
    if (dbConfig.host && dbConfig.user && dbConfig.password) {
      currentEmailConfig = {
        host: dbConfig.host,
        port: dbConfig.port || 587,
        user: dbConfig.user,
        password: dbConfig.password,
        from: dbConfig.from || 'noreply@payback247.com',
        secure: dbConfig.secure || false,
        enabled: true,
      };
      console.log('[EMAIL] ✓ Using database configuration');
      
      // Create transporter with database config
      transporter = nodemailer.createTransport({
        host: currentEmailConfig.host,
        port: currentEmailConfig.port,
        secure: currentEmailConfig.secure,
        auth: {
          user: currentEmailConfig.user,
          pass: currentEmailConfig.password,
        },
      });
      console.log(`[EMAIL] ✓ SMTP configured - ${currentEmailConfig.host}:${currentEmailConfig.port}`);
      return;
    } else {
      // Database config incomplete
      currentEmailConfig = null;
      transporter = null;
      console.log('[EMAIL] ⚠ Email enabled but database configuration incomplete');
      console.log('[EMAIL] Please configure SMTP host, user, and password in Admin panel');
      return;
    }
  }
  
  // Priority 2: Environment variables (fallback - only when no database config exists)
  const envHost = process.env.EMAIL_HOST;
  const envPort = process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) : 587;
  const envUser = process.env.EMAIL_USER;
  const envPass = process.env.EMAIL_PASS;
  const envFrom = process.env.EMAIL_FROM || 'noreply@payback247.com';
  const envSecure = envPort === 465;

  if (envHost && envUser && envPass) {
    currentEmailConfig = {
      host: envHost,
      port: envPort,
      user: envUser,
      password: envPass,
      from: envFrom,
      secure: envSecure,
      enabled: true,
    };
    transporter = nodemailer.createTransport({
      host: currentEmailConfig.host,
      port: currentEmailConfig.port,
      secure: currentEmailConfig.secure,
      auth: {
        user: currentEmailConfig.user,
        pass: currentEmailConfig.password,
      },
    });
    console.log('[EMAIL] ✓ Using environment variable configuration (fallback)');
    console.log(`[EMAIL] ✓ SMTP configured - ${currentEmailConfig.host}:${currentEmailConfig.port}`);
  } else {
    currentEmailConfig = null;
    transporter = null;
    console.log('[EMAIL] ⚠ Email service running in CONSOLE MODE (no SMTP configured)');
    console.log('[EMAIL] Configure via Admin panel or set EMAIL_HOST, EMAIL_USER, EMAIL_PASS');
  }
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
    const fromAddress = currentEmailConfig?.from || 'noreply@payback247.com';
    const info = await transporter.sendMail({
      from: fromAddress,
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
 * Send registration details email after email verification
 * Contains User ID, name, email, mobile, and sponsor info
 */
export async function sendRegistrationDetailsEmail(
  email: string,
  details: {
    userId: string;
    name: string;
    mobile: string;
    sponsorId: string | null;
    registeredAt: Date;
  }
): Promise<void> {
  const formattedDate = details.registeredAt.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  await sendEmail({
    to: email,
    subject: `Welcome to PAYBACK247 - Your Registration Details (${details.userId})`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Registration Details</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">PAYBACK247</h1>
            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Welcome! Your Account is Ready</p>
          </div>
          
          <!-- Body -->
          <div style="padding: 40px 30px;">
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Dear ${details.name},
            </p>
            
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Congratulations! Your email has been verified and your PAYBACK247 account is now active.
              Please save the following registration details for your records:
            </p>
            
            <!-- User ID Highlight Box -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; padding: 25px; text-align: center; margin: 30px 0;">
              <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">Your Unique User ID</p>
              <p style="color: #ffffff; font-size: 36px; font-weight: bold; margin: 0; letter-spacing: 3px;">${details.userId}</p>
              <p style="color: rgba(255,255,255,0.8); font-size: 12px; margin: 10px 0 0 0;">Use this ID to log in to your account</p>
            </div>
            
            <!-- Details Table -->
            <div style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin: 30px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eeeeee; color: #666666; font-size: 14px; width: 40%;">Full Name</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eeeeee; color: #333333; font-size: 14px; font-weight: bold;">${details.name}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eeeeee; color: #666666; font-size: 14px;">Email</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eeeeee; color: #333333; font-size: 14px; font-weight: bold;">${email}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eeeeee; color: #666666; font-size: 14px;">Mobile</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eeeeee; color: #333333; font-size: 14px; font-weight: bold;">${details.mobile || 'Not provided'}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eeeeee; color: #666666; font-size: 14px;">Sponsor ID</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eeeeee; color: #333333; font-size: 14px; font-weight: bold;">${details.sponsorId || 'PB10000 (Default)'}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #666666; font-size: 14px;">Registered On</td>
                  <td style="padding: 12px 0; color: #333333; font-size: 14px; font-weight: bold;">${formattedDate}</td>
                </tr>
              </table>
            </div>
            
            <!-- Important Notice -->
            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
              <p style="color: #856404; font-size: 14px; margin: 0; font-weight: bold;">Important:</p>
              <p style="color: #856404; font-size: 13px; margin: 8px 0 0 0; line-height: 1.5;">
                Please save this email safely. Your User ID (${details.userId}) is required to log in to your account.
                Do not share your login credentials with anyone.
              </p>
            </div>
            
            <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #eeeeee;">
              <p style="color: #999999; font-size: 12px; line-height: 1.6; margin: 0;">
                If you have any questions, please contact our support team. We're here to help you succeed!
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
