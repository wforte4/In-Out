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
    const projectId = searchParams.get('projectId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
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

    // Build where clause for time entries
    const whereClause: { organizationId: string; clockOut: { not: null }; projectId?: string; clockIn?: { gte?: Date; lte?: Date } } = {
      organizationId,
      clockOut: { not: null },
    }

    if (projectId) {
      whereClause.projectId = projectId
    }

    if (startDate) {
      whereClause.clockIn = { gte: new Date(startDate) }
    }

    if (endDate) {
      if (whereClause.clockIn) {
        whereClause.clockIn = { ...whereClause.clockIn, lte: new Date(endDate) }
      } else {
        whereClause.clockIn = { lte: new Date(endDate) }
      }
    }

    // Fetch time entries with related data
    const timeEntries = await prisma.timeEntry.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        organization: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        clockIn: 'asc',
      },
    })

    // Fetch project costs if specific project
    let projectCosts: Array<{ id: string; costType: string; amount: number; description: string | null; createdAt: Date; user: { id: string; name: string | null; email: string } | null }> = []
    if (projectId) {
      projectCosts = await prisma.projectCost.findMany({
        where: { projectId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })
    }

    // Format data for QuickBooks IIF format
    const qbData = {
      meta: {
        exportDate: new Date().toISOString(),
        organizationName: timeEntries[0]?.organization?.name || 'Unknown',
        projectName: timeEntries[0]?.project?.name || 'All Projects',
        dateRange: {
          start: startDate,
          end: endDate,
        },
      },
      timeEntries: timeEntries.map(entry => ({
        date: new Date(entry.clockIn).toISOString().split('T')[0],
        employee: entry.user.name || entry.user.email,
        project: entry.project?.name || 'No Project',
        description: entry.description || '',
        hours: entry.totalHours || 0,
        clockIn: entry.clockIn,
        clockOut: entry.clockOut,
        // Calculate cost if hourly rates exist
        cost: 0, // Will be calculated based on project costs
      })),
      summary: {
        totalHours: timeEntries.reduce((sum, entry) => sum + (entry.totalHours || 0), 0),
        totalEntries: timeEntries.length,
        uniqueEmployees: new Set(timeEntries.map(entry => entry.userId)).size,
        dateRange: {
          earliest: timeEntries[0]?.clockIn,
          latest: timeEntries[timeEntries.length - 1]?.clockIn,
        },
      },
      projectCosts: projectCosts.map(cost => ({
        costType: cost.costType,
        amount: cost.amount,
        description: cost.description,
        employee: cost.user ? (cost.user.name || cost.user.email) : 'All Employees',
        createdAt: cost.createdAt,
      })),
      // QuickBooks IIF format headers for time tracking
      iifFormat: {
        headers: [
          'TIMEACT',
          'DATE',
          'JOB',
          'EMP',
          'ITEM',
          'DURATION',
          'NOTE',
        ],
        rows: timeEntries.map(entry => [
          'TIMEACT',
          new Date(entry.clockIn).toISOString().split('T')[0],
          entry.project?.name || 'General',
          entry.user.name || entry.user.email,
          'Labor',
          entry.totalHours?.toString() || '0',
          entry.description || '',
        ]),
      },
    }

    return NextResponse.json(qbData)
  } catch (error) {
    console.error('Error generating QuickBooks export:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}