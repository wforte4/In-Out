import { NextRequest, NextResponse } from 'next/server'
/* eslint-disable @typescript-eslint/no-require-imports */
const { getServerSession } = require('next-auth')
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    // If organizationId is provided, return members of that organization
    if (organizationId) {
      // Check if user is admin of organization
      const userMembership = await prisma.membership.findUnique({
        where: {
          userId_organizationId: {
            userId: session.user.id,
            organizationId,
          },
        },
      })

      if (!userMembership || userMembership.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }

      const members = await prisma.membership.findMany({
        where: {
          organizationId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          joinedAt: 'asc',
        },
      })

      return NextResponse.json({ members })
    }

    // Otherwise, return user's organizations (existing behavior)
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