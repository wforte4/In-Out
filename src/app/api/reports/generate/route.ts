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

    const { reportId, format, organizationId, filters } = await request.json()

    if (!organizationId || !reportId || !format) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
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

    // Generate report data based on reportId
    const reportData = await generateReportData(reportId, organizationId, filters)
    
    // Create download URL (in real implementation, this would generate actual files)
    const downloadUrl = await createDownloadFile(reportData, format, reportId)

    return NextResponse.json({
      success: true,
      downloadUrl,
      fileName: `${reportId}-${new Date().toISOString().split('T')[0]}.${format}`,
      recordCount: reportData.length
    })

  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function generateReportData(reportId: string, organizationId: string, filters: Record<string, unknown>) {
  let startDate: Date
  let endDate: Date

  if (filters?.startDate && filters?.endDate) {
    // Custom date range
    startDate = new Date(filters.startDate as string)
    endDate = new Date(filters.endDate as string)
    // Set end date to end of day
    endDate.setHours(23, 59, 59, 999)
  } else {
    // Use timeRange for backward compatibility
    const now = new Date()
    const timeRangeDays = (filters?.timeRange as number) || 30
    startDate = new Date(now.getTime() - timeRangeDays * 24 * 60 * 60 * 1000)
    endDate = now
  }

  switch (reportId) {
    case 'time-tracking-summary':
      const timeEntryWhere: Record<string, unknown> = {
        organizationId,
        clockIn: { gte: startDate, lte: endDate },
        clockOut: { not: null }
      }
      
      // Filter by specific employees if provided
      if (filters?.employeeIds && Array.isArray(filters.employeeIds) && filters.employeeIds.length > 0) {
        timeEntryWhere.userId = { in: filters.employeeIds as string[] }
      }
      
      // Filter by specific projects if provided
      if (filters?.projectIds && Array.isArray(filters.projectIds) && filters.projectIds.length > 0) {
        timeEntryWhere.projectId = { in: filters.projectIds as string[] }
      }
      
      const timeEntries = await prisma.timeEntry.findMany({
        where: timeEntryWhere,
        include: {
          user: { select: { name: true, email: true } },
          project: { select: { name: true } }
        },
        orderBy: { clockIn: 'desc' }
      })
      
      // Format the data for better readability
      return timeEntries.map(entry => ({
        employeeName: entry.user.name || entry.user.email,
        employeeEmail: entry.user.email,
        projectName: entry.project?.name || 'No Project',
        clockIn: entry.clockIn.toISOString().replace('T', ' ').substring(0, 19),
        clockOut: entry.clockOut?.toISOString().replace('T', ' ').substring(0, 19) || '',
        totalHours: entry.totalHours ? parseFloat(entry.totalHours.toFixed(2)) : 0,
        date: entry.clockIn.toISOString().split('T')[0]
      }))

    case 'project-profitability':
      const projects = await prisma.project.findMany({
        where: { organizationId },
        include: {
          timeEntries: {
            where: {
              clockIn: { gte: startDate, lte: endDate },
              clockOut: { not: null }
            },
            include: {
              user: { select: { defaultHourlyRate: true } }
            }
          },
          projectCosts: true,
          projectEmployees: { include: { user: true } }
        }
      })

      // Filter by specific projects if provided
      const filteredProjects = filters?.projectIds && Array.isArray(filters.projectIds) && filters.projectIds.length > 0
        ? projects.filter(project => (filters.projectIds as string[]).includes(project.id))
        : projects
      
      return filteredProjects.map(project => {
        const totalHours = project.timeEntries.reduce((sum, entry) => sum + (entry.totalHours || 0), 0)
        const totalCosts = project.projectCosts.reduce((sum, cost) => sum + cost.amount, 0)
        const estimatedRevenue = totalHours * (project.hourlyRate || 50)
        const profit = estimatedRevenue - totalCosts
        
        return {
          projectName: project.name,
          totalHours: parseFloat(totalHours.toFixed(2)),
          totalCosts: parseFloat(totalCosts.toFixed(2)),
          estimatedRevenue: parseFloat(estimatedRevenue.toFixed(2)),
          profit: parseFloat(profit.toFixed(2)),
          profitMargin: estimatedRevenue > 0 ? parseFloat(((profit / estimatedRevenue) * 100).toFixed(1)) + '%' : 'N/A',
          roi: totalCosts > 0 ? parseFloat(((profit / totalCosts) * 100).toFixed(1)) + '%' : 'N/A'
        }
      })

    case 'team-utilization':
      const userWhere: Record<string, unknown> = {
        memberships: {
          some: { organizationId }
        }
      }
      
      // Filter by specific employees if provided
      if (filters?.employeeIds && Array.isArray(filters.employeeIds) && filters.employeeIds.length > 0) {
        userWhere.id = { in: filters.employeeIds as string[] }
      }
      
      const users = await prisma.user.findMany({
        where: userWhere,
        include: {
          timeEntries: {
            where: {
              organizationId,
              clockIn: { gte: startDate, lte: endDate },
              clockOut: { not: null }
            },
            include: {
              project: { select: { name: true } }
            }
          }
        }
      })

      return users.map(user => {
        const totalHours = user.timeEntries.reduce((sum, entry) => sum + (entry.totalHours || 0), 0)
        const projectBreakdown = user.timeEntries.reduce((acc, entry) => {
          const projectName = entry.project?.name || 'No Project'
          acc[projectName] = (acc[projectName] || 0) + (entry.totalHours || 0)
          return acc
        }, {} as Record<string, number>)
        
        // Format project breakdown as readable string
        const projectBreakdownText = Object.entries(projectBreakdown)
          .map(([project, hours]) => `${project}: ${parseFloat(hours.toFixed(2))}h`)
          .join('; ')

        return {
          employeeName: user.name || user.email,
          employeeEmail: user.email,
          totalHours: parseFloat(totalHours.toFixed(2)),
          utilizationRate: parseFloat(Math.min((totalHours / (40 * 4)) * 100, 100).toFixed(1)) + '%', // Assuming 40h/week
          projectBreakdown: projectBreakdownText || 'No projects'
        }
      })

    case 'cost-breakdown':
      const costs = await prisma.projectCost.findMany({
        where: {
          project: { organizationId },
          createdAt: { gte: startDate, lte: endDate }
        },
        include: {
          project: { select: { id: true, name: true } },
          user: { select: { name: true, email: true } },
          creator: { select: { name: true, email: true } }
        },
        orderBy: { createdAt: 'desc' }
      })

      // Filter by specific projects if provided
      const filteredCosts = filters?.projectIds && Array.isArray(filters.projectIds) && filters.projectIds.length > 0
        ? costs.filter(cost => (filters.projectIds as string[]).includes(cost.project.id))
        : costs
      
      return filteredCosts.map(cost => ({
        projectName: cost.project.name,
        costType: cost.costType.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
        amount: parseFloat(cost.amount.toFixed(2)),
        description: cost.description || 'No description',
        assignedTo: cost.user ? (cost.user.name || cost.user.email) : 'All team members',
        createdBy: cost.creator.name || cost.creator.email,
        createdAt: cost.createdAt.toISOString().split('T')[0]
      }))

    default:
      return []
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function createDownloadFile(data: Record<string, unknown>[], format: string, _reportId: string): Promise<string> {
  // In a real implementation, you would:
  // 1. Convert data to the requested format (CSV, PDF, XLSX)
  // 2. Save the file to cloud storage (S3, Google Cloud, etc.)
  // 3. Return a signed download URL
  
  // For demo purposes, we'll create a data URL
  let content = ''

  if (format === 'csv') {
    if (data.length > 0) {
      const headers = Object.keys(data[0]).join(',')
      const rows = data.map(row => Object.values(row).join(',')).join('\n')
      content = `${headers}\n${rows}`
    }
    
    return `data:text/csv;charset=utf-8,${encodeURIComponent(content)}`
  }

  if (format === 'json') {
    content = JSON.stringify(data, null, 2)
    return `data:application/json;charset=utf-8,${encodeURIComponent(content)}`
  }

  // For PDF/XLSX, return a placeholder URL
  return `data:text/plain;charset=utf-8,Report generated: ${data.length} records`
}