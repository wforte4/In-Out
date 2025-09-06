'use client'

import React, { useState } from 'react'
import Button from '../Button'
import DateTimePicker from '../DateTimePicker'
import CustomDropdown from '../CustomDropdown'
import { useSnackbar } from '../../hooks/useSnackbar'

interface TimeEntry {
  id: string
  clockIn: string
  clockOut: string | null
  totalHours: number | null
  description: string | null
  organizationId: string | null
  editedBy: string | null
  editedAt: string | null
  user: {
    name: string | null
    email: string
  }
  project?: {
    id: string
    name: string
  } | null
  organization?: {
    id: string
    name: string
  } | null
}

interface Project {
  id: string
  name: string
  description?: string | null
}

export interface EditTimeEntryModalProps {
  onClose?: () => void
  entry: TimeEntry
  projects: Project[]
  onEntryUpdated?: () => void
}

const EditTimeEntryModal: React.FC<EditTimeEntryModalProps> = ({
  onClose,
  entry,
  projects,
  onEntryUpdated
}) => {
  const snackbar = useSnackbar()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    clockIn: new Date(entry.clockIn),
    clockOut: entry.clockOut ? new Date(entry.clockOut) : null,
    description: entry.description || '',
    projectId: entry.project?.id || ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.clockIn) return

    setLoading(true)
    try {
      const response = await fetch(`/api/time/entries/${entry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clockIn: formData.clockIn.toISOString(),
          clockOut: formData.clockOut?.toISOString() || null,
          description: formData.description || null,
          projectId: formData.projectId || null,
          organizationId: entry.organizationId
        })
      })

      if (response.ok) {
        snackbar.success('Time entry updated successfully!')
        onEntryUpdated?.()
        onClose?.()
      } else {
        const data = await response.json()
        snackbar.error(data.error || 'Failed to update time entry')
      }
    } catch (error) {
      console.error('Error updating time entry:', error)
      snackbar.error('Failed to update time entry')
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this time entry?')) return

    setLoading(true)
    try {
      const response = await fetch(`/api/time/entries/${entry.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        snackbar.success('Time entry deleted successfully!')
        onEntryUpdated?.()
        onClose?.()
      } else {
        const data = await response.json()
        snackbar.error(data.error || 'Failed to delete time entry')
      }
    } catch (error) {
      console.error('Error deleting time entry:', error)
      snackbar.error('Failed to delete time entry')
    }
    setLoading(false)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900">Edit Time Entry</h2>
        <button
          onClick={() => onClose?.()}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Clock In</label>
          <DateTimePicker
            selected={formData.clockIn}
            onChange={(date) => setFormData({...formData, clockIn: date || formData.clockIn})}
            showTimeSelect={true}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Clock Out</label>
          <DateTimePicker
            selected={formData.clockOut}
            onChange={(date) => setFormData({...formData, clockOut: date})}
            showTimeSelect={true}
            placeholderText="Select end time (optional)"
            minDate={formData.clockIn || undefined}
          />
        </div>

        <CustomDropdown
          label="Project"
          options={[
            { value: '', label: 'No Project' },
            ...projects.map(project => ({ value: project.id, label: project.name }))
          ]}
          value={formData.projectId}
          onChange={(value) => setFormData({...formData, projectId: value})}
          placeholder="Select a project"
          className="w-full"
        />

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-slate-900"
            rows={3}
            placeholder="Optional description"
          />
        </div>

        <div className="flex justify-between pt-4 border-t border-slate-200">
          <Button
            type="button"
            variant="danger"
            onClick={handleDelete}
            disabled={loading}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            }
          >
            Delete
          </Button>
          
          <div className="flex space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onClose?.()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              }
            >
              Update
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default EditTimeEntryModal