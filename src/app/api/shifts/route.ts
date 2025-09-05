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
    const scheduleId = searchParams.get('scheduleId')
    const userId = searchParams.get('userId')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organizationId: organizationId
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const where: {
      schedule?: { organizationId: string }
      scheduleId?: string
      userId?: string
    } = {
      schedule: {
        organizationId: organizationId
      }
    }

    if (scheduleId) {
      where.scheduleId = scheduleId
    }

    if (userId) {
      if (membership.role !== 'ADMIN' && userId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      where.userId = userId
    } else if (membership.role !== 'ADMIN') {
      where.userId = session.user.id
    }

    const shifts = await prisma.shift.findMany({
      where,
      include: {
        schedule: {
          select: {
            id: true,
            name: true
          }
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    })

    return NextResponse.json({ shifts })

  } catch (error) {
    console.error('Get shifts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      scheduleId,
      userId,
      projectId,
      title,
      description,
      startTime,
      endTime,
      isRecurring,
      recurringPattern,
      recurringEndDate
    } = await request.json()

    if (!scheduleId || !title || !startTime || !endTime) {
      return NextResponse.json({ 
        error: 'Schedule ID, title, start time, and end time are required' 
      }, { status: 400 })
    }

    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: { organization: true }
    })

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
    }

    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organizationId: schedule.organizationId,
        role: 'ADMIN'
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    if (userId) {
      const userMembership = await prisma.membership.findFirst({
        where: {
          userId: userId,
          organizationId: schedule.organizationId
        }
      })

      if (!userMembership) {
        return NextResponse.json({ error: 'User is not a member of this organization' }, { status: 400 })
      }
    }

    const shift = await prisma.shift.create({
      data: {
        scheduleId,
        userId,
        projectId,
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        isRecurring: isRecurring || false,
        recurringPattern,
        recurringEndDate: recurringEndDate ? new Date(recurringEndDate) : null
      },
      include: {
        schedule: {
          select: {
            id: true,
            name: true
          }
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({ shift })

  } catch (error) {
    console.error('Create shift error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}