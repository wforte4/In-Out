import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Define admin-only routes
const adminRoutes = [
  '/admin',
  '/projects',
  '/reports',
  '/schedules',
  '/organization'
]

// Define routes that require admin access to specific projects
const projectRoutes = [
  '/projects/'
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Skip middleware for API routes, auth pages, and public pages
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/auth/') ||
    pathname === '/' ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname === '/dashboard' ||
    pathname === '/timesheet' ||
    pathname === '/my-schedule' ||
    pathname === '/account' ||
    pathname === '/invitations' ||
    pathname === '/terms' ||
    pathname === '/privacy'
  ) {
    return NextResponse.next()
  }

  // Check if this is an admin route
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))
  const isProjectRoute = projectRoutes.some(route => pathname.startsWith(route))

  if (isAdminRoute || isProjectRoute) {
    try {
      // Get the token directly using NextAuth's getToken
      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
      
      // If no token, redirect to signin
      if (!token) {
        const signInUrl = new URL('/auth/signin', req.url)
        signInUrl.searchParams.set('callbackUrl', req.url)
        return NextResponse.redirect(signInUrl)
      }

      // Set a header to indicate this came through admin middleware
      const response = NextResponse.next()
      response.headers.set('x-admin-route-check', 'true')
      return response
    } catch (error) {
      console.error('Error in middleware:', error)
      // On error, redirect to signin to be safe
      const signInUrl = new URL('/auth/signin', req.url)
      signInUrl.searchParams.set('callbackUrl', req.url)
      return NextResponse.redirect(signInUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}