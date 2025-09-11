import { NextRequest, NextResponse } from 'next/server'
/* eslint-disable @typescript-eslint/no-require-imports */
const { getServerSession } = require('next-auth')
import { authOptions } from '../../../../../../lib/auth'
import { prisma } from '../../../../../../lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; employeeId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: projectId, employeeId } = await params
    const { hourlyRate, role } = await request.json()

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

    // Update the project employee
    const projectEmployee = await prisma.projectEmployee.update({
      where: { id: employeeId },
      data: {
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

    return NextResponse.json({ projectEmployee })
  } catch (error) {
    console.error('Error updating project employee:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; employeeId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: projectId, employeeId } = await params

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

    // Soft delete by setting isActive to false and leftAt to now
    await prisma.projectEmployee.update({
      where: { id: employeeId },
      data: {
        isActive: false,
        leftAt: new Date()
      }
    })

    return NextResponse.json({ message: 'Employee removed from project' })
  } catch (error) {
    console.error('Error removing project employee:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}