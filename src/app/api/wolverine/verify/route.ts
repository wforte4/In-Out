import { verifySystemAdmin } from '@/lib/systemAdminAuth'

export async function GET() {
  try {
    const { isSystemAdmin, response } = await verifySystemAdmin()
    
    if (!isSystemAdmin && response) {
      return response
    }

    return Response.json({ 
      success: true, 
      message: 'System admin access verified' 
    })
  } catch (error) {
    console.error('System admin verification error:', error)
    return Response.json({ 
      error: 'Verification failed' 
    }, { status: 500 })
  }
}