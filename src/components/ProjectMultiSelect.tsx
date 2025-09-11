'use client'

import React, { useState, useEffect } from 'react'
import { ChevronDownIcon, XMarkIcon, FolderIcon } from '@heroicons/react/24/outline'
import { CheckIcon } from '@heroicons/react/24/solid'

export interface Project {
  id: string
  name: string
  description?: string
}

interface ProjectMultiSelectProps {
  value: string[]
  onChange: (selectedIds: string[]) => void
  organizationId: string
  className?: string
  disabled?: boolean
  placeholder?: string
}

const ProjectMultiSelect: React.FC<ProjectMultiSelectProps> = ({
  value,
  onChange,
  organizationId,
  className = '',
  disabled = false,
  placeholder = 'Select projects'
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (organizationId) {
      fetchProjects()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId])

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/projects?organizationId=${organizationId}`)
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects.map((project: { id: string; name: string; description?: string }) => ({
          id: project.id,
          name: project.name,
          description: project.description
        })))
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const selectedProjects = projects.filter(proj => value.includes(proj.id))

  const handleSelectAll = () => {
    if (value.length === projects.length) {
      onChange([])
    } else {
      onChange(projects.map(proj => proj.id))
    }
  }

  const handleToggleProject = (projectId: string) => {
    if (value.includes(projectId)) {
      onChange(value.filter(id => id !== projectId))
    } else {
      onChange([...value, projectId])
    }
  }

  const handleRemoveProject = (projectId: string) => {
    onChange(value.filter(id => id !== projectId))
  }

  const getDisplayText = () => {
    if (value.length === 0) return placeholder
    if (value.length === projects.length) return 'All projects'
    if (value.length === 1) {
      const project = projects.find(proj => proj.id === value[0])
      return project?.name || 'Unknown project'
    }
    return `${value.length} projects selected`
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || loading}
        className="w-full flex items-center justify-between px-4 py-3 text-left bg-white border border-slate-300 rounded-lg shadow-sm hover:border-slate-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex-1 min-w-0">
          {value.length === 0 ? (
            <span className="text-slate-500">{getDisplayText()}</span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {selectedProjects.slice(0, 2).map((project) => (
                <span
                  key={project.id}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-md"
                >
                  {project.name}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveProject(project.id)
                    }}
                    className="ml-1 hover:text-blue-900"
                  >
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {value.length > 2 && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-md">
                  +{value.length - 2} more
                </span>
              )}
            </div>
          )}
        </div>
        <ChevronDownIcon className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-2 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
          <div className="p-3 border-b border-slate-200">
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div className="p-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="w-full flex items-center px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md"
            >
              <div className="flex items-center justify-center w-4 h-4 border border-slate-300 rounded mr-3">
                {value.length === projects.length && (
                  <CheckIcon className="w-3 h-3 text-purple-600" />
                )}
              </div>
              <FolderIcon className="w-4 h-4 mr-2 text-slate-400" />
              {value.length === projects.length ? 'Deselect all' : 'Select all projects'}
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-slate-500">Loading projects...</div>
            ) : filteredProjects.length === 0 ? (
              <div className="p-4 text-center text-slate-500">
                {searchTerm ? 'No projects found' : 'No projects available'}
              </div>
            ) : (
              filteredProjects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => handleToggleProject(project.id)}
                  className="w-full flex items-center px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  <div className="flex items-center justify-center w-4 h-4 border border-slate-300 rounded mr-3">
                    {value.includes(project.id) && (
                      <CheckIcon className="w-3 h-3 text-purple-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="font-medium truncate">{project.name}</div>
                    {project.description && (
                      <div className="text-xs text-slate-500 truncate">{project.description}</div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Overlay to close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

export default ProjectMultiSelect