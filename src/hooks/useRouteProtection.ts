'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface UseRouteProtectionOptions {
  requireAuth?: boolean
  redirectTo?: string
  allowedRoles?: string[]
}

export function useRouteProtection({
  requireAuth = true,
  redirectTo = '/auth/signin',
  allowedRoles = []
}: UseRouteProtectionOptions = {}) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    // Check authentication requirement
    if (requireAuth && !session) {
      const currentPath = window.location.pathname
      const signInUrl = `${redirectTo}?callbackUrl=${encodeURIComponent(currentPath)}`
      router.push(signInUrl)
      return
    }

    // Check role requirements
    if (allowedRoles.length > 0 && session) {
      // For now, we'll implement basic role checking
      // This can be expanded based on your role system
      const hasRequiredRole = true // Placeholder - implement actual role checking
      
      if (!hasRequiredRole) {
        router.push('/dashboard')
        return
      }
    }
  }, [session, status, router, requireAuth, redirectTo, allowedRoles])

  return {
    session,
    status,
    isLoading: status === 'loading',
    isAuthenticated: !!session,
  }
}