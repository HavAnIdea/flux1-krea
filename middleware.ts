import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Define allowed paths (only these pages will be accessible)
  const allowedPaths = [
    '/', // Home page
    '/privacy-policy', // Privacy policy
    '/terms-of-service', // Terms of service
    '/404', // 404 page
    '/api', // API routes (needed for functionality)
    '/_next', // Next.js internal
    '/_vercel', // Vercel internal
  ];
  
  // Check if the path starts with any allowed path
  const isAllowed = allowedPaths.some(path => 
    pathname === path || 
    pathname.startsWith(path + '/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/_vercel/') ||
    // Allow static files
    /\.[^/]+$/.test(pathname)
  );
  
  // If path is not allowed, redirect to 404
  if (!isAllowed) {
    return NextResponse.rewrite(new URL('/404', request.url));
  }
  
  // Continue with the request
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};