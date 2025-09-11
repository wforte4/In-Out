import { NextRequest, NextResponse } from 'next/server'
/* eslint-disable @typescript-eslint/no-require-imports */
const { getServerSession } = require('next-auth')
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { auditUser } from '@/lib/audit'

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
              defaultHourlyRate: true,
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
                    email: true,
                    defaultHourlyRate: true
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

// DELETE - Remove member from organization
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { membershipId } = await request.json()

    if (!membershipId) {
      return NextResponse.json({ error: 'Membership ID required' }, { status: 400 })
    }

    // Get the membership to check permissions
    const membership = await prisma.membership.findUnique({
      where: { id: membershipId },
      include: { 
        organization: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 })
    }

    // Check if user is admin of the organization
    const userMembership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: session.user.id,
          organizationId: membership.organizationId,
        },
      },
    })

    if (!userMembership || userMembership.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Don't allow removing yourself if you're the only admin
    if (membership.userId === session.user.id) {
      const adminCount = await prisma.membership.count({
        where: {
          organizationId: membership.organizationId,
          role: 'ADMIN'
        }
      })
      
      if (adminCount <= 1) {
        return NextResponse.json({ error: 'Cannot remove the last admin from organization' }, { status: 400 })
      }
    }

    // Delete the membership
    await prisma.membership.delete({
      where: { id: membershipId }
    })

    // Audit log the user removal
    await auditUser.removeFromOrg(
      session.user.id,
      membership.user.id,
      membership.user.name || membership.user.email,
      membership.organizationId,
      request
    )

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete member error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update member role
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { membershipId, role } = await request.json()

    if (!membershipId || !role) {
      return NextResponse.json({ error: 'Membership ID and role required' }, { status: 400 })
    }

    if (!['ADMIN', 'EMPLOYEE'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Get the membership to check permissions
    const membership = await prisma.membership.findUnique({
      where: { id: membershipId },
      include: { 
        organization: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 })
    }

    // Check if user is admin of the organization
    const userMembership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: session.user.id,
          organizationId: membership.organizationId,
        },
      },
    })

    if (!userMembership || userMembership.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Don't allow demoting yourself if you're the only admin
    if (membership.userId === session.user.id && role === 'EMPLOYEE') {
      const adminCount = await prisma.membership.count({
        where: {
          organizationId: membership.organizationId,
          role: 'ADMIN'
        }
      })
      
      if (adminCount <= 1) {
        return NextResponse.json({ error: 'Cannot demote the last admin' }, { status: 400 })
      }
    }

    const oldRole = membership.role

    // Update the membership role
    await prisma.membership.update({
      where: { id: membershipId },
      data: { role }
    })

    // Audit log the role change
    await auditUser.changeRole(
      session.user.id,
      membership.user.id,
      membership.user.name || membership.user.email,
      oldRole,
      role,
      membership.organizationId,
      request
    )

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Update member role error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update member default hourly rate
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, defaultHourlyRate } = await request.json()

    if (!userId || defaultHourlyRate === undefined) {
      return NextResponse.json({ error: 'User ID and default hourly rate required' }, { status: 400 })
    }

    if (defaultHourlyRate < 0) {
      return NextResponse.json({ error: 'Hourly rate must be positive' }, { status: 400 })
    }

    // Check if user is admin of at least one organization where the target user is a member
    const targetUserMemberships = await prisma.membership.findMany({
      where: { userId },
      select: { organizationId: true }
    })

    const adminMemberships = await prisma.membership.findMany({
      where: {
        userId: session.user.id,
        role: 'ADMIN',
        organizationId: {
          in: targetUserMemberships.map(m => m.organizationId)
        }
      }
    })

    if (adminMemberships.length === 0) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get the user's current rate and information for audit log
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        defaultHourlyRate: true
      }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const oldRate = targetUser.defaultHourlyRate || 0

    // Update the user's default hourly rate
    await prisma.user.update({
      where: { id: userId },
      data: { defaultHourlyRate }
    })

    // Audit log the rate change (use the first admin organization for context)
    const organizationId = adminMemberships[0].organizationId
    await auditUser.changeRate(
      session.user.id,
      userId,
      targetUser.name || targetUser.email,
      oldRate,
      defaultHourlyRate,
      organizationId,
      request
    )

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Update member rate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}