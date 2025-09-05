import { NextRequest, NextResponse } from 'next/server'
/* eslint-disable @typescript-eslint/no-require-imports */
const { getServerSession } = require('next-auth')
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { clockIn, clockOut, description, organizationId, projectId } = await request.json()
    const { id: entryId } = await params

    if (!clockIn) {
      return NextResponse.json({ error: 'Clock in time is required' }, { status: 400 })
    }

    const timeEntry = await prisma.timeEntry.findUnique({
      where: { id: entryId },
      include: { user: true }
    })

    if (!timeEntry) {
      return NextResponse.json({ error: 'Time entry not found' }, { status: 404 })
    }

    if (timeEntry.userId !== session.user.id) {
      const membership = await prisma.membership.findFirst({
        where: {
          userId: session.user.id,
          organizationId: organizationId || undefined,
          role: 'ADMIN'
        }
      })

      if (!membership) {
        return NextResponse.json({ error: 'Admin access required to edit other users\' time entries' }, { status: 403 })
      }
    }

    const clockInDate = new Date(clockIn)
    const clockOutDate = clockOut ? new Date(clockOut) : null
    
    let totalHours = null
    if (clockOutDate) {
      totalHours = (clockOutDate.getTime() - clockInDate.getTime()) / (1000 * 60 * 60)
    }

    const updatedEntry = await prisma.timeEntry.update({
      where: { id: entryId },
      data: {
        clockIn: clockInDate,
        clockOut: clockOutDate,
        totalHours,
        description,
        organizationId,
        projectId,
        editedBy: timeEntry.userId !== session.user.id ? session.user.id : null,
        editedAt: timeEntry.userId !== session.user.id ? new Date() : null
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

    return NextResponse.json({ timeEntry: updatedEntry })

  } catch (error) {
    console.error('Update time entry error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const { id: entryId } = await params

    const timeEntry = await prisma.timeEntry.findUnique({
      where: { id: entryId },
      include: { user: true }
    })

    if (!timeEntry) {
      return NextResponse.json({ error: 'Time entry not found' }, { status: 404 })
    }

    if (timeEntry.userId !== session.user.id) {
      const membership = await prisma.membership.findFirst({
        where: {
          userId: session.user.id,
          organizationId: organizationId || undefined,
          role: 'ADMIN'
        }
      })

      if (!membership) {
        return NextResponse.json({ error: 'Admin access required to delete other users\' time entries' }, { status: 403 })
      }
    }

    await prisma.timeEntry.delete({
      where: { id: entryId }
    })

    return NextResponse.json({ message: 'Time entry deleted successfully' })

  } catch (error) {
    console.error('Delete time entry error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}