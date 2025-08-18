import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  // Handle subdomain routing (optional feature)
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host');

  if (hostname) {
    const subdomain = hostname.split('.')[0];

    // If there's a subdomain and it's not 'www', add it to the request headers
    // This can be used later to resolve organizationId from subdomain
    if (
      subdomain &&
      subdomain !== 'www' &&
      subdomain !== 'localhost:3000' &&
      !subdomain.includes('localhost')
    ) {
      // Add subdomain to request headers for API routes to access
      const response = await updateSession(request);
      if (response) {
        response.headers.set('x-organization-subdomain', subdomain);
        return response;
      }
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
