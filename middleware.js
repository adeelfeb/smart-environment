import { NextResponse } from 'next/server';

/**
 * Middleware for Next.js
 * 
 * This file exists to ensure Next.js generates required manifest files
 * (middleware-manifest.json, routes-manifest.json) in dev mode.
 * 
 * You can add route protection or other middleware logic here if needed.
 */
export function middleware(request) {
  // No-op middleware - just ensures manifest files are generated
  // Add your middleware logic here if needed (e.g., auth checks, redirects)
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
}


