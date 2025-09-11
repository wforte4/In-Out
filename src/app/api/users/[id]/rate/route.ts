import { NextRequest, NextResponse } from 'next/server'
/* eslint-disable @typescript-eslint/no-require-imports */
const { getServerSession } = require('next-auth')
import { authOptions } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: userId } = await params
    const { defaultHourlyRate } = await request.json()

    // Check if user has admin access - they can only update rates for users in organizations they admin
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        memberships: {
          where: { role: 'ADMIN' },
          include: { organization: true }
        }
      }
    })

    if (!adminUser || adminUser.memberships.length === 0) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Check if the target user is in any organization that the current user administers
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          include: { organization: true }
        }
      }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if they share any organization where current user is admin
    const adminOrgIds = adminUser.memberships.map(m => m.organizationId)
    const targetUserOrgIds = targetUser.memberships.map(m => m.organizationId)
    const hasSharedOrg = adminOrgIds.some(id => targetUserOrgIds.includes(id))

    if (!hasSharedOrg) {
      return NextResponse.json({ error: 'Forbidden - Can only update rates for users in your organizations' }, { status: 403 })
    }

    // Update the user's default hourly rate
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        defaultHourlyRate: defaultHourlyRate ? parseFloat(defaultHourlyRate) : null
      },
      select: {
        id: true,
        name: true,
        email: true,
        defaultHourlyRate: true
      }
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('Error updating user rate:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}