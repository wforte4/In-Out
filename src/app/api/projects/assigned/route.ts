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

    // Get projects where the user is assigned as a project employee
    const projectEmployees = await prisma.projectEmployee.findMany({
      where: {
        userId: session.user.id,
        project: {
          organizationId,
          status: 'ACTIVE'
        }
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
            hourlyRate: true,
            estimatedHours: true,
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
          }
        }
      }
    })

    // Extract projects from project employees
    const assignedProjects = projectEmployees.map(pe => pe.project)

    // Calculate total hours for each project
    const projectsWithStats = await Promise.all(
      assignedProjects.map(async (project) => {
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
    console.error('Error fetching assigned projects:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}