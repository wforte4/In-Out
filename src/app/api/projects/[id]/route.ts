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

    const { id: projectId } = await params
    const body = await request.json()
    const { name, description, status, estimatedHours, hourlyRate, fixedCost } = body

    // Check if project exists and user is admin
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        organization: {
          include: {
            memberships: {
              where: { userId: session.user.id },
            },
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const membership = project.organization.memberships[0]
    if (!membership || membership.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(estimatedHours !== undefined && { estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null }),
        ...(hourlyRate !== undefined && { hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null }),
        ...(fixedCost !== undefined && { fixedCost: fixedCost ? parseFloat(fixedCost) : null }),
      },
      include: {
        creator: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ project: updatedProject })
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: projectId } = await params

    // Check if project exists and user is admin
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        organization: {
          include: {
            memberships: {
              where: { userId: session.user.id },
            },
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const membership = project.organization.memberships[0]
    if (!membership || membership.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    await prisma.project.delete({
      where: { id: projectId },
    })

    return NextResponse.json({ message: 'Project deleted successfully' })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: projectId } = await params

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        creator: {
          select: {
            name: true,
            email: true,
          },
        },
        organization: true,
        timeEntries: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          where: {
            clockOut: { not: null },
          },
          orderBy: {
            clockIn: 'desc',
          },
        },
        projectCosts: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            creator: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Check if user is admin of organization
    const membership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: session.user.id,
          organizationId: project.organizationId,
        },
      },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 })
    }

    if (membership.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Calculate project statistics
    const totalHours = project.timeEntries.reduce((sum, entry) => sum + (entry.totalHours || 0), 0)
    const totalCost = project.projectCosts.reduce((sum, cost) => sum + cost.amount, 0)
    const uniqueContributors = new Set(project.timeEntries.map(entry => entry.userId)).size

    return NextResponse.json({
      project: {
        ...project,
        stats: {
          totalHours,
          totalCost,
          uniqueContributors,
          completionPercentage: project.estimatedHours ? Math.min((totalHours / project.estimatedHours) * 100, 100) : null,
        },
      },
      isAdmin: membership.role === 'ADMIN',
    })
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}