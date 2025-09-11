'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { UsersIcon } from '@heroicons/react/24/outline'
import AuthenticatedLayout from '../../../components/AuthenticatedLayout'
import Button from '../../../components/Button'
import ProjectEmployeesModal from '../../../components/modals/ProjectEmployeesModal'
import EditProjectModal from '../../../components/modals/EditProjectModal'
import AddCostModal from '../../../components/modals/AddCostModal'
import ActionsDropdown from '../../../components/ActionsDropdown'
import { useSnackbar } from '../../../hooks/useSnackbar'

interface ProjectDetails {
  id: string
  name: string
  description: string | null
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED'
  estimatedHours: number | null
  hourlyRate: number | null
  fixedCost: number | null
  createdAt: string
  creator: {
    name: string | null
    email: string
  }
  organization: {
    id: string
    name: string
  }
  timeEntries: TimeEntry[]
  projectCosts: ProjectCost[]
  projectEmployees: ProjectEmployee[]
  stats: {
    totalHours: number
    totalCost: number
    uniqueContributors: number
    completionPercentage: number | null
  }
}

interface ProjectEmployee {
  id: string
  hourlyRate: number | null
  role: string | null
  joinedAt: string
  user: {
    id: string
    name: string | null
    email: string
    defaultHourlyRate: number | null
  }
}

interface TimeEntry {
  id: string
  clockIn: string
  clockOut: string | null
  totalHours: number | null
  description: string | null
  user: {
    id: string
    name: string | null
    email: string
    defaultHourlyRate?: number | null
  }
}

interface ProjectCost {
  id: string
  costType: 'HOURLY_RATE' | 'FIXED_COST' | 'EXPENSE'
  amount: number
  description: string | null
  createdAt: string
  user: {
    name: string | null
    email: string
  } | null
  creator: {
    name: string | null
    email: string
  }
}


