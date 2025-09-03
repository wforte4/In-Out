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

    const {
      userId,
      title,
      description,
      startTime,
      endTime,
      isRecurring,
      recurringPattern,
      recurringEndDate
    } = await request.json()

    const { id: shiftId } = await params

    if (!title || !startTime || !endTime) {
      return NextResponse.json({ 
        error: 'Title, start time, and end time are required' 
      }, { status: 400 })
    }

    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: { 
        schedule: { 
          include: { organization: true } 
        } 
      }
    })

    if (!shift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 })
    }

    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organizationId: shift.schedule.organizationId,
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
          organizationId: shift.schedule.organizationId
        }
      })

      if (!userMembership) {
        return NextResponse.json({ error: 'User is not a member of this organization' }, { status: 400 })
      }
    }

    const updatedShift = await prisma.shift.update({
      where: { id: shiftId },
      data: {
        userId,
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
        }
      }
    })

    return NextResponse.json({ shift: updatedShift })

  } catch (error) {
    console.error('Update shift error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: shiftId } = await params

    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: { 
        schedule: { 
          include: { organization: true } 
        } 
      }
    })

    if (!shift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 })
    }

    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organizationId: shift.schedule.organizationId,
        role: 'ADMIN'
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    await prisma.shift.delete({
      where: { id: shiftId }
    })

    return NextResponse.json({ message: 'Shift deleted successfully' })

  } catch (error) {
    console.error('Delete shift error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}