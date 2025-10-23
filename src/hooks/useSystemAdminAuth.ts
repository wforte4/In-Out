import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { verifySystemAdmin, resetState } from '../store/slices/systemAdminSlice'

export function useSystemAdminAuth() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const dispatch = useAppDispatch()
  
  const { 
    isSystemAdmin, 
    verificationLoading, 
    error 
  } = useAppSelector((state) => state.systemAdmin)

  useEffect(() => {
    const checkSystemAdmin = async () => {
      if (status === 'loading') return
      
      if (!session) {
        router.push('/auth/signin')
        return
      }

      try {
        await dispatch(verifySystemAdmin()).unwrap()
      } catch (error) {
        console.error('System admin verification failed:', error)
        router.push('/dashboard')
      }
    }

    checkSystemAdmin()
    
    return () => {
      dispatch(resetState())
    }
  }, [session, status, router, dispatch])

  return {
    isSystemAdmin,
    loading: verificationLoading,
    error,
    session,
    status
  }
}