export default function ProjectDetail() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [project, setProject] = useState<ProjectDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasAdminAccess, setHasAdminAccess] = useState(true) // Assume access initially to prevent flash
  const [accessLoading, setAccessLoading] = useState(true)
  const [showCostModal, setShowCostModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showEmployeesModal, setShowEmployeesModal] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const snackbar = useSnackbar()

  const checkAdminAccess = useCallback(async () => {
    try {
      const response = await fetch('/api/organization/members')
      const data = await response.json()
      if (response.ok && data.organizations) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const hasAdmin = data.organizations.some((org: any) => org.isAdmin)
        setHasAdminAccess(hasAdmin)
        if (!hasAdmin) {
          // Redirect immediately without showing access denied message
          router.push('/dashboard')
          return
        }
      }
    } catch (error) {
      console.error('Error checking admin access:', error)
      router.push('/dashboard')
    }
    setAccessLoading(false)
  }, [router])

  const fetchProject = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`)
      const data = await response.json()

      if (response.ok) {
        setProject(data.project)
        setIsAdmin(data.isAdmin || false)
      } else {
        snackbar.error(data.error || 'Failed to load project')
        if (response.status === 403) {
          router.push('/projects')
        }
      }
    } catch {
      snackbar.error('Error loading project')
    }
    setLoading(false)
  }, [projectId, router, snackbar])


  useEffect(() => {
    if (session) {
      checkAdminAccess()
    } else if (session === null) {
      setAccessLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  useEffect(() => {
    if (projectId && hasAdminAccess && !accessLoading) {
      fetchProject()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, hasAdminAccess, accessLoading])




  const getStatusBadge = (status: ProjectDetails['status']) => {
    const statusStyles = {
      ACTIVE: 'bg-green-100 text-green-800 border-green-200',
      COMPLETED: 'bg-blue-100 text-blue-800 border-blue-200',
      ON_HOLD: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      CANCELLED: 'bg-red-100 text-red-800 border-red-200',
    }

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusStyles[status]}`}>
        {status.replace('_', ' ')}
      </span>
    )
  }

  const getCostTypeLabel = (costType: ProjectCost['costType']) => {
    const labels = {
      HOURLY_RATE: 'Hourly Rate',
      FIXED_COST: 'Fixed Cost',
      EXPENSE: 'Expense',
    }
    return labels[costType]
  }

  const calculateProjectRevenue = () => {
    if (!project) return 0

    let revenue = 0

    // Add fixed costs
    revenue += project.projectCosts
      .filter(cost => cost.costType === 'FIXED_COST')
      .reduce((sum, cost) => sum + cost.amount, 0)

    // Create a map of user rates for quick lookup
    // Priority: 1. Project-specific employee rate, 2. User default rate, 3. Project default rate
    const getUserRate = (userId: string, userDefaultRate?: number | null) => {
      // Check for project-specific employee rate
      const projectEmployee = project.projectEmployees?.find(pe => pe.user.id === userId)
      if (projectEmployee?.hourlyRate) {
        return projectEmployee.hourlyRate
      }

      // Check for user's default rate
      if (userDefaultRate) {
        return userDefaultRate
      }

      // Fall back to project default rate
      if (project.hourlyRate) {
        return project.hourlyRate
      }

      return 0
    }

    // Legacy: Add project costs hourly rates (keep for backward compatibility)
    const legacyHourlyRates = new Map()
    project.projectCosts
      .filter(cost => cost.costType === 'HOURLY_RATE')
      .forEach(cost => {
        if (cost.user) {
          legacyHourlyRates.set(cost.user.email, cost.amount)
        }
      })

    // Calculate revenue from time entries
    project.timeEntries.forEach(entry => {
      if (entry.totalHours) {
        // First check legacy project costs for backward compatibility
        if (legacyHourlyRates.has(entry.user.email)) {
          revenue += entry.totalHours * legacyHourlyRates.get(entry.user.email)
        } else {
          // Use new rate hierarchy
          const rate = getUserRate(entry.user.id, entry.user.defaultHourlyRate)
          revenue += entry.totalHours * rate
        }
      }
    })

    return revenue
  }

  if (accessLoading || loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        </div>
      </AuthenticatedLayout>
    )
  }

  // Don't show access denied UI, just redirect in useEffect above

  if (!project) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Project Not Found</h1>
            <Button
              onClick={() => router.push('/projects')}
              variant="primary"
            >
              Back to Projects
            </Button>
          </div>
        </div>
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            {/* Back button and title section with actions dropdown */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-3 md:space-x-4 flex-1 min-w-0">
                <Button
                  onClick={() => router.push('/projects')}
                  variant="secondary"
                  size="sm"
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  }
                >
                </Button>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-2 sm:space-y-0">
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 truncate">{project.name}</h1>
                    {getStatusBadge(project.status)}
                  </div>
                  <p className="text-slate-600 mt-2 text-sm md:text-base">{project.description || 'No description'}</p>
                </div>
              </div>

              {/* Actions dropdown - top right */}
              {isAdmin && (
                <div className="flex-shrink-0">
                  <ActionsDropdown
                    options={[
                      {
                        label: 'Edit Project',
                        onClick: () => setShowEditModal(true),
                        icon: (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        )
                      }
                    ]}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
            <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-slate-200/50 p-3 md:p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 md:w-6 md:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-2 md:ml-4 min-w-0 flex-1">
                  <p className="text-xs md:text-sm font-medium text-slate-600 truncate">Total Hours</p>
                  <p className="text-lg md:text-2xl font-bold text-slate-900">{project.stats.totalHours.toFixed(1)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-slate-200/50 p-3 md:p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 md:w-12 md:h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 md:w-6 md:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-2 md:ml-4 min-w-0 flex-1">
                  <p className="text-xs md:text-sm font-medium text-slate-600 truncate">Revenue</p>
                  <p className="text-lg md:text-2xl font-bold text-slate-900">${calculateProjectRevenue().toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-slate-200/50 p-3 md:p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 md:w-12 md:h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 md:w-6 md:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-2 md:ml-4 min-w-0 flex-1">
                  <p className="text-xs md:text-sm font-medium text-slate-600 truncate">Contributors</p>
                  <p className="text-lg md:text-2xl font-bold text-slate-900">{project.stats.uniqueContributors}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-slate-200/50 p-3 md:p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 md:w-12 md:h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 md:w-6 md:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-2 md:ml-4 min-w-0 flex-1">
                  <p className="text-xs md:text-sm font-medium text-slate-600 truncate">Progress</p>
                  <p className="text-lg md:text-2xl font-bold text-slate-900">
                    {project.stats.completionPercentage ? `${project.stats.completionPercentage.toFixed(0)}%` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar or Accumulated Cost */}
          {project.estimatedHours ? (
            <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-slate-200/50 p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Project Progress</h3>
                <span className="text-sm text-slate-600">
                  {project.stats.totalHours.toFixed(1)} / {project.estimatedHours} hours
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min((project.stats.totalHours / project.estimatedHours) * 100, 100)}%`
                  }}
                ></div>
              </div>
            </div>
          ) : (
            <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-slate-200/50 p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Project Summary</h3>
                <span className="text-sm text-slate-600">No budget set</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-500 rounded-xl mx-auto mb-2">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{project.stats.totalHours.toFixed(1)}h</p>
                  <p className="text-sm text-blue-600">Total Time</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-xl border border-green-100">
                  <div className="flex items-center justify-center w-12 h-12 bg-green-500 rounded-xl mx-auto mb-2">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <p className="text-2xl font-bold text-green-600">${calculateProjectRevenue().toFixed(2)}</p>
                  <p className="text-sm text-green-600">Revenue</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-100">
                  <div className="flex items-center justify-center w-12 h-12 bg-purple-500 rounded-xl mx-auto mb-2">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">${project.hourlyRate ? (project.stats.totalHours * project.hourlyRate).toFixed(2) : 'N/A'}</p>
                  <p className="text-sm text-purple-600">Est. Value</p>
                </div>
              </div>
            </div>
          )}



          {/* Team Members Section */}
          <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-slate-200/50 mb-6 md:mb-8">
            <div className="px-4 md:px-6 py-4 md:py-6 border-b border-slate-200/50 flex items-center justify-between">
              <h3 className="text-lg md:text-xl font-bold text-slate-900">Team Members ({project.projectEmployees?.length || 0})</h3>
              {isAdmin && (
                <Button
                  onClick={() => setShowEmployeesModal(true)}
                  variant="secondary"
                  size="sm"
                  icon={<UsersIcon className="w-4 h-4" />}
                >
                  <span className="hidden sm:inline ml-2">Manage Team</span>
                </Button>
              )}
            </div>
            {project.projectEmployees && project.projectEmployees.length > 0 ? (
              <div className="p-4 md:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {project.projectEmployees.map((employee) => {
                    const effectiveRate = employee.hourlyRate || employee.user.defaultHourlyRate || project.hourlyRate || 0
                    return (
                      <div key={employee.id} className="bg-slate-50 rounded-xl p-3 md:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 space-y-1 sm:space-y-0">
                          <h4 className="font-semibold text-slate-900 text-sm md:text-base truncate">
                            {employee.user.name || employee.user.email}
                          </h4>
                          <span className="text-xs md:text-sm font-semibold text-green-600 flex-shrink-0">
                            ${effectiveRate.toFixed(2)}/hr
                          </span>
                        </div>
                        <div className="text-xs md:text-sm text-slate-600 space-y-1">
                          {employee.role && (
                            <div>Role: <span className="font-medium">{employee.role}</span></div>
                          )}
                          <div>Joined: {new Date(employee.joinedAt).toLocaleDateString()}</div>
                          {employee.hourlyRate && employee.hourlyRate !== employee.user.defaultHourlyRate && (
                            <div className="text-xs text-blue-600">
                              Project-specific rate
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="p-4 md:p-6 text-center">
                <p className="text-slate-500 text-sm md:text-base">No team members assigned yet</p>
                {isAdmin && (
                  <Button
                    onClick={() => setShowEmployeesModal(true)}
                    variant="primary"
                    size="sm"
                    className="mt-3"
                    icon={<UsersIcon className="w-4 h-4" />}
                  >
                    Add Team Members
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
            {/* Recent Time Entries */}
            <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-slate-200/50">
              <div className="px-4 md:px-6 py-4 md:py-6 border-b border-slate-200/50">
                <h3 className="text-lg md:text-xl font-bold text-slate-900">Recent Time Entries</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {project.timeEntries.length === 0 ? (
                  <div className="p-4 md:p-6 text-center">
                    <p className="text-slate-500 text-sm md:text-base">No time entries yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200/50">
                    {project.timeEntries.slice(0, 10).map((entry) => (
                      <div key={entry.id} className="p-3 md:p-4">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-slate-900 text-sm md:text-base truncate">{entry.user.name || entry.user.email}</p>
                            <p className="text-xs md:text-sm text-slate-600 truncate">{entry.description || 'No description'}</p>
                            <p className="text-xs text-slate-500">
                              {new Date(entry.clockIn).toLocaleDateString()} - {entry.totalHours?.toFixed(1)}h
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Project Costs */}
            <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-slate-200/50">
              <div className="px-4 md:px-6 py-4 md:py-6 border-b border-slate-200/50 flex items-center justify-between">
                <h3 className="text-lg md:text-xl font-bold text-slate-900">Project Costs</h3>
                {isAdmin && (
                  <Button
                    onClick={() => setShowCostModal(true)}
                    variant="success"
                    size="sm"
                    icon={
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    }
                  >
                    <span className="hidden sm:inline ml-2">Add Cost</span>
                  </Button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {project.projectCosts.length === 0 ? (
                  <div className="p-4 md:p-6 text-center">
                    <p className="text-slate-500 text-sm md:text-base">No costs added yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200/50">
                    {project.projectCosts.map((cost) => (
                      <div key={cost.id} className="p-3 md:p-4">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-slate-900 text-sm md:text-base">
                              {getCostTypeLabel(cost.costType)} - ${cost.amount}
                            </p>
                            {cost.user && (
                              <p className="text-xs md:text-sm text-slate-600 truncate">for {cost.user.name || cost.user.email}</p>
                            )}
                            {cost.description && (
                              <p className="text-xs md:text-sm text-slate-600 truncate">{cost.description}</p>
                            )}
                            <p className="text-xs text-slate-500">
                              Added {new Date(cost.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showEmployeesModal && (
        <ProjectEmployeesModal
          projectId={projectId}
          projectName={project.name}
          projectHourlyRate={project.hourlyRate}
          onClose={() => setShowEmployeesModal(false)}
          onEmployeeUpdated={fetchProject}
        />
      )}

      {showEditModal && (
        <EditProjectModal
          projectId={projectId}
          initialProject={{
            name: project.name,
            description: project.description,
            status: project.status,
            estimatedHours: project.estimatedHours,
            hourlyRate: project.hourlyRate,
            fixedCost: project.fixedCost
          }}
          onClose={() => setShowEditModal(false)}
          onProjectUpdated={fetchProject}
        />
      )}

      {showCostModal && (
        <AddCostModal
          projectId={projectId}
          onClose={() => setShowCostModal(false)}
          onCostAdded={fetchProject}
        />
      )}

    </AuthenticatedLayout>
  )
}