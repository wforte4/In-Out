'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  PlusIcon,
  BuildingOfficeIcon,
  ExclamationTriangleIcon,
  FolderIcon,
  ClockIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline'
import AuthenticatedLayout from '../../components/AuthenticatedLayout'
import SearchableSelect from '../../components/SearchableSelect'
import Button from '../../components/Button'
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
  const { data: session } = useSession()
  const router = useRouter()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState<string>('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [hasAdminAccess, setHasAdminAccess] = useState(false)
  const [accessLoading, setAccessLoading] = useState(true)
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
        const adminOrgs = data.organizations.filter((org: Organization) => org.isAdmin)
        setOrganizations(adminOrgs)
        setHasAdminAccess(adminOrgs.length > 0)
        if (adminOrgs.length === 1) {
          setSelectedOrgId(adminOrgs[0].id)
          setIsAdmin(adminOrgs[0].isAdmin)
        }
      }
    } catch (error) {
      console.error('Error fetching organizations:', error)
    }
    setAccessLoading(false)
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
    if (session) {
      fetchOrganizations()
    } else if (session === null) {
      setAccessLoading(false)
    }
  }, [session])

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

  if (accessLoading) {
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

  if (!hasAdminAccess) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
              <div className="flex items-center space-x-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="text-lg font-semibold text-amber-900">Admin Access Required</h3>
                  <p className="text-amber-700">You need admin access to an organization to manage projects.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    )
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
              <Button
                onClick={() => setShowCreateForm(true)}
                variant="primary"
                icon={<PlusIcon className="w-5 h-5" />}
              >
                New Project
              </Button>
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
                <BuildingOfficeIcon className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Organization</h3>
                  <p className="text-slate-600">{organizations[0]?.name}</p>
                </div>
              </div>
            </div>
          ) : organizations.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8">
              <div className="flex items-center space-x-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-amber-600" />
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
                  <Button
                    type="submit"
                    variant="primary"
                  >
                    Create Project
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    variant="secondary"
                  >
                    Cancel
                  </Button>
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
                  <FolderIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">No projects yet</h3>
                  <p className="text-slate-500 mb-4">
                    {isAdmin ? 'Create your first project to start tracking work' : 'No projects have been created yet'}
                  </p>
                  {isAdmin && (
                    <Button
                      onClick={() => setShowCreateForm(true)}
                      variant="primary"
                      icon={<PlusIcon className="w-5 h-5" />}
                    >
                      Create Project
                    </Button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-slate-200/50">
                  {projects.map((project) => (
                    <div 
                      key={project.id} 
                      className="p-6 hover:bg-slate-50/80 hover:shadow-lg cursor-pointer transition-all duration-200 group"
                      onClick={() => handleViewProject(project.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg font-semibold text-slate-900 group-hover:text-purple-700 transition-colors">
                              {project.name}
                            </h4>
                            {getStatusBadge(project.status)}
                          </div>
                          {project.description && (
                            <p className="text-slate-600 mb-3 group-hover:text-slate-700 transition-colors">
                              {project.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-4 text-sm text-slate-500 group-hover:text-slate-600 transition-colors">
                            <div className="flex items-center">
                              <ClockIcon className="w-4 h-4 mr-1" />
                              {project.totalHours.toFixed(1)}h logged
                            </div>
                            {project.estimatedHours && (
                              <div className="flex items-center">
                                <ChartBarIcon className="w-4 h-4 mr-1" />
                                {((project.totalHours / project.estimatedHours) * 100).toFixed(0)}% complete
                              </div>
                            )}
                            {project.hourlyRate && (
                              <div className="flex items-center">
                                <CurrencyDollarIcon className="w-4 h-4 mr-1" />
                                ${project.hourlyRate}/hr
                              </div>
                            )}
                            {project.fixedCost && (
                              <div className="flex items-center">
                                <BanknotesIcon className="w-4 h-4 mr-1" />
                                ${project.fixedCost} fixed
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 opacity-60 group-hover:opacity-100 transition-opacity">
                          <div className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-lg border border-purple-200 group-hover:bg-purple-200 transition-colors">
                            View Details →
                          </div>
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