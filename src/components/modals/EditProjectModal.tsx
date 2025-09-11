'use client'

import React, { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import Button from '../Button'
import Input from '../Input'
import Textarea from '../Textarea'
import CustomDropdown from '../CustomDropdown'
import { useSnackbar } from '../../hooks/useSnackbar'

interface EditProjectModalProps {
  projectId: string
  initialProject: {
    name: string
    description: string | null
    status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED'
    estimatedHours: number | null
    hourlyRate: number | null
    fixedCost: number | null
  }
  onClose: () => void
  onProjectUpdated: () => void
}

export default function EditProjectModal({
  projectId,
  initialProject,
  onClose,
  onProjectUpdated
}: EditProjectModalProps) {
  const snackbar = useSnackbar()
  const [loading, setLoading] = useState(false)
  const [editProject, setEditProject] = useState({
    name: initialProject.name,
    description: initialProject.description || '',
    status: initialProject.status,
    estimatedHours: initialProject.estimatedHours?.toString() || '',
    hourlyRate: initialProject.hourlyRate?.toString() || '',
    fixedCost: initialProject.fixedCost?.toString() || ''
  })

  useEffect(() => {
    // Lock body scroll when modal is open
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editProject.name.trim()) {
      snackbar.error('Project name is required')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editProject.name,
          description: editProject.description || null,
          status: editProject.status,
          estimatedHours: editProject.estimatedHours ? parseFloat(editProject.estimatedHours) : null,
          hourlyRate: editProject.hourlyRate ? parseFloat(editProject.hourlyRate) : null,
          fixedCost: editProject.fixedCost ? parseFloat(editProject.fixedCost) : null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        snackbar.success('Project updated successfully!')
        onProjectUpdated()
        onClose()
      } else {
        snackbar.error(data.error || 'Failed to update project')
      }
    } catch {
      snackbar.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/50 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200/50">
          <h2 className="text-xl font-bold text-slate-900">Edit Project</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Project Name"
              type="text"
              value={editProject.name}
              onChange={(e) => setEditProject({ ...editProject, name: e.target.value })}
              placeholder="Website Redesign, Mobile App, etc."
              required
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Status
              </label>
              <CustomDropdown
                label=""
                options={[
                  { value: 'ACTIVE', label: 'Active' },
                  { value: 'COMPLETED', label: 'Completed' },
                  { value: 'ON_HOLD', label: 'On Hold' },
                  { value: 'CANCELLED', label: 'Cancelled' }
                ]}
                value={editProject.status}
                onChange={(value) => setEditProject({ ...editProject, status: value as typeof editProject.status })}
                placeholder="Select status"
                className="w-full"
              />
            </div>
          </div>

          <Textarea
            label="Description"
            value={editProject.description}
            onChange={(e) => setEditProject({ ...editProject, description: e.target.value })}
            placeholder="Brief description of the project..."
            rows={3}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Estimated Hours"
              type="number"
              step="0.1"
              value={editProject.estimatedHours}
              onChange={(e) => setEditProject({ ...editProject, estimatedHours: e.target.value })}
              placeholder="120"
            />
            <Input
              label="Default Hourly Rate ($)"
              type="number"
              step="0.01"
              value={editProject.hourlyRate}
              onChange={(e) => setEditProject({ ...editProject, hourlyRate: e.target.value })}
              placeholder="75.00"
            />
            <Input
              label="Fixed Project Cost ($)"
              type="number"
              step="0.01"
              value={editProject.fixedCost}
              onChange={(e) => setEditProject({ ...editProject, fixedCost: e.target.value })}
              placeholder="5000.00"
            />
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              disabled={loading}
            >
              Update Project
            </Button>
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}