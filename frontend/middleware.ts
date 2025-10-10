import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('shopping_list_token')?.value;
  
  // Check if trying to access protected routes
  const isProtectedRoute = !request.nextUrl.pathname.startsWith('/login');
  
  if (isProtectedRoute && !token) {
    // Check localStorage via headers (not available in middleware, so we skip this)
    // Instead, we'll handle auth in the client components
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

