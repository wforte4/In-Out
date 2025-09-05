'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AuthenticatedLayout from '../../../components/AuthenticatedLayout'
import SearchableSelect from '../../../components/SearchableSelect'
import Snackbar from '../../../components/Snackbar'

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
  stats: {
    totalHours: number
    totalCost: number
    uniqueContributors: number
    completionPercentage: number | null
  }
}

interface TimeEntry {
  id: string
  clockIn: string
  clockOut: string | null
  totalHours: number | null
  description: string | null
  user: {
    name: string | null
    email: string
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

interface OrganizationMember {
  id: string
  user: {
    id: string
    name: string | null
    email: string
  }
}

export default function ProjectDetail() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  
  const [project, setProject] = useState<ProjectDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCostForm, setShowCostForm] = useState(false)
  const [orgMembers, setOrgMembers] = useState<OrganizationMember[]>([])
  const [newCost, setNewCost] = useState({
    costType: 'HOURLY_RATE' as 'HOURLY_RATE' | 'FIXED_COST' | 'EXPENSE',
    amount: '',
    description: '',
    userId: ''
  })
  const [snackbar, setSnackbar] = useState<{
    show: boolean
    message: string
    type: 'success' | 'error'
  }>({ show: false, message: '', type: 'success' })

  const fetchProject = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`)
      const data = await response.json()
      
      if (response.ok) {
        setProject(data.project)
      } else {
        setSnackbar({ show: true, message: data.error || 'Failed to load project', type: 'error' })
      }
    } catch {
      setSnackbar({ show: true, message: 'Error loading project', type: 'error' })
    }
    setLoading(false)
  }, [projectId])

  const fetchOrgMembers = useCallback(async () => {
    if (!project) return
    
    try {
      const response = await fetch(`/api/organization/members?organizationId=${project.organization.id}`)
      const data = await response.json()
      if (response.ok) {
        setOrgMembers(data.members || [])
      }
    } catch {
      console.error('Error fetching organization members')
    }
  }, [project])

  useEffect(() => {
    if (projectId) {
      fetchProject()
    }
  }, [projectId, fetchProject])

  useEffect(() => {
    if (project) {
      fetchOrgMembers()
    }
  }, [project, fetchOrgMembers])

  const handleAddCost = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newCost.amount) {
      setSnackbar({ show: true, message: 'Amount is required', type: 'error' })
      return
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/costs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          costType: newCost.costType,
          amount: parseFloat(newCost.amount),
          description: newCost.description || null,
          userId: newCost.userId || null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSnackbar({ show: true, message: 'Cost added successfully!', type: 'success' })
        setShowCostForm(false)
        setNewCost({ costType: 'HOURLY_RATE', amount: '', description: '', userId: '' })
        fetchProject()
      } else {
        setSnackbar({ show: true, message: data.error || 'Failed to add cost', type: 'error' })
      }
    } catch {
      setSnackbar({ show: true, message: 'An error occurred', type: 'error' })
    }
  }

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
    
    // Add hourly revenue
    const hourlyRates = new Map()
    project.projectCosts
      .filter(cost => cost.costType === 'HOURLY_RATE')
      .forEach(cost => {
        if (cost.user) {
          hourlyRates.set(cost.user.email, cost.amount)
        }
      })
    
    // Calculate revenue from time entries
    project.timeEntries.forEach(entry => {
      if (entry.totalHours && hourlyRates.has(entry.user.email)) {
        revenue += entry.totalHours * hourlyRates.get(entry.user.email)
      } else if (entry.totalHours && project.hourlyRate) {
        revenue += entry.totalHours * project.hourlyRate
      }
    })
    
    return revenue
  }

  if (loading) {
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

  if (!project) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Project Not Found</h1>
            <button
              onClick={() => router.push('/projects')}
              className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
            >
              Back to Projects
            </button>
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
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/projects')}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <div className="flex items-center space-x-3">
                  <h1 className="text-3xl font-bold text-slate-900">{project.name}</h1>
                  {getStatusBadge(project.status)}
                </div>
                <p className="text-slate-600 mt-2">{project.description || 'No description'}</p>
              </div>
            </div>
            <button
              onClick={() => setShowCostForm(true)}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transform hover:-translate-y-0.5 transition-all duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              Add Cost
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-slate-200/50 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Total Hours</p>
                  <p className="text-2xl font-bold text-slate-900">{project.stats.totalHours.toFixed(1)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-slate-200/50 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Revenue</p>
                  <p className="text-2xl font-bold text-slate-900">${calculateProjectRevenue().toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-slate-200/50 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Contributors</p>
                  <p className="text-2xl font-bold text-slate-900">{project.stats.uniqueContributors}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-slate-200/50 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Progress</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {project.stats.completionPercentage ? `${project.stats.completionPercentage.toFixed(0)}%` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {project.estimatedHours && (
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
          )}

          {/* Add Cost Form */}
          {showCostForm && (
            <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-slate-200/50 p-6 mb-8">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Add Project Cost</h3>
              <form onSubmit={handleAddCost} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Cost Type *
                    </label>
                    <select
                      value={newCost.costType}
                      onChange={(e) => setNewCost({ ...newCost, costType: e.target.value as typeof newCost.costType })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white/80"
                    >
                      <option value="HOURLY_RATE">Hourly Rate</option>
                      <option value="FIXED_COST">Fixed Cost</option>
                      <option value="EXPENSE">Expense</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Amount ($) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newCost.amount}
                      onChange={(e) => setNewCost({ ...newCost, amount: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white/80"
                      placeholder="75.00"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Team Member
                    </label>
                    <SearchableSelect
                      value={newCost.userId}
                      onChange={(value) => setNewCost({ ...newCost, userId: value as string })}
                      options={[
                        { value: '', label: 'All team members' },
                        ...orgMembers.map(member => ({ 
                          value: member.user.id, 
                          label: member.user.name || member.user.email 
                        }))
                      ]}
                      placeholder="Choose team member..."
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newCost.description}
                    onChange={(e) => setNewCost({ ...newCost, description: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white/80"
                    placeholder="Base rate, overtime, materials, etc."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    Add Cost
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCostForm(false)}
                    className="px-6 py-2 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Time Entries */}
            <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-slate-200/50">
              <div className="px-6 py-6 border-b border-slate-200/50">
                <h3 className="text-xl font-bold text-slate-900">Recent Time Entries</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {project.timeEntries.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-slate-500">No time entries yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200/50">
                    {project.timeEntries.slice(0, 10).map((entry) => (
                      <div key={entry.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-slate-900">{entry.user.name || entry.user.email}</p>
                            <p className="text-sm text-slate-600">{entry.description || 'No description'}</p>
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
              <div className="px-6 py-6 border-b border-slate-200/50">
                <h3 className="text-xl font-bold text-slate-900">Project Costs</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {project.projectCosts.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-slate-500">No costs added yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200/50">
                    {project.projectCosts.map((cost) => (
                      <div key={cost.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-slate-900">
                              {getCostTypeLabel(cost.costType)} - ${cost.amount}
                            </p>
                            {cost.user && (
                              <p className="text-sm text-slate-600">for {cost.user.name || cost.user.email}</p>
                            )}
                            {cost.description && (
                              <p className="text-sm text-slate-600">{cost.description}</p>
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

      <Snackbar
        message={snackbar.message}
        type={snackbar.type}
        show={snackbar.show}
        onClose={() => setSnackbar({ ...snackbar, show: false })}
      />
    </AuthenticatedLayout>
  )
}