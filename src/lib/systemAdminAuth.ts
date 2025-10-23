import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth'
import { prisma } from './prisma'
import { NextResponse } from 'next/server'

export async function verifySystemAdmin() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return { 
      isSystemAdmin: false, 
      user: null,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        id: true, 
        email: true, 
        name: true, 
        systemAdmin: true 
      }
    })

    if (!user || !user.systemAdmin) {
      return { 
        isSystemAdmin: false, 
        user,
        response: NextResponse.json({ error: 'System admin access required' }, { status: 403 })
      }
    }

    return { 
      isSystemAdmin: true, 
      user,
      response: null
    }
  } catch (error) {
    console.error('Error verifying system admin:', error)
    return { 
      isSystemAdmin: false, 
      user: null,
      response: NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}

export async function requireSystemAdmin() {
  const { isSystemAdmin, user, response } = await verifySystemAdmin()
  
  if (!isSystemAdmin || response) {
    throw response
  }
  
  return user
}