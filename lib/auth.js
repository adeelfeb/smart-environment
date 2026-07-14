import jwt from 'jsonwebtoken';
import * as cookie from 'cookie';
import connectDB from './db';
import User from '../models/User';
import { env } from './config';
import { ensureUserHasRole } from './roles';

export const TOKEN_COOKIE = 'token';
const TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function signToken(payload) {
  if (!env.JWT_SECRET) {
    // Don't throw - return null to indicate auth is not available
    // This allows the app to work in limited mode without backend
    console.warn('[Auth] JWT_SECRET not set. Authentication unavailable.');
    return null;
  }
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: TOKEN_MAX_AGE });
}

/**
 * Determine whether the current request is using HTTPS.
 * We prefer request-derived data (x-forwarded-proto, encrypted connection)
 * instead of only NODE_ENV so that deployments behind Nginx / reverse proxies
 * work correctly even if they terminate TLS.
 */
function isSecureRequest(req) {
  if (!req) {
    // Fallback to environment-only check if we don't have the request
    return env.NODE_ENV === 'production';
  }

  const protoHeader =
    req.headers['x-forwarded-proto'] ||
    req.headers['X-Forwarded-Proto'] ||
    '';

  const proto = Array.isArray(protoHeader)
    ? protoHeader[0]
    : String(protoHeader || '').split(',')[0].trim();

  if (proto) {
    return proto.toLowerCase() === 'https';
  }

  if (req.connection?.encrypted || req.secure) {
    return true;
  }

  return false;
}

export function setAuthCookie(res, token, req) {
  const secure = isSecureRequest(req);
  res.setHeader(
    'Set-Cookie',
    cookie.serialize(TOKEN_COOKIE, token, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
      maxAge: TOKEN_MAX_AGE,
    })
  );
}

export function clearAuthCookie(res) {
  const secure = env.NODE_ENV === 'production';
  res.setHeader(
    'Set-Cookie',
    cookie.serialize(TOKEN_COOKIE, '', {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
      expires: new Date(0),
    })
  );
}

export function extractTokenFromRequest(req) {
  const headerToken = req.headers.authorization || req.headers.Authorization;
  if (headerToken && headerToken.startsWith('Bearer ')) {
    return headerToken.slice(7).trim();
  }
  if (req.headers.cookie) {
    const cookies = cookie.parse(req.headers.cookie);
    if (cookies && cookies[TOKEN_COOKIE]) {
      return cookies[TOKEN_COOKIE];
    }
  }
  if (req.cookies && req.cookies[TOKEN_COOKIE]) {
    return req.cookies[TOKEN_COOKIE];
  }
  return null;
}

export async function getUserFromRequest(req) {
  const token = extractTokenFromRequest(req);
  if (!token) return null;
  try {
    if (!env.JWT_SECRET) return null;
    const decoded = jwt.verify(token, env.JWT_SECRET);
    
    // Try to connect to DB, but don't fail if unavailable
    const dbResult = await connectDB();
    if (!dbResult.success) {
      // Database not available - return null (user not authenticated)
      return null;
    }
    
    const user = await User.findById(decoded.id).select('-password');
    if (user) {
      try {
        await ensureUserHasRole(user);
      } catch (roleError) {
        // If role check fails, still return user (graceful degradation)
        console.warn('[Auth] Role check failed:', roleError.message);
      }
    }
    return user || null;
  } catch (e) {
    // Silently fail - return null (user not authenticated)
    return null;
  }
}


