import { prisma } from './prisma'
import { NextRequest } from 'next/server'

export type AuditAction = 
  // Time Entry Actions
  | 'TIME_ENTRY_CREATED'
  | 'TIME_ENTRY_UPDATED'
  | 'TIME_ENTRY_DELETED'
  | 'TIME_CLOCK_IN'
  | 'TIME_CLOCK_OUT'
  
  // User Management Actions
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'USER_ROLE_CHANGED'
  | 'USER_RATE_CHANGED'
  | 'USER_REMOVED_FROM_ORG'
  
  // Organization Actions
  | 'ORGANIZATION_CREATED'
  | 'ORGANIZATION_UPDATED'
  | 'ORGANIZATION_DELETED'
  
  // Project Actions
  | 'PROJECT_CREATED'
  | 'PROJECT_UPDATED'
  | 'PROJECT_DELETED'
  | 'PROJECT_MEMBER_ADDED'
  | 'PROJECT_MEMBER_REMOVED'
  | 'PROJECT_MEMBER_RATE_CHANGED'
  
  // Authentication Actions
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'PASSWORD_CHANGED'
  | 'EMAIL_VERIFIED'
  
  // Admin Actions
  | 'ADMIN_ACCESS_GRANTED'
  | 'ADMIN_ACCESS_REVOKED'
  | 'DATA_EXPORTED'
  | 'BULK_OPERATION'

export interface AuditLogData {
  userId: string
  action: AuditAction
  entityType?: string
  entityId?: string
  entityName?: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
  organizationId?: string
  request?: NextRequest
}

/**
 * Extract metadata from request headers
 */
const extractRequestMetadata = (request?: NextRequest) => {
  if (!request) return {}
  
  const headers = request.headers
  return {
    ipAddress: headers.get('x-forwarded-for') || headers.get('x-real-ip') || 'unknown',
    userAgent: headers.get('user-agent') || 'unknown',
    referer: headers.get('referer'),
    timestamp: new Date().toISOString()
  }
}

/**
 * Create an audit log entry
 */
export async function createAuditLog({
  userId,
  action,
  entityType,
  entityId,
  entityName,
  oldValues,
  newValues,
  organizationId,
  request
}: AuditLogData): Promise<void> {
  try {
    const metadata = extractRequestMetadata(request)
    
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType: entityType || 'UNKNOWN',
        entityId,
        entityName,
        oldValues: oldValues as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        newValues: newValues as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        metadata,
        organizationId
      }
    })
  } catch (error) {
    console.error('Failed to create audit log:', error)
    // Don't throw error to avoid breaking main functionality
  }
}

/**
 * Log time entry actions
 */
export const auditTimeEntry = {
  clockIn: (userId: string, timeEntryId: string, organizationId: string, projectId?: string, request?: NextRequest) =>
    createAuditLog({
      userId,
      action: 'TIME_CLOCK_IN',
      entityType: 'TIME_ENTRY',
      entityId: timeEntryId,
      entityName: 'Clock In',
      newValues: { timeEntryId, organizationId, projectId },
      organizationId,
      request
    }),

  clockOut: (userId: string, timeEntryId: string, organizationId: string, totalHours: number, request?: NextRequest) =>
    createAuditLog({
      userId,
      action: 'TIME_CLOCK_OUT',
      entityType: 'TIME_ENTRY',
      entityId: timeEntryId,
      entityName: 'Clock Out',
      newValues: { timeEntryId, totalHours },
      organizationId,
      request
    }),

  create: (userId: string, timeEntryId: string, data: Record<string, unknown>, organizationId?: string, request?: NextRequest) =>
    createAuditLog({
      userId,
      action: 'TIME_ENTRY_CREATED',
      entityType: 'TIME_ENTRY',
      entityId: timeEntryId,
      entityName: 'Time Entry',
      newValues: data,
      organizationId,
      request
    }),

  update: (userId: string, timeEntryId: string, oldData: Record<string, unknown>, newData: Record<string, unknown>, organizationId?: string, request?: NextRequest) =>
    createAuditLog({
      userId,
      action: 'TIME_ENTRY_UPDATED',
      entityType: 'TIME_ENTRY',
      entityId: timeEntryId,
      entityName: 'Time Entry',
      oldValues: oldData,
      newValues: newData,
      organizationId,
      request
    }),

  delete: (userId: string, timeEntryId: string, data: Record<string, unknown>, organizationId?: string, request?: NextRequest) =>
    createAuditLog({
      userId,
      action: 'TIME_ENTRY_DELETED',
      entityType: 'TIME_ENTRY',
      entityId: timeEntryId,
      entityName: 'Time Entry',
      oldValues: data,
      organizationId,
      request
    })
}

/**
 * Log user management actions
 */
