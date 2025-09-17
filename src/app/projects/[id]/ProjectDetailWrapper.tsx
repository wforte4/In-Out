'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { UsersIcon } from '@heroicons/react/24/outline'
import AuthenticatedLayout from '../../../components/AuthenticatedLayout'
import Button from '../../../components/Button'
import ProjectEmployeesModal from '../../../components/modals/ProjectEmployeesModal'
import { httpClient } from '../../../lib/httpClient'

interface ProjectDetailWrapperProps {
  projectId: string
  initialProject: Record<string, unknown>
}

export default function ProjectDetailWrapper({ projectId, initialProject }: ProjectDetailWrapperProps) {
  const router = useRouter()
  const [project, setProject] = useState(initialProject)
  const [showEmployeesModal, setShowEmployeesModal] = useState(false)
  const [isAdmin] = useState(true) // Already verified server-side

  const fetchProject = useCallback(async () => {
    try {
      const response = await httpClient.get<{ project: Record<string, unknown> }>(`/api/projects/${projectId}`)

      if (response.success) {
        setProject(response.data?.project || {})
      } else {
        // Only log error if it's not a session expiry (handled by httpClient)
        if (response.status !== 401) {
          console.error('Failed to load project:', response.error)
        }
      }
    } catch (error) {
      console.error('Error loading project:', error)
    }
  }, [projectId])

  // Simplified render - just showing the basic structure
  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <div className="flex items-start space-x-3 md:space-x-4 mb-4">
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
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900 truncate">{project.name as string}</h1>
                </div>
                <p className="text-slate-600 mt-2 text-sm md:text-base">{(project.description as string) || 'No description'}</p>
              </div>
            </div>
            
            {/* Action buttons */}
            {isAdmin && (
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button
                  onClick={() => setShowEmployeesModal(true)}
                  variant="secondary"
                  size="sm"
                  icon={<UsersIcon className="w-4 h-4" />}
                  fullWidth={true}
                  className="sm:w-auto"
                >
                  <span className="sm:hidden">Team ({(project.projectEmployees as unknown[])?.length || 0})</span>
                  <span className="hidden sm:inline">Manage Team ({(project.projectEmployees as unknown[])?.length || 0})</span>
                </Button>
              </div>
            )}
          </div>


          <div className="text-center py-12">
            <p className="text-slate-600">Project detail view is loading...</p>
          </div>

          {/* Project Employees Modal */}
          {showEmployeesModal && (
            <ProjectEmployeesModal
              projectId={projectId}
              projectName={project.name as string}
              projectHourlyRate={(project.hourlyRate as number) || null}
              onClose={() => setShowEmployeesModal(false)}
              onEmployeeUpdated={fetchProject}
            />
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  )
}