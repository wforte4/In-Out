import { NextRequest, NextResponse } from 'next/server'
/* eslint-disable @typescript-eslint/no-require-imports */
const { getServerSession } = require('next-auth')
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    const { id: organizationId } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a member of the organization
    const membership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: session.user.id,
          organizationId: organizationId,
        },
      },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // For employees, only return themselves. For admins, return all members
    if (membership.role === 'EMPLOYEE') {
      const employeeMembership = await prisma.membership.findUnique({
        where: {
          userId_organizationId: {
            userId: session.user.id,
            organizationId: organizationId,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              defaultHourlyRate: true
            }
          }
        }
      })

      return NextResponse.json({
        members: employeeMembership ? [employeeMembership] : []
      })
    }

    // Admin can see all members
    const members = await prisma.membership.findMany({
      where: {
        organizationId: organizationId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            defaultHourlyRate: true
          }
        }
      },
      orderBy: {
        user: {
          name: 'asc'
        }
      }
    })

    return NextResponse.json({ members })

  } catch (error) {
    console.error('Error fetching organization members:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}