export const auditUser = {
  create: (userId: string, newUserId: string, userData: Record<string, unknown>, organizationId?: string, request?: NextRequest) =>
    createAuditLog({
      userId,
      action: 'USER_CREATED',
      entityType: 'USER',
      entityId: newUserId,
      entityName: userData.name as string || userData.email as string || 'User',
      newValues: userData,
      organizationId,
      request
    }),

  update: (userId: string, targetUserId: string, oldData: Record<string, unknown>, newData: Record<string, unknown>, organizationId?: string, request?: NextRequest) =>
    createAuditLog({
      userId,
      action: 'USER_UPDATED',
      entityType: 'USER',
      entityId: targetUserId,
      entityName: newData.name as string || oldData.name as string || 'User',
      oldValues: oldData,
      newValues: newData,
      organizationId,
      request
    }),

  changeRole: (userId: string, targetUserId: string, userName: string, oldRole: string, newRole: string, organizationId: string, request?: NextRequest) =>
    createAuditLog({
      userId,
      action: 'USER_ROLE_CHANGED',
      entityType: 'USER',
      entityId: targetUserId,
      entityName: userName,
      oldValues: { role: oldRole },
      newValues: { role: newRole },
      organizationId,
      request
    }),

  changeRate: (userId: string, targetUserId: string, userName: string, oldRate: number, newRate: number, organizationId?: string, request?: NextRequest) =>
    createAuditLog({
      userId,
      action: 'USER_RATE_CHANGED',
      entityType: 'USER',
      entityId: targetUserId,
      entityName: userName,
      oldValues: { defaultHourlyRate: oldRate },
      newValues: { defaultHourlyRate: newRate },
      organizationId,
      request
    }),

  removeFromOrg: (userId: string, targetUserId: string, userName: string, organizationId: string, request?: NextRequest) =>
    createAuditLog({
      userId,
      action: 'USER_REMOVED_FROM_ORG',
      entityType: 'USER',
      entityId: targetUserId,
      entityName: userName,
      oldValues: { organizationId },
      organizationId,
      request
    })
}

/**
 * Log project actions
 */
export const auditProject = {
  create: (userId: string, projectId: string, projectData: Record<string, unknown>, organizationId: string, request?: NextRequest) =>
    createAuditLog({
      userId,
      action: 'PROJECT_CREATED',
      entityType: 'PROJECT',
      entityId: projectId,
      entityName: projectData.name as string || 'Project',
      newValues: projectData,
      organizationId,
      request
    }),

  update: (userId: string, projectId: string, oldData: Record<string, unknown>, newData: Record<string, unknown>, organizationId: string, request?: NextRequest) =>
    createAuditLog({
      userId,
      action: 'PROJECT_UPDATED',
      entityType: 'PROJECT',
      entityId: projectId,
      entityName: newData.name as string || oldData.name as string || 'Project',
      oldValues: oldData,
      newValues: newData,
      organizationId,
      request
    }),

  addMember: (userId: string, projectId: string, projectName: string, targetUserId: string, userName: string, organizationId: string, request?: NextRequest) =>
    createAuditLog({
      userId,
      action: 'PROJECT_MEMBER_ADDED',
      entityType: 'PROJECT',
      entityId: projectId,
      entityName: projectName,
      newValues: { addedUserId: targetUserId, addedUserName: userName },
      organizationId,
      request
    }),

  removeMember: (userId: string, projectId: string, projectName: string, targetUserId: string, userName: string, organizationId: string, request?: NextRequest) =>
    createAuditLog({
      userId,
      action: 'PROJECT_MEMBER_REMOVED',
      entityType: 'PROJECT',
      entityId: projectId,
      entityName: projectName,
      oldValues: { removedUserId: targetUserId, removedUserName: userName },
      organizationId,
      request
    })
}

/**
 * Log admin actions
 */
export const auditAdmin = {
  dataExport: (userId: string, exportType: string, filters: Record<string, unknown>, organizationId?: string, request?: NextRequest) =>
    createAuditLog({
      userId,
      action: 'DATA_EXPORTED',
      entityType: 'REPORT',
      entityName: `${exportType} Export`,
      newValues: { exportType, filters, recordCount: filters.recordCount },
      organizationId,
      request
    }),

  bulkOperation: (userId: string, operation: string, entityType: string, recordCount: number, organizationId?: string, request?: NextRequest) =>
    createAuditLog({
      userId,
      action: 'BULK_OPERATION',
      entityType: entityType,
      entityName: `Bulk ${operation}`,
      newValues: { operation, recordCount },
      organizationId,
      request
    })
}

/**
 * Log authentication actions
 */
export const auditAuth = {
  loginSuccess: (userId: string, request?: NextRequest) =>
    createAuditLog({
      userId,
      action: 'LOGIN_SUCCESS',
      entityType: 'AUTH',
      entityName: 'Successful Login',
      request
    }),

  loginFailed: (email: string, request?: NextRequest) =>
    createAuditLog({
      userId: 'SYSTEM', // Use system for failed attempts
      action: 'LOGIN_FAILED',
      entityType: 'AUTH',
      entityName: 'Failed Login Attempt',
      newValues: { email },
      request
    }),

  emailVerified: (userId: string, request?: NextRequest) =>
    createAuditLog({
      userId,
      action: 'EMAIL_VERIFIED',
      entityType: 'AUTH',
      entityName: 'Email Verification',
      request
    })
}

/**
 * Get audit logs with filtering and pagination
 */
export interface AuditLogFilters {
  organizationId?: string
  userId?: string
  action?: AuditAction
  entityType?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}

export async function getAuditLogs({
  organizationId,
  userId,
  action,
  entityType,
  startDate,
  endDate,
  limit = 50,
  offset = 0
}: AuditLogFilters) {
  const where: Record<string, unknown> = {}

  if (organizationId) where.organizationId = organizationId
  if (userId) where.userId = userId
  if (action) where.action = action
  if (entityType) where.entityType = entityType
  if (startDate || endDate) {
    where.createdAt = {} as any // eslint-disable-line @typescript-eslint/no-explicit-any
    if (startDate) (where.createdAt as any).gte = startDate // eslint-disable-line @typescript-eslint/no-explicit-any
    if (endDate) (where.createdAt as any).lte = endDate // eslint-disable-line @typescript-eslint/no-explicit-any
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
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
    }),
    prisma.auditLog.count({ where })
  ])

  return {
    logs,
    total,
    hasMore: offset + limit < total
  }
}