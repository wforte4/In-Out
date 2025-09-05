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
    const userId = searchParams.get('userId')
    const organizationId = searchParams.get('organizationId')
    const projectId = searchParams.get('projectId')

    if (userId && userId !== session.user.id) {
      const membership = await prisma.membership.findFirst({
        where: {
          userId: session.user.id,
          organizationId: organizationId || undefined,
          role: 'ADMIN'
        }
      })

      if (!membership) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        userId: userId || session.user.id,
        ...(projectId && { projectId }),
        ...(organizationId && { organizationId }),
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
          }
        },
        organization: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: {
        clockIn: 'desc'
      }
    })

    return NextResponse.json({ timeEntries })

  } catch (error) {
    console.error('Get time entries error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { clockIn, clockOut, description, projectId, organizationId, userId } = await request.json()

    if (!clockIn) {
      return NextResponse.json({ error: 'Clock in time is required' }, { status: 400 })
    }

    // Check if user is trying to create entry for another user
    const targetUserId = userId || session.user.id
    if (targetUserId !== session.user.id) {
      const membership = await prisma.membership.findFirst({
        where: {
          userId: session.user.id,
          organizationId: organizationId || undefined,
          role: 'ADMIN'
        }
      })

      if (!membership) {
        return NextResponse.json({ error: 'Admin access required to create entries for other users' }, { status: 403 })
      }
    }

    const clockInDate = new Date(clockIn)
    const clockOutDate = clockOut ? new Date(clockOut) : null
    
    let totalHours = null
    if (clockOutDate) {
      totalHours = (clockOutDate.getTime() - clockInDate.getTime()) / (1000 * 60 * 60)
    }

    const timeEntry = await prisma.timeEntry.create({
      data: {
        userId: targetUserId,
        clockIn: clockInDate,
        clockOut: clockOutDate,
        totalHours,
        description,
        projectId,
        organizationId,
        editedBy: targetUserId !== session.user.id ? session.user.id : null,
        editedAt: targetUserId !== session.user.id ? new Date() : null
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
          }
        },
        organization: {
          select: {
            id: true,
            name: true,
          }
        },
        editor: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({ timeEntry })

  } catch (error) {
    console.error('Create time entry error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}