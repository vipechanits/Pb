import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import helmet from "helmet";
import type { Request, Response, NextFunction } from "express";

// Track suspicious IPs for potential blocking
const suspiciousIPs = new Map<string, { count: number; lastAttempt: number }>();
const blockedIPs = new Set<string>();

// Clean up old entries every 15 minutes
setInterval(() => {
  const now = Date.now();
  const fifteenMinutes = 15 * 60 * 1000;
  
  const entries = Array.from(suspiciousIPs.entries());
  for (const [ip, data] of entries) {
    if (now - data.lastAttempt > fifteenMinutes) {
      suspiciousIPs.delete(ip);
    }
  }
}, 15 * 60 * 1000);

/**
 * Get client IP address from request
 */
export function getClientIP(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Block known malicious IPs
 */
export function ipBlockMiddleware(req: Request, res: Response, next: NextFunction) {
  const ip = getClientIP(req);
  
  if (blockedIPs.has(ip)) {
    console.warn(`[SECURITY] Blocked IP attempt: ${ip}`);
    return res.status(403).json({ 
      error: "Access denied",
      message: "Your IP has been blocked due to suspicious activity"
    });
  }
  
  next();
}

/**
 * Track suspicious activity and auto-block
 */
export function trackSuspiciousActivity(ip: string, reason: string) {
  const data = suspiciousIPs.get(ip) || { count: 0, lastAttempt: 0 };
  data.count++;
  data.lastAttempt = Date.now();
  suspiciousIPs.set(ip, data);
  
  console.warn(`[SECURITY] Suspicious activity from ${ip}: ${reason} (count: ${data.count})`);
  
  // Auto-block after 10 suspicious attempts
  if (data.count >= 10) {
    blockedIPs.add(ip);
    console.error(`[SECURITY] IP ${ip} has been blocked after ${data.count} suspicious attempts`);
  }
}

/**
 * Helmet.js - Security headers
 * Protects against XSS, clickjacking, MIME sniffing, etc.
 * 
 * Note: In development, CSP is relaxed to allow Vite HMR and dev tools.
 * In production, stricter CSP rules should be enforced.
 */
export const helmetMiddleware = helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'development' 
    ? false  // Disable CSP in dev mode to allow Vite HMR and dev tools
    : {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "https://www.google.com", "https://www.gstatic.com"],
          styleSrc: ["'self'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          connectSrc: ["'self'", "https://www.google.com"],
          frameSrc: ["https://www.google.com"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
  crossOriginEmbedderPolicy: false, // Allow images from external sources
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  // Additional security headers
  noSniff: true,              // Prevent MIME sniffing
  frameguard: { action: 'deny' }, // Prevent clickjacking
  xssFilter: true,            // Enable XSS filter
  hidePoweredBy: true,        // Hide X-Powered-By header
});

/**
 * General API rate limiter - Prevents DDoS
 * Limits: 100 requests per 15 minutes per IP
 */
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    error: "Too many requests",
    message: "You have exceeded the rate limit. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const ip = getClientIP(req);
    trackSuspiciousActivity(ip, "Rate limit exceeded");
    res.status(429).json({
      error: "Too many requests",
      message: "You have exceeded the rate limit. Please try again later.",
    });
  },
});

/**
 * Authentication rate limiter - Prevents brute force attacks
 * Limits: 5 attempts per 15 minutes per IP
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login/signup attempts per window
  skipSuccessfulRequests: true, // Don't count successful logins
  message: {
    error: "Too many authentication attempts",
    message: "Too many login/signup attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const ip = getClientIP(req);
    trackSuspiciousActivity(ip, "Auth rate limit exceeded (potential brute force)");
    res.status(429).json({
      error: "Too many authentication attempts",
      message: "Too many login/signup attempts. Please try again after 15 minutes.",
    });
  },
});

/**
 * Payment confirmation rate limiter - Prevents abuse
 * Limits: 20 confirmations per 15 minutes per IP
 */
export const paymentRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 payment operations per window
  message: {
    error: "Too many payment requests",
    message: "You have exceeded the payment operation limit. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const ip = getClientIP(req);
    trackSuspiciousActivity(ip, "Payment rate limit exceeded");
    res.status(429).json({
      error: "Too many payment requests",
      message: "You have exceeded the payment operation limit. Please try again later.",
    });
  },
});

/**
 * Admin operations rate limiter - Extra protection
 * Limits: 50 requests per 15 minutes per IP
 */
export const adminRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 admin operations per window
  message: {
    error: "Too many admin requests",
    message: "You have exceeded the admin operation limit. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const ip = getClientIP(req);
    trackSuspiciousActivity(ip, "Admin rate limit exceeded");
    res.status(429).json({
      error: "Too many admin requests",
      message: "You have exceeded the admin operation limit. Please try again later.",
    });
  },
});

/**
 * Speed limiter - Gradual slowdown for repeated requests
 * Slows down responses after 30 requests in 15 minutes
 */
