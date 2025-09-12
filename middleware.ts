import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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

export default withAuth(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function middleware(req: NextRequest & { nextauth: { token: any } }) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

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
      // If no token or token is expired, redirect to signin
      if (!token || token.expired) {
        const signInUrl = new URL('/auth/signin', req.url)
        signInUrl.searchParams.set('callbackUrl', req.url)
        return NextResponse.redirect(signInUrl)
      }

      // Check if user has admin access to any organization
      try {
        // We need to check the user's memberships to see if they have admin access
        // Since we can't easily do a database query in middleware, we'll do a lighter check
        // and let the page handle the detailed authorization
        
        // For now, just ensure they're authenticated and let the page components
        // handle the admin check more gracefully without the flash
        
        // Set a header to indicate this came through admin middleware
        const response = NextResponse.next()
        response.headers.set('x-admin-route-check', 'true')
        return response
      } catch (error) {
        console.error('Error in admin middleware:', error)
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token && !token.expired,
    },
  }
)

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