'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  PlusIcon,
  BuildingOfficeIcon,
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
import { httpClient } from '../../lib/httpClient'

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
  organization: {
    id: string
    name: string
  }
}

interface Organization {
  id: string
  name: string
  code: string
}

interface ProjectsWrapperProps {
  initialOrganizations: Organization[]
}

export default function ProjectsWrapper({ initialOrganizations }: ProjectsWrapperProps) {
  useSession() // Required for auth context
  const router = useRouter()
  const snackbar = useSnackbar()
  const [organizations] = useState<Organization[]>(initialOrganizations)
  const [selectedOrgId, setSelectedOrgId] = useState<string>(
    initialOrganizations.length === 1 ? initialOrganizations[0].id : ''
  )
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProjects = useCallback(async () => {
    if (!selectedOrgId) {
      setProjects([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const response = await httpClient.get<{ projects: Project[] }>(`/api/projects?organizationId=${selectedOrgId}`)
      
      if (response.success) {
        setProjects(response.data?.projects || [])
      } else {
        // Only show error if it's not a session expiry (handled by httpClient)
        if (response.status !== 401) {
          snackbar.error(response.error || 'Failed to load projects')
        }
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
      snackbar.error('Error loading projects')
    } finally {
      setLoading(false)
    }
  }, [selectedOrgId, snackbar])

  useEffect(() => {
    fetchProjects()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrgId])

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

  const calculateProjectRevenue = (project: Project) => {
    let revenue = 0
    
    if (project.fixedCost) {
      revenue += project.fixedCost
    }
    
    if (project.hourlyRate && project.totalHours) {
      revenue += project.hourlyRate * project.totalHours
    }
    
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

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Projects</h1>
                <p className="text-slate-600 mt-2">Manage and track your organization&apos;s projects</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 mt-4 sm:mt-0">
                {organizations.length > 1 && (
                  <SearchableSelect
                    value={selectedOrgId}
                    onChange={(value) => setSelectedOrgId(value as string)}
                    options={organizations.map(org => ({
                      value: org.id,
                      label: org.name
                    }))}
                    placeholder="Select organization..."
                    className="w-full sm:w-64"
                  />
                )}
                {selectedOrgId && (
                  <Button
                    onClick={() => router.push(`/projects/new?orgId=${selectedOrgId}`)}
                    variant="primary"
                    icon={<PlusIcon className="w-5 h-5" />}
                    className="w-full sm:w-auto"
                  >
                    New Project
                  </Button>
                )}
              </div>
            </div>
          </div>

          {!selectedOrgId ? (
            <div className="text-center py-12">
              <BuildingOfficeIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Select an Organization</h3>
              <p className="text-slate-500">Choose an organization to view and manage its projects.</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12">
              <FolderIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Projects Yet</h3>
              <p className="text-slate-500 mb-6">Get started by creating your first project.</p>
              <Button
                onClick={() => router.push(`/projects/new?orgId=${selectedOrgId}`)}
                variant="primary"
                icon={<PlusIcon className="w-5 h-5" />}
              >
                Create First Project
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => router.push(`/projects/${project.id}`)}
                  className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-slate-200/50 p-6 cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-slate-900 truncate">{project.name}</h3>
                      <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                        {project.description || 'No description'}
                      </p>
                    </div>
                    <div className="ml-3 flex-shrink-0">
                      {getStatusBadge(project.status)}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-slate-600">
                      <ClockIcon className="w-4 h-4 mr-2 text-blue-500" />
                      <span>
                        {project.totalHours.toFixed(1)}h logged
                        {project.estimatedHours && (
                          <span className="text-slate-400"> / {project.estimatedHours}h estimated</span>
                        )}
                      </span>
                    </div>

                    {project.estimatedHours && (
                      <div className="flex items-center text-sm text-slate-600">
                        <ChartBarIcon className="w-4 h-4 mr-2 text-purple-500" />
                        <span>
                          {Math.min((project.totalHours / project.estimatedHours) * 100, 100).toFixed(0)}% complete
                        </span>
                      </div>
                    )}

                    <div className="flex items-center text-sm text-slate-600">
                      <CurrencyDollarIcon className="w-4 h-4 mr-2 text-green-500" />
                      <span>${calculateProjectRevenue(project).toFixed(2)} revenue</span>
                    </div>

                    {project.hourlyRate && (
                      <div className="flex items-center text-sm text-slate-600">
                        <BanknotesIcon className="w-4 h-4 mr-2 text-yellow-500" />
                        <span>${project.hourlyRate}/hr rate</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-xs text-slate-500">
                      Created {new Date(project.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  )
}