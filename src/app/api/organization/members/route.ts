import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const memberships = await prisma.membership.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        organization: {
          include: {
            memberships: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        }
      }
    })

    const organizations = memberships.map(membership => ({
      ...membership.organization,
      userRole: membership.role,
      isAdmin: membership.role === 'ADMIN'
    }))

    return NextResponse.json({ organizations })

  } catch (error) {
    console.error('Get organization members error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}