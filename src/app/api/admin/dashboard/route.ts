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

    const { organizationId, timeRange } = await request.json()

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
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

    // Calculate date range
    const now = new Date()
    let startDate: Date
    let endDate: Date = new Date(now) // Use current date as end date
    
    switch (timeRange) {
      case 'week':
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 7)
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'quarter':
        startDate = new Date(now)
        startDate.setMonth(now.getMonth() - 3)
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'month':
      default:
        startDate = new Date(now)
        startDate.setMonth(now.getMonth() - 1)
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(23, 59, 59, 999)
        break
    }

    // Fetch organization members
    const allMembers = await prisma.membership.findMany({
      where: { organizationId },
      include: { user: true }
    })

    // Fetch time entries for the period
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        organizationId,
        clockIn: { 
          gte: startDate,
          lte: endDate
        },
        clockOut: { not: null }
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true, hourlyRate: true } }
      },
      orderBy: { clockIn: 'desc' }
    })

    // Fetch projects
    const projects = await prisma.project.findMany({
      where: { organizationId },
      include: {
        timeEntries: {
          where: {
            clockIn: { 
              gte: startDate,
              lte: endDate
            },
            clockOut: { not: null }
          }
        }
      }
    })

    // Calculate metrics
    const totalUsers = allMembers.length
    const activeUsers = new Set(timeEntries.map(entry => entry.userId)).size
    const totalProjects = projects.length
    const activeProjects = projects.filter(p => p.timeEntries.length > 0).length

    const totalHours = timeEntries.reduce((sum, entry) => sum + (entry.totalHours || 0), 0)
    const totalCost = timeEntries.reduce((sum, entry) => {
      const rate = entry.project?.hourlyRate || 25.00
      return sum + ((entry.totalHours || 0) * rate)
    }, 0)

    const avgHoursPerUser = activeUsers > 0 ? totalHours / activeUsers : 0

    // Top performers
    const userStats = new Map()
    timeEntries.forEach(entry => {
      const userId = entry.user.id
      if (!userStats.has(userId)) {
        userStats.set(userId, {
          userId,
          userName: entry.user.name,
          userEmail: entry.user.email,
          hours: 0,
          cost: 0
        })
      }
      const stats = userStats.get(userId)
      const rate = entry.project?.hourlyRate || 25.00
      stats.hours += entry.totalHours || 0
      stats.cost += (entry.totalHours || 0) * rate
    })

    const topPerformers = Array.from(userStats.values())
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 10)

    // Weekly activity (last 7 days)
    const weeklyActivity = []
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
      
      const dayEntries = timeEntries.filter(entry => {
        const entryDate = new Date(entry.clockIn)
        return entryDate >= dayStart && entryDate < dayEnd
      })
      
      weeklyActivity.push({
        day: dayNames[date.getDay()],
        hours: dayEntries.reduce((sum, entry) => sum + (entry.totalHours || 0), 0),
        entries: dayEntries.length
      })
    }

    // Project stats
    const projectStats = projects.map(project => {
      const projectHours = project.timeEntries.reduce((sum, entry) => sum + (entry.totalHours || 0), 0)
      const projectCost = project.timeEntries.reduce((sum, entry) => {
        const rate = project.hourlyRate || 25.00
        return sum + ((entry.totalHours || 0) * rate)
      }, 0)
      const contributors = new Set(project.timeEntries.map(entry => entry.userId)).size
      const completion = project.estimatedHours ? Math.min((projectHours / project.estimatedHours) * 100, 100) : 0

      return {
        projectId: project.id,
        projectName: project.name,
        hours: projectHours,
        cost: projectCost,
        contributors,
        completion
      }
    }).sort((a, b) => b.hours - a.hours)

    // Recent activity
    const recentActivity = timeEntries.slice(0, 20).map(entry => ({
      id: entry.id,
      type: 'time_entry' as const,
      description: `${entry.user.name || entry.user.email} logged ${(entry.totalHours || 0).toFixed(1)} hours${entry.project ? ` on ${entry.project.name}` : ''}`,
      user: {
        name: entry.user.name,
        email: entry.user.email
      },
      timestamp: entry.clockIn
    }))

    // Add project creation activities
    const recentProjects = await prisma.project.findMany({
      where: {
        organizationId,
        createdAt: { 
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        creator: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    recentProjects.forEach(project => {
      recentActivity.push({
        id: `project-${project.id}`,
        type: 'project_created' as const,
        description: `${project.creator.name || project.creator.email} created project "${project.name}"`,
        user: {
          name: project.creator.name,
          email: project.creator.email
        },
        timestamp: project.createdAt.toISOString()
      })
    })

    // Sort recent activity by timestamp
    recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    const dashboardMetrics = {
      totalUsers,
      activeUsers,
      totalProjects,
      activeProjects,
      totalHours,
      totalCost,
      avgHoursPerUser,
      topPerformers,
      recentActivity: recentActivity.slice(0, 15),
      weeklyActivity,
      projectStats,
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        timeRange
      }
    }

    return NextResponse.json(dashboardMetrics)
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}