export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 30, // Start slowing down after 30 requests
  delayMs: () => 500, // Add 500ms delay per request after limit
  maxDelayMs: 3000, // Maximum delay of 3 seconds
});

/**
 * Request size limiter - Prevents large payload attacks
 */
export function requestSizeMiddleware(req: Request, res: Response, next: NextFunction) {
  const contentLength = req.headers['content-length'];
  const maxSize = 10 * 1024 * 1024; // 10MB max
  
  if (contentLength && parseInt(contentLength) > maxSize) {
    const ip = getClientIP(req);
    trackSuspiciousActivity(ip, `Large payload attempt: ${contentLength} bytes`);
    return res.status(413).json({
      error: "Payload too large",
      message: "Request body exceeds maximum allowed size of 10MB",
    });
  }
  
  next();
}

/**
 * Suspicious pattern detection middleware
 */
export function suspiciousPatternMiddleware(req: Request, res: Response, next: NextFunction) {
  const ip = getClientIP(req);
  const userAgent = req.headers['user-agent'] || '';
  const url = req.originalUrl;
  
  // Whitelist legitimate development and asset paths
  const whitelistedPaths = [
    /^\/@/,                      // Vite internal paths
    /^\/src\//,                  // Source files in dev mode
    /^\/node_modules\//,         // Dependencies
    /\.(js|ts|tsx|jsx|css|map)$/, // Source and style files
    /^\/assets\//,               // Static assets
    /^\/api\//,                  // API endpoints (checked separately)
  ];
  
  // Skip suspicious pattern detection for whitelisted paths
  const isWhitelisted = whitelistedPaths.some(pattern => pattern.test(url));
  if (isWhitelisted) {
    return next();
  }
  
  // Detect common attack patterns (only for non-whitelisted paths)
  const suspiciousPatterns = [
    /\.\.[\/\\]/, // Path traversal attempts (../)
    /(union\s+(all\s+)?select|insert\s+into|update\s+.+\s+set|delete\s+from|drop\s+table)/i, // SQL injection
    /(<script|javascript:|onerror\s*=|onload\s*=)/i, // XSS attempts
    /(\${.*}|eval\s*\(|exec\s*\()/i, // Code injection attempts
  ];
  
  // Check URL and query parameters for attack patterns
  const fullUrl = url + JSON.stringify(req.query);
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(fullUrl)) {
      trackSuspiciousActivity(ip, `Attack pattern detected in URL: ${url}`);
      console.warn(`[SECURITY] Attack pattern detected from ${ip}: ${url}`);
      break;
    }
  }
  
  // Detect bot/scanner user agents (but not common browsers)
  const suspiciousAgents = [
    /sqlmap|nikto|nmap|masscan|metasploit|burp|acunetix|nessus/i,
  ];
  
  for (const pattern of suspiciousAgents) {
    if (pattern.test(userAgent)) {
      trackSuspiciousActivity(ip, `Scanner/attack tool detected: ${userAgent}`);
      console.warn(`[SECURITY] Attack tool detected from ${ip}: ${userAgent}`);
      break;
    }
  }
  
  next();
}

/**
 * Security audit logger - Log all security events
 */
export function securityAuditLogger(req: Request, res: Response, next: NextFunction) {
  const ip = getClientIP(req);
  const method = req.method;
  const url = req.originalUrl;
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  // Log authentication attempts
  if (url.includes('/auth/login') || url.includes('/auth/signup')) {
    console.log(`[SECURITY AUDIT] Auth attempt - IP: ${ip}, Method: ${method}, URL: ${url}`);
  }
  
  // Log admin access
  if (url.includes('/admin/')) {
    console.log(`[SECURITY AUDIT] Admin access - IP: ${ip}, Method: ${method}, URL: ${url}`);
  }
  
  // Log payment operations
  if (url.includes('/payments/') || url.includes('/activation/')) {
    console.log(`[SECURITY AUDIT] Payment op - IP: ${ip}, Method: ${method}, URL: ${url}`);
  }
  
  next();
}

/**
 * Export all suspicious IPs for monitoring
 */
export function getSuspiciousIPs(): Map<string, { count: number; lastAttempt: number }> {
  return suspiciousIPs;
}

/**
 * Export blocked IPs for monitoring
 */
export function getBlockedIPs(): Set<string> {
  return blockedIPs;
}

/**
 * Manually block an IP
 */
export function blockIP(ip: string): void {
  blockedIPs.add(ip);
  console.error(`[SECURITY] IP ${ip} has been manually blocked`);
}

/**
 * Manually unblock an IP
 */
export function unblockIP(ip: string): boolean {
  const wasBlocked = blockedIPs.delete(ip);
  if (wasBlocked) {
    suspiciousIPs.delete(ip);
    console.log(`[SECURITY] IP ${ip} has been unblocked`);
  }
  return wasBlocked;
}
