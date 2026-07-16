import mongoose from 'mongoose';
import { env } from './config';
import { isNextProductionBuild } from './buildPhase';

// Resolve MongoDB URI with a safe fallback (prevents startup crashes)
// Don't throw on import - only throw when actually trying to connect
const resolvedUri = env.MONGODB_URI;

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Connect to MongoDB using Mongoose
 * Uses cached connection in development to prevent multiple connections
 * during hot reloads
 * @returns {Promise<{success: boolean, connection?: mongoose.Connection, error?: Error}>}
 * Returns a status object instead of throwing to allow graceful degradation
 */
async function connectDB() {
  // Skip during `next build` — no live DB needed at build time
  if (isNextProductionBuild()) {
    return { success: true, connection: null };
  }

  // Check if URI is available - return status instead of throwing
  if (!resolvedUri) {
    return {
      success: false,
      error: new Error('MONGODB_URI environment variable is not set. Database connection unavailable.'),
      code: 'NO_DB_URI',
    };
  }

  // If already connected, return the existing connection
  if (cached.conn) {
    return {
      success: true,
      connection: cached.conn,
    };
  }

  // If connection is in progress, wait for it
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 3000, // Reduced to 3s for faster failure
      socketTimeoutMS: 3000, // Reduced socket timeout
      connectTimeoutMS: 3000, // Connection timeout
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 1, // Maintain at least 1 socket connection
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
    };

    // Create connection promise with timeout wrapper for extra safety
    cached.promise = Promise.race([
      mongoose.connect(resolvedUri, opts).then((mongoose) => mongoose),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database connection timeout after 3 seconds')), 3000)
      )
    ])
      .then((mongoose) => mongoose)
      .catch((error) => {
        // Reset promise on error to allow retry
        cached.promise = null;
        throw error;
      });
  }

  try {
    // Wait for connection and cache it
    cached.conn = await cached.promise;
    return {
      success: true,
      connection: cached.conn,
    };
  } catch (e) {
    // Reset promise on error to allow retry
    cached.promise = null;
    
    // Provide more detailed error information
    let errorMessage = 'Database connection failed';
    let errorCode = 'CONNECTION_FAILED';
    
    if (e.message) {
      errorMessage = e.message;
      if (e.message.includes('timeout')) {
        errorCode = 'CONNECTION_TIMEOUT';
      } else if (e.message.includes('authentication')) {
        errorCode = 'AUTHENTICATION_FAILED';
      } else if (e.message.includes('ENOTFOUND') || e.message.includes('getaddrinfo')) {
        errorCode = 'DNS_RESOLUTION_FAILED';
        errorMessage = 'Cannot resolve database host. Please check your MONGODB_URI.';
      }
    }
    
    return {
      success: false,
      error: new Error(errorMessage),
      code: errorCode,
      originalError: e,
    };
  }
}

// Export both the new function and a legacy wrapper for backward compatibility
export default connectDB;

// Helper function for API routes that need to check connection status
export async function requireDB() {
  const result = await connectDB();
  if (!result.success) {
    throw result.error || new Error('Database connection unavailable');
  }
  return result.connection;
}
