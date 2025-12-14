import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/leads', '/companies', '/scraper', '/emails', '/settings']

// Routes that should redirect to dashboard if authenticated
const authRoutes = ['/login']

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const pathname = request.nextUrl.pathname

  // Check if route needs authentication
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => pathname === route)

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

