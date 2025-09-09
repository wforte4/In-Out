import { NextRequest, NextResponse } from 'next/server'
/* eslint-disable @typescript-eslint/no-require-imports */
const { getServerSession } = require('next-auth')
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { organizationId, reportType, startDate, endDate } = await request.json()

    if (!organizationId || !startDate || !endDate) {
      return NextResponse.json({ error: 'Organization, start date, and end date are required' }, { status: 400 })
    }

    // Check if user is admin of the organization
    const membership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: session.user.id,
          organizationId: organizationId,
        },
      },
    })

    if (!membership || membership.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    
    // Fetch time entries for the date range
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        organizationId: organizationId,
        clockIn: {
          gte: start,
          lte: end,
        },
        clockOut: {
          not: null,
        },
      },
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
            hourlyRate: true,
          },
        },
      },
      orderBy: {
        clockIn: 'desc',
      },
    })

    // Calculate report data
    const totalHours = timeEntries.reduce((sum, entry) => sum + (entry.totalHours || 0), 0)
    
    // Calculate costs for each entry
    const entriesWithCost = timeEntries.map(entry => {
      const hours = entry.totalHours || 0
      const rate = entry.project?.hourlyRate || 25.00 // Default rate if no project rate
      const calculatedCost = hours * rate
      
      return {
        ...entry,
        hourlyRate: rate,
        calculatedCost,
      }
    })

    const totalCost = entriesWithCost.reduce((sum, entry) => sum + entry.calculatedCost, 0)

    // Employee breakdown
    const employeeMap = new Map()
    entriesWithCost.forEach(entry => {
      const userId = entry.user.id
      if (!employeeMap.has(userId)) {
        employeeMap.set(userId, {
          userId,
          userName: entry.user.name,
          userEmail: entry.user.email,
          hours: 0,
          cost: 0,
          entries: 0,
        })
      }
      const employee = employeeMap.get(userId)
      employee.hours += entry.totalHours || 0
      employee.cost += entry.calculatedCost
      employee.entries += 1
    })

    const employeeBreakdown = Array.from(employeeMap.values()).sort((a, b) => b.hours - a.hours)

    // Project breakdown
    const projectMap = new Map()
    entriesWithCost.forEach(entry => {
      const projectId = entry.project?.id || 'no-project'
      const projectName = entry.project?.name || 'No Project'
      
      if (!projectMap.has(projectId)) {
        projectMap.set(projectId, {
          projectId,
          projectName,
          hours: 0,
          cost: 0,
          entries: 0,
        })
      }
      const project = projectMap.get(projectId)
      project.hours += entry.totalHours || 0
      project.cost += entry.calculatedCost
      project.entries += 1
    })

    const projectBreakdown = Array.from(projectMap.values()).sort((a, b) => b.hours - a.hours)

    // Format time entries for detailed reports
    const formattedTimeEntries = entriesWithCost.map(entry => ({
      id: entry.id,
      clockIn: entry.clockIn,
      clockOut: entry.clockOut,
      totalHours: entry.totalHours,
      description: entry.description,
      user: {
        name: entry.user.name,
        email: entry.user.email,
      },
      project: entry.project ? {
        id: entry.project.id,
        name: entry.project.name,
      } : null,
      hourlyRate: entry.hourlyRate,
      calculatedCost: entry.calculatedCost,
    }))

    const reportData = {
      totalHours,
      totalCost,
      employeeBreakdown,
      projectBreakdown,
      timeEntries: formattedTimeEntries,
    }

    return NextResponse.json(reportData)
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}