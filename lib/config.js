// Next.js automatically loads environment variables from .env files
// For server-side code (API routes, getServerSideProps, etc.), Next.js makes
// all env vars available via process.env
// For client-side code, only NEXT_PUBLIC_* vars are available
// We use dotenv as a fallback for cases where Next.js env loading might not work
import dotenv from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

// Load environment variables from .env files as fallback
// Next.js loads these automatically, but this ensures they're available
// when this config module is imported in any context (especially in non-Next.js contexts)
if (typeof window === 'undefined') {
  // Only load on server-side
  const cwd = process.cwd();
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  // Load in order of precedence (later files override earlier ones)
  // Use override: false to not override existing vars (from Next.js), but fill in missing ones
  // Use override: true for .local files to ensure they take precedence

  const loadedFiles = [];

  // Force reload environment variables from all possible sources
  // Next.js automatically loads them, but we ensure they're available

  const filesToCheck = [
    '.env',
    nodeEnv === 'development' ? '.env.development' : null,
    nodeEnv === 'production' ? '.env.production' : null,
    '.env.local',
    nodeEnv === 'development' ? '.env.development.local' : null,
    nodeEnv === 'production' ? '.env.production.local' : null,
  ].filter(Boolean);

  for (const file of filesToCheck) {
    const filePath = resolve(cwd, file);
    if (existsSync(filePath)) {
      try {
        // Load with override: false for base files, override: true for .local files
        const override = file.includes('.local');
        const result = dotenv.config({ path: filePath, override });

        if (result.error) {
          // if (nodeEnv === 'development') {
          //   console.warn(`[Config] Failed to load ${file}:`, result.error.message);
          // }
        } else {
          loadedFiles.push(file);
          // if (nodeEnv === 'development') {
          //   console.log(`[Config] Successfully loaded ${file}`);
          // }
        }
      } catch (error) {
        // if (nodeEnv === 'development') {
        //   console.warn(`[Config] Error loading ${file}:`, error.message);
        // }
      }
    }
  }
  
  // Log loaded files in development for debugging
  // if (nodeEnv === 'development') {
  //   console.log('[Config] Loaded env files:', loadedFiles.length > 0 ? loadedFiles.join(', ') : 'None');

  //   // Debug: Check if our expected variables are set
  //   const debugVars = ['SMTP2GO_API_KEY', 'SMTP2GO_FROM_EMAIL', 'SMTP_USERNAME', 'SMTP_PASSWORD'];
  //   debugVars.forEach(varName => {
  //     const value = process.env[varName];
  //     console.log(`[Config] ${varName}: ${value ? 'Set (length: ' + value.length + ')' : 'NOT SET'}`);
  //   });

  //   // Additional debug: Check all environment variables starting with SMTP
  //   console.log('[Config] All SMTP* variables:');
  //   Object.keys(process.env).filter(key => key.startsWith('SMTP')).forEach(key => {
  //     console.log(`  ${key}: ${process.env[key] ? 'Set' : 'NOT SET'}`);
  //   });
  // }
}

// Build a normalized env object used across server modules
// In Next.js, process.env is available in API routes and server-side code
// This ensures compatibility with both Next.js and standalone Node.js usage
const isProd = process.env.NODE_ENV === 'production';
const isDev = !isProd;

