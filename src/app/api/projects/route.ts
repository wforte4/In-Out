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

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    // Check if user is member of organization
    const membership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: session.user.id,
          organizationId,
        },
      },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 })
    }

    const projects = await prisma.project.findMany({
      where: {
        organizationId,
      },
      include: {
        creator: {
          select: {
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            timeEntries: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Calculate total hours for each project
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const totalHours = await prisma.timeEntry.aggregate({
          where: {
            projectId: project.id,
            clockOut: { not: null },
          },
          _sum: {
            totalHours: true,
          },
        })

        return {
          ...project,
          totalHours: totalHours._sum.totalHours || 0,
        }
      })
    )

    return NextResponse.json({ projects: projectsWithStats })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, organizationId, estimatedHours, hourlyRate, fixedCost } = body

    if (!name || !organizationId) {
      return NextResponse.json({ error: 'Name and organization ID are required' }, { status: 400 })
    }

    // Check if user is admin of organization
    const membership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: session.user.id,
          organizationId,
        },
      },
    })

    if (!membership || membership.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        organizationId,
        createdBy: session.user.id,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        fixedCost: fixedCost ? parseFloat(fixedCost) : null,
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

    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}