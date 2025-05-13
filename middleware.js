// middleware.js - Updated for store pages
import { NextResponse } from 'next/server';

export function middleware(request) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;
  
  // Define public paths that don't require authentication
  const isPublicPath = path === '/' || 
                      path === '/auth' || 
                      path.startsWith('/stores/') || 
                      path.startsWith('/preview/') || 
                      path.startsWith('/api/public/') ||
                      path.startsWith('/api/stores/') ||
                      path.startsWith('/api/quote-requests') || 
                      path.startsWith('/api/auth/');

  // Get the token from cookies
  const token = request.cookies.get('token')?.value;

  // For debugging
  console.log(`Path: ${path}, Token exists: ${!!token}, isPublicPath: ${isPublicPath}`);
  
  // Redirect to dashboard if user is logged in and trying to access login page
  if (path === '/auth' && token) {
    console.log('Redirecting from auth page to dashboard (already logged in)');
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect to login if user is not logged in and trying to access protected pages
  if (!isPublicPath && !token) {
    console.log('Redirecting to auth page from protected page (not logged in)');
    // Store the path to redirect back after login
    const url = new URL('/auth', request.url);
    url.searchParams.set('callbackUrl', path);
    
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Specify the paths that this middleware should run for
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - uploads (uploaded files)
     */
    '/((?!_next/static|_next/image|favicon.ico|uploads).*)',
  ],
};