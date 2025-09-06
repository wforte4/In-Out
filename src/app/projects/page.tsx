'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import AuthenticatedLayout from '../../components/AuthenticatedLayout'
import SearchableSelect from '../../components/SearchableSelect'
import { useSnackbar } from '../../hooks/useSnackbar'

interface Project {
  id: string
  name: string
  description: string | null
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED'
  estimatedHours: number | null
  hourlyRate: number | null
  fixedCost: number | null
  totalHours: number
  createdAt: string
  creator: {
    name: string | null
    email: string
  }
}

interface Organization {
  id: string
  name: string
  userRole: string
  isAdmin: boolean
}

export default function Projects() {
  useSession()
  const router = useRouter()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState<string>('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    estimatedHours: '',
    hourlyRate: '',
    fixedCost: ''
  })
  const snackbar = useSnackbar()

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organization/members')
      const data = await response.json()
      if (response.ok && data.organizations) {
        setOrganizations(data.organizations)
        if (data.organizations.length === 1) {
          setSelectedOrgId(data.organizations[0].id)
          setIsAdmin(data.organizations[0].isAdmin)
        }
      }
    } catch (error) {
      console.error('Error fetching organizations:', error)
    }
  }

  const fetchProjects = useCallback(async () => {
    if (!selectedOrgId) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/projects?organizationId=${selectedOrgId}`)
      const data = await response.json()
      if (response.ok) {
        setProjects(data.projects || [])
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
    setLoading(false)
  }, [selectedOrgId])

  useEffect(() => {
    fetchOrganizations()
  }, [])

  useEffect(() => {
    if (selectedOrgId) {
      fetchProjects()
    }
  }, [selectedOrgId, fetchProjects])

  const handleOrgChange = (orgId: string) => {
    setSelectedOrgId(orgId)
    const selectedOrg = organizations.find(org => org.id === orgId)
    setIsAdmin(selectedOrg?.isAdmin || false)
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newProject.name.trim()) {
      snackbar.error('Project name is required')
      return
    }

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProject.name,
          description: newProject.description || null,
          organizationId: selectedOrgId,
          estimatedHours: newProject.estimatedHours || null,
          hourlyRate: newProject.hourlyRate || null,
          fixedCost: newProject.fixedCost || null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        snackbar.success('Project created successfully!')
        setShowCreateForm(false)
        setNewProject({ name: '', description: '', estimatedHours: '', hourlyRate: '', fixedCost: '' })
        fetchProjects()
      } else {
        snackbar.error(data.error || 'Failed to create project')
      }
    } catch {
      snackbar.error('An error occurred')
    }
  }

  const getStatusBadge = (status: Project['status']) => {
    const statusStyles = {
      ACTIVE: 'bg-green-100 text-green-800 border-green-200',
      COMPLETED: 'bg-blue-100 text-blue-800 border-blue-200',
      ON_HOLD: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      CANCELLED: 'bg-red-100 text-red-800 border-red-200',
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyles[status]}`}>
        {status.replace('_', ' ')}
      </span>
    )
  }

  const handleViewProject = (projectId: string) => {
    router.push(`/projects/${projectId}`)
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Projects</h1>
              <p className="text-slate-600 mt-2">Manage and track your organization&apos;s projects</p>
            </div>
            {selectedOrgId && isAdmin && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New Project
              </button>
            )}
          </div>

          {organizations.length > 1 ? (
            <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-slate-200/50 p-6 mb-8">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Select Organization</h3>
              <SearchableSelect
                value={selectedOrgId}
                onChange={handleOrgChange}
                options={organizations.map(org => ({ value: org.id, label: org.name }))}
                placeholder="Choose an organization..."
              />
            </div>
          ) : organizations.length === 1 && selectedOrgId ? (
            <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-slate-200/50 p-6 mb-8">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Organization</h3>
                  <p className="text-slate-600">{organizations[0]?.name}</p>
                </div>
              </div>
            </div>
          ) : organizations.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-amber-900">No Organization</h3>
                  <p className="text-amber-700">You need to create or join an organization before creating projects.</p>
                </div>
              </div>
            </div>
          ) : null}

          {showCreateForm && isAdmin && (
            <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-slate-200/50 p-6 mb-8">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Create New Project</h3>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Project Name *
                    </label>
                    <input
                      type="text"
                      value={newProject.name}
                      onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white/80"
                      placeholder="Website Redesign, Mobile App, etc."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Estimated Hours
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={newProject.estimatedHours}
                      onChange={(e) => setNewProject({ ...newProject, estimatedHours: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white/80"
                      placeholder="120"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white/80"
                    placeholder="Brief description of the project..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Default Hourly Rate ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProject.hourlyRate}
                      onChange={(e) => setNewProject({ ...newProject, hourlyRate: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white/80"
                      placeholder="75.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Fixed Project Cost ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProject.fixedCost}
                      onChange={(e) => setNewProject({ ...newProject, fixedCost: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white/80"
                      placeholder="5000.00"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    Create Project
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-6 py-2 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {selectedOrgId && (
            <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-slate-200/50">
              <div className="px-6 py-6 border-b border-slate-200/50">
                <h3 className="text-xl font-bold text-slate-900">Organization Projects</h3>
              </div>
              
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="text-slate-600 mt-4">Loading projects...</p>
                </div>
              ) : projects.length === 0 ? (
                <div className="p-8 text-center">
                  <svg className="w-16 h-16 text-slate-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 00-2 2v2m0 0h14m0 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">No projects yet</h3>
                  <p className="text-slate-500 mb-4">
                    {isAdmin ? 'Create your first project to start tracking work' : 'No projects have been created yet'}
                  </p>
                  {isAdmin && (
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 transform hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Create Project
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-slate-200/50">
                  {projects.map((project) => (
                    <div key={project.id} className="p-6 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg font-semibold text-slate-900">{project.name}</h4>
                            {getStatusBadge(project.status)}
                          </div>
                          {project.description && (
                            <p className="text-slate-600 mb-3">{project.description}</p>
                          )}
                          <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {project.totalHours.toFixed(1)}h logged
                            </div>
                            {project.estimatedHours && (
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                {((project.totalHours / project.estimatedHours) * 100).toFixed(0)}% complete
                              </div>
                            )}
                            {project.hourlyRate && (
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                                ${project.hourlyRate}/hr
                              </div>
                            )}
                            {project.fixedCost && (
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                ${project.fixedCost} fixed
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewProject(project.id)}
                            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

    </AuthenticatedLayout>
  )
}