import { NextRequest, NextResponse } from 'next/server'
/* eslint-disable @typescript-eslint/no-require-imports */
const { getServerSession } = require('next-auth')
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAuditLogs, type AuditLogFilters } from '@/lib/audit'
import { withRateLimit } from '@/lib/rateLimit'

async function handleAuditLogsRequest(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin of at least one organization
    const adminMemberships = await prisma.membership.findMany({
      where: {
        userId: session.user.id,
        role: 'ADMIN'
      },
      select: { organizationId: true }
    })

    if (adminMemberships.length === 0) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const userId = searchParams.get('userId')
    const action = searchParams.get('action')
    const entityType = searchParams.get('entityType')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // If organizationId is specified, verify admin access to that org
    if (organizationId && !adminMemberships.some(m => m.organizationId === organizationId)) {
      return NextResponse.json({ error: 'Admin access required for this organization' }, { status: 403 })
    }

    const filters: AuditLogFilters = {
      organizationId: organizationId || undefined,
      userId: userId || undefined,
      action: action as AuditLogFilters['action'],
      entityType: entityType || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit,
      offset
    }

    // If no specific org requested, limit to admin orgs
    if (!organizationId) {
      const result = await prisma.auditLog.findMany({
        where: {
          organizationId: {
            in: adminMemberships.map(m => m.organizationId)
          },
          ...(userId && { userId }),
          ...(action && { action }),
          ...(entityType && { entityType }),
          ...(startDate || endDate ? {
            createdAt: {
              ...(startDate && { gte: new Date(startDate) }),
              ...(endDate && { lte: new Date(endDate) })
            }
          } : {})
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          organization: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      })

      const total = await prisma.auditLog.count({
        where: {
          organizationId: {
            in: adminMemberships.map(m => m.organizationId)
          },
          ...(userId && { userId }),
          ...(action && { action }),
          ...(entityType && { entityType }),
          ...(startDate || endDate ? {
            createdAt: {
              ...(startDate && { gte: new Date(startDate) }),
              ...(endDate && { lte: new Date(endDate) })
            }
          } : {})
        }
      })

      return NextResponse.json({
        logs: result,
        total,
        hasMore: offset + limit < total
      })
    }

    // Use the audit utility function for specific org
    const result = await getAuditLogs(filters)
    return NextResponse.json(result)

  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const GET = withRateLimit(handleAuditLogsRequest, 'api')