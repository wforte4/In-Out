import { NextRequest, NextResponse } from 'next/server'
/* eslint-disable @typescript-eslint/no-require-imports */
const { getServerSession } = require('next-auth')
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { auditTimeEntry } from '@/lib/audit'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, description, projectId, organizationId } = await request.json()

    if (action === 'in') {
      const activeEntry = await prisma.timeEntry.findFirst({
        where: {
          userId: session.user.id,
          clockOut: null
        }
      })

      if (activeEntry) {
        return NextResponse.json({ error: 'Already clocked in' }, { status: 400 })
      }

      const timeEntry = await prisma.timeEntry.create({
        data: {
          userId: session.user.id,
          clockIn: new Date(),
          description,
          projectId,
          organizationId
        }
      })

      // Audit log the clock in action
      await auditTimeEntry.clockIn(
        session.user.id,
        timeEntry.id,
        organizationId,
        projectId,
        request
      )

      return NextResponse.json({ timeEntry })
    }

    if (action === 'out') {
      const activeEntry = await prisma.timeEntry.findFirst({
        where: {
          userId: session.user.id,
          clockOut: null
        }
      })

      if (!activeEntry) {
        return NextResponse.json({ error: 'No active clock in found' }, { status: 400 })
      }

      const clockOut = new Date()
      const totalHours = (clockOut.getTime() - activeEntry.clockIn.getTime()) / (1000 * 60 * 60)

      const timeEntry = await prisma.timeEntry.update({
        where: { id: activeEntry.id },
        data: {
          clockOut,
          totalHours: Math.round(totalHours * 100) / 100,
          description: description || activeEntry.description
        }
      })

      // Audit log the clock out action
      await auditTimeEntry.clockOut(
        session.user.id,
        timeEntry.id,
        timeEntry.organizationId || '',
        timeEntry.totalHours || 0,
        request
      )

      return NextResponse.json({ timeEntry })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Clock error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const activeEntry = await prisma.timeEntry.findFirst({
      where: {
        userId: session.user.id,
        clockOut: null
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({ activeEntry })

  } catch (error) {
    console.error('Get clock status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}