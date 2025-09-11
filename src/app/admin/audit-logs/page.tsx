'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  ShieldCheckIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import AuthenticatedLayout from '../../../components/AuthenticatedLayout'
import SearchableSelect from '../../../components/SearchableSelect'
import { useSnackbar } from '../../../hooks/useSnackbar'

interface AuditLog {
  id: string
  userId: string
  action: string
  entityType: string
  entityId: string | null
  entityName: string | null
  oldValues: Record<string, unknown> | null
  newValues: Record<string, unknown> | null
  metadata: Record<string, unknown> | null
  organizationId: string | null
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
  }
  organization: {
    id: string
    name: string
  } | null
}

interface Organization {
  id: string
  name: string
}

export default function AuditLogsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const snackbar = useSnackbar()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(25)
  const [filters, setFilters] = useState({
    organizationId: '',
    action: '',
    entityType: '',
    startDate: '',
    endDate: '',
    userId: ''
  })

  const actionTypes = [
    'TIME_CLOCK_IN', 'TIME_CLOCK_OUT', 'TIME_ENTRY_CREATED', 'TIME_ENTRY_UPDATED', 'TIME_ENTRY_DELETED',
    'USER_CREATED', 'USER_UPDATED', 'USER_ROLE_CHANGED', 'USER_RATE_CHANGED', 'USER_REMOVED_FROM_ORG',
    'PROJECT_CREATED', 'PROJECT_UPDATED', 'PROJECT_DELETED', 'PROJECT_MEMBER_ADDED', 'PROJECT_MEMBER_REMOVED',
    'DATA_EXPORTED', 'BULK_OPERATION', 'LOGIN_SUCCESS', 'LOGIN_FAILED'
  ]

  const entityTypes = [
    'TIME_ENTRY', 'USER', 'PROJECT', 'ORGANIZATION', 'REPORT', 'AUTH'
  ]

  const fetchOrganizations = async () => {
    try {
      setError(null)
      const response = await fetch('/api/organization/members')
      if (!response.ok) throw new Error('Failed to fetch organizations')
      const data = await response.json()
      setOrganizations(data.organizations?.filter((org: Organization & { isAdmin: boolean }) => org.isAdmin) || [])
    } catch (error) {
      console.error('Error fetching organizations:', error)
      setError('Failed to load organizations')
      snackbar.error('Failed to load organizations')
    }
  }

  const fetchAuditLogs = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: ((currentPage - 1) * pageSize).toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value))
      })

      const response = await fetch(`/api/audit-logs?${params}`)
      if (!response.ok) {
        if (response.status === 403) {
          setError('Admin access required')
          router.push('/dashboard')
          return
        }
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch audit logs')
      }

      const data = await response.json()
      setLogs(data.logs || [])
      setTotal(data.total || 0)
    } catch (error) {
      console.error('Error fetching audit logs:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load audit logs'
      setError(errorMessage)
      snackbar.error(errorMessage)
      setLogs([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session) {
      fetchOrganizations()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  useEffect(() => {
    if (session) {
      fetchAuditLogs()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, currentPage, filters.organizationId, filters.action, filters.entityType, filters.startDate, filters.endDate, filters.userId])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getActionBadgeColor = (action: string) => {
    if (action.startsWith('TIME_')) return 'bg-blue-100 text-blue-800'
    if (action.startsWith('USER_')) return 'bg-purple-100 text-purple-800'
    if (action.startsWith('PROJECT_')) return 'bg-green-100 text-green-800'
    if (action.startsWith('LOGIN_') || action === 'LOGOUT') return 'bg-yellow-100 text-yellow-800'
    if (action === 'DATA_EXPORTED') return 'bg-red-100 text-red-800'
    return 'bg-slate-100 text-slate-800'
  }

  const totalPages = Math.ceil(total / pageSize)

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setFilters({
      organizationId: '',
      action: '',
      entityType: '',
      startDate: '',
      endDate: '',
      userId: ''
    })
    setCurrentPage(1)
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <button
                onClick={() => router.push('/admin')}
                className="mr-4 p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronLeftIcon className="w-5 h-5 text-slate-600" />
              </button>
              <ShieldCheckIcon className="w-8 h-8 text-slate-600 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Audit Logs</h1>
                <p className="text-slate-600 mt-1">Security and activity monitoring</p>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-slate-900 flex items-center">
                  <FunnelIcon className="w-5 h-5 mr-2" />
                  Filters
                </h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  Clear All
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Organization</label>
                  <SearchableSelect
                    value={filters.organizationId}
                    onChange={(value) => handleFilterChange('organizationId', value as string)}
                    options={[
                      { value: '', label: 'All Organizations' },
                      ...organizations.map(org => ({
                        value: org.id,
                        label: org.name
                      }))
                    ]}
                    placeholder="Select organization..."
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Action</label>
                  <SearchableSelect
                    value={filters.action}
                    onChange={(value) => handleFilterChange('action', value as string)}
                    options={[
                      { value: '', label: 'All Actions' },
                      ...actionTypes.map(action => ({
                        value: action,
                        label: action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
                      }))
                    ]}
                    placeholder="Select action..."
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Entity Type</label>
                  <SearchableSelect
                    value={filters.entityType}
                    onChange={(value) => handleFilterChange('entityType', value as string)}
                    options={[
                      { value: '', label: 'All Types' },
                      ...entityTypes.map(type => ({
                        value: type,
                        label: type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
                      }))
                    ]}
                    placeholder="Select entity type..."
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                </div>
                <div className="ml-auto">
                  <button
                    onClick={() => {
                      setError(null)
                      fetchAuditLogs()
                    }}
                    className="text-sm text-red-600 hover:text-red-500 font-medium"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <span className="ml-3 text-slate-600">Loading audit logs...</span>
            </div>
          ) : (
            <>
              {/* Results Summary */}
              <div className="mb-4">
                <p className="text-sm text-slate-600">
                  Showing {logs.length} of {total} audit logs
                </p>
              </div>

              {/* Audit Logs Table */}
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Timestamp
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Action
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Entity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Organization
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            {formatDate(log.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-900">{log.user.name || log.user.email}</div>
                            {log.user.name && (
                              <div className="text-xs text-slate-500">{log.user.email}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionBadgeColor(log.action)}`}>
                              {log.action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-900">
                              {log.entityName || log.entityType}
                            </div>
                            {log.entityId && (
                              <div className="text-xs text-slate-500 font-mono">{log.entityId}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            {log.organization?.name || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {logs.length === 0 && (
                  <div className="text-center py-12">
                    <MagnifyingGlassIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-500">No audit logs found matching your criteria.</p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-slate-600">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 disabled:text-slate-400 disabled:cursor-not-allowed"
                    >
                      <ChevronLeftIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 disabled:text-slate-400 disabled:cursor-not-allowed"
                    >
                      <ChevronRightIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  )
}