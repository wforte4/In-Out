import { NextRequest, NextResponse } from 'next/server'
/* eslint-disable @typescript-eslint/no-require-imports */
const { getServerSession } = require('next-auth')
import { authOptions } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: projectId } = await params

    // Check if user has admin access to this project's organization
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        organization: {
          include: {
            memberships: {
              where: { user: { email: session.user.email } },
              include: { user: true }
            }
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const userMembership = project.organization.memberships[0]
    if (!userMembership || userMembership.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get project employees with user info
    const projectEmployees = await prisma.projectEmployee.findMany({
      where: { 
        projectId: projectId,
        isActive: true
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            defaultHourlyRate: true
          }
        }
      },
      orderBy: { joinedAt: 'desc' }
    })

    return NextResponse.json({ 
      projectEmployees,
      project: {
        id: project.id,
        name: project.name,
        hourlyRate: project.hourlyRate
      }
    })
  } catch (error) {
    console.error('Error fetching project employees:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: projectId } = await params
    const { userId, hourlyRate, role } = await request.json()

    // Check if user has admin access to this project's organization
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        organization: {
          include: {
            memberships: {
              where: { user: { email: session.user.email } },
              include: { user: true }
            }
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const userMembership = project.organization.memberships[0]
    if (!userMembership || userMembership.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if the user to be added is a member of the organization
    const targetUserMembership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: userId,
          organizationId: project.organizationId
        }
      }
    })

    if (!targetUserMembership) {
      return NextResponse.json({ error: 'User is not a member of this organization' }, { status: 400 })
    }

    // Check if user is already assigned to this project
    const existingAssignment = await prisma.projectEmployee.findUnique({
      where: {
        projectId_userId: {
          projectId: projectId,
          userId: userId
        }
      }
    })

    if (existingAssignment) {
      if (existingAssignment.isActive) {
        return NextResponse.json({ error: 'User is already assigned to this project' }, { status: 400 })
      }
      // Reactivate if previously deactivated
      const projectEmployee = await prisma.projectEmployee.update({
        where: { id: existingAssignment.id },
        data: {
          isActive: true,
          hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
          role: role || null,
          leftAt: null
        },
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
      })
      return NextResponse.json({ projectEmployee })
    }

    // Create new project employee assignment
    const projectEmployee = await prisma.projectEmployee.create({
      data: {
        projectId: projectId,
        userId: userId,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        role: role || null
      },
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
    })

    return NextResponse.json({ projectEmployee }, { status: 201 })
  } catch (error) {
    console.error('Error adding project employee:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}