// Helper to safely get env var with fallback
function getEnvVar(key, fallback = '') {
  // In Next.js, process.env is populated automatically
  // Check process.env directly - Next.js and dotenv both populate it
  // Also check for the key in different formats (uppercase, lowercase)
  let value = process.env[key];
  
  // If not found, try uppercase version
  if (!value) {
    value = process.env[key.toUpperCase()];
  }
  
  // If still not found, try lowercase version
  if (!value) {
    value = process.env[key.toLowerCase()];
  }
  
  // Return the value if it exists and is not empty, otherwise return fallback
  if (value !== undefined && value !== null && value !== '') {
    // Remove quotes if present (common issue with .env files)
    const cleaned = String(value).trim().replace(/^["']|["']$/g, '');
    return cleaned || fallback;
  }
  
  return fallback;
}

export const env = {
  NODE_ENV: getEnvVar('NODE_ENV', 'development'),
  
  // Database configuration - empty string allows app to run without DB
  MONGODB_URI: getEnvVar('MONGODB_URI', ''),
  
  // Authentication - generate a default secret if not provided (not secure but allows app to run)
  JWT_SECRET: getEnvVar('JWT_SECRET', 'default-jwt-secret-change-in-production'),
  
  // Application URLs (NEXT_PUBLIC_* vars are available on client-side)
  NEXT_PUBLIC_BASE_URL: getEnvVar('NEXT_PUBLIC_BASE_URL', 'http://localhost:3000'),
  BASE_URL: getEnvVar('BASE_URL', getEnvVar('NEXT_PUBLIC_BASE_URL', 'http://localhost:3000')),
  
  // Cloudinary
  CLOUDINARY_CLOUD_NAME: getEnvVar('CLOUDINARY_CLOUD_NAME', ''),
  CLOUDINARY_API_KEY: getEnvVar('CLOUDINARY_API_KEY', ''),
  CLOUDINARY_API_SECRET: getEnvVar('CLOUDINARY_API_SECRET', ''),
  CLOUDINARY_URL: getEnvVar('CLOUDINARY_URL', ''),

  // Resend API configuration (recommended for development)
  RESEND_API_KEY: getEnvVar('RESEND_API_KEY', ''),
  RESEND_FROM_EMAIL: getEnvVar('RESEND_FROM_EMAIL', ''),
  RESEND_FROM_NAME: getEnvVar('RESEND_FROM_NAME', 'The Server'),
  
  // SMTP2Go API configuration (alternative method)
  SMTP2GO_API_KEY: getEnvVar('SMTP2GO_API_KEY', ''),
  SMTP2GO_FROM_EMAIL: getEnvVar('SMTP2GO_FROM_EMAIL', ''),
  SMTP2GO_FROM_NAME: getEnvVar('SMTP2GO_FROM_NAME', 'The Server'),
  
  // SMTP configuration (for SMTP protocol - fallback)
  SMTP_HOST: getEnvVar('SMTP_HOST', 'mail.smtp2go.com'),
  SMTP_PORT: getEnvVar('SMTP_PORT', '25'),
  SMTP_USERNAME: getEnvVar('SMTP_USERNAME', ''),
  SMTP_PASSWORD: getEnvVar('SMTP_PASSWORD', ''),
  SMTP_SECURE: getEnvVar('SMTP_SECURE', 'false') === 'true',
  SMTP_FROM: getEnvVar('SMTP_FROM', 'noreply@designndev.com'),

  // Recaptcha
  NEXT_PUBLIC_RECAPTCHA_SITE_KEY: getEnvVar('NEXT_PUBLIC_RECAPTCHA_SITE_KEY', ''),
  RECAPTCHA_SECRET_KEY: getEnvVar('RECAPTCHA_SECRET_KEY', ''),
};

// Helper function to check if environment variables are loaded
// Useful for debugging environment variable issues
export function debugEnv() {
  if (typeof window !== 'undefined') {
    return { error: 'This function can only be called server-side' };
  }
  
  const cwd = process.cwd();
  const envFiles = [];
  
  // Check which .env files exist
  if (existsSync(resolve(cwd, '.env'))) envFiles.push('.env');
  if (existsSync(resolve(cwd, '.env.local'))) envFiles.push('.env.local');
  if (existsSync(resolve(cwd, '.env.development'))) envFiles.push('.env.development');
  if (existsSync(resolve(cwd, '.env.development.local'))) envFiles.push('.env.development.local');
  if (existsSync(resolve(cwd, '.env.production'))) envFiles.push('.env.production');
  if (existsSync(resolve(cwd, '.env.production.local'))) envFiles.push('.env.production.local');
  
  // Debug: Log the actual values in development
  // if (nodeEnv === 'development') {
  //   console.log('[Config] Debug - Raw process.env values:');
  //   console.log('  SMTP_USERNAME:', process.env.SMTP_USERNAME ? 'Set' : 'undefined');
  //   console.log('  SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? 'Set' : 'undefined');
  //   console.log('  SMTP_FROM:', process.env.SMTP_FROM || 'undefined');
  // }

  return {
    nodeEnv: process.env.NODE_ENV,
    cwd: cwd,
    envFilesFound: envFiles,
    envLoaded: {
      MONGODB_URI: !!process.env.MONGODB_URI,
      JWT_SECRET: !!process.env.JWT_SECRET,
      // Resend configuration
      RESEND_API_KEY: !!process.env.RESEND_API_KEY,
      RESEND_FROM_EMAIL: !!process.env.RESEND_FROM_EMAIL,
      // SMTP2Go configuration
      SMTP2GO_API_KEY: !!process.env.SMTP2GO_API_KEY,
      SMTP2GO_FROM_EMAIL: !!process.env.SMTP2GO_FROM_EMAIL,
      // SMTP protocol configuration
      SMTP_USERNAME: !!process.env.SMTP_USERNAME,
      SMTP_PASSWORD: !!process.env.SMTP_PASSWORD,
      SMTP_FROM: !!process.env.SMTP_FROM,
      SMTP_HOST: !!process.env.SMTP_HOST,
      SMTP_PORT: !!process.env.SMTP_PORT,
      SMTP_SECURE: !!process.env.SMTP_SECURE,
    },
    configValues: {
      MONGODB_URI: env.MONGODB_URI ? 'Set' : 'Not set',
      JWT_SECRET: env.JWT_SECRET ? 'Set' : 'Not set',
      // Resend configuration
      RESEND_API_KEY: env.RESEND_API_KEY ? 'Set' : 'Not set',
      RESEND_FROM_EMAIL: env.RESEND_FROM_EMAIL || 'Not set',
      // SMTP2Go configuration
      SMTP2GO_API_KEY: env.SMTP2GO_API_KEY ? 'Set' : 'Not set',
      SMTP2GO_FROM_EMAIL: env.SMTP2GO_FROM_EMAIL || 'Not set',
      // SMTP protocol configuration
      SMTP_USERNAME: env.SMTP_USERNAME ? 'Set' : 'Not set',
      SMTP_PASSWORD: env.SMTP_PASSWORD ? 'Set' : 'Not set',
      SMTP_FROM: env.SMTP_FROM || 'Not set',
      SMTP_HOST: env.SMTP_HOST || 'Not set',
      SMTP_PORT: env.SMTP_PORT || 'Not set',
      SMTP_SECURE: env.SMTP_SECURE ? 'true' : 'false',
    },
    rawProcessEnv: {
      // Show first few characters for debugging (don't expose full secrets)
      RESEND_API_KEY: process.env.RESEND_API_KEY ? 'Set' : 'Not set',
      SMTP2GO_API_KEY: process.env.SMTP2GO_API_KEY ? 'Set' : 'Not set',
      SMTP_USERNAME: process.env.SMTP_USERNAME ? 'Set' : 'Not set',
      SMTP_PASSWORD: process.env.SMTP_PASSWORD ? 'Set' : 'Not set',
    },
  };
}

// In production, check for required vars but don't throw
// This allows the app to build and run even without backend connection
export function assertServerEnv() {
  // Don't throw errors - just log warnings
  // This allows Vercel builds to succeed even without env vars
  if (isProd && typeof console !== 'undefined') {
    const missing = [];
    if (!env.MONGODB_URI) missing.push('MONGODB_URI');
    if (!env.JWT_SECRET) missing.push('JWT_SECRET');
    
    if (missing.length > 0) {
      console.warn(`[Config] Missing optional environment variables: ${missing.join(', ')}. App will run in limited mode.`);
    }
  }
  
  // Return status instead of throwing
  return {
    hasMongoDB: !!env.MONGODB_URI,
    hasJWT: !!env.JWT_SECRET,
    isReady: !!env.MONGODB_URI && !!env.JWT_SECRET,
  };
}


