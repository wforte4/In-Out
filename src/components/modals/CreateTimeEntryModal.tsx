'use client'

import React, { useState } from 'react'
import Button from '../Button'
import TextInput from '../TextInput'
import DateTimePicker from '../DateTimePicker'
import CustomDropdown from '../CustomDropdown'
import { useSnackbar } from '../../hooks/useSnackbar'

interface Project {
  id: string
  name: string
  description?: string | null
}

interface Organization {
  id: string
  name: string
}

export interface CreateTimeEntryModalProps {
  onClose?: () => void
  selectedDate?: Date | null
  organizations: Organization[]
  projects: Project[]
  onEntryCreated?: () => void
}

const CreateTimeEntryModal: React.FC<CreateTimeEntryModalProps> = ({
  onClose,
  selectedDate,
  organizations,
  projects,
  onEntryCreated
}) => {
  const snackbar = useSnackbar()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    clockIn: selectedDate || new Date(),
    clockOut: null as Date | null,
    description: '',
    projectId: '',
    organizationId: organizations[0]?.id || ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.clockIn) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/time/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clockIn: formData.clockIn.toISOString(),
          clockOut: formData.clockOut?.toISOString() || null,
          description: formData.description || null,
          projectId: formData.projectId || null,
          organizationId: formData.organizationId || null
        })
      })

      if (response.ok) {
        snackbar.success('Time entry created successfully!')
        onEntryCreated?.()
        onClose?.()
      } else {
        const data = await response.json()
        snackbar.error(data.error || 'Failed to create time entry')
      }
    } catch (error) {
      console.error('Error creating time entry:', error)
      snackbar.error('Failed to create time entry')
    }
    setLoading(false)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900">Log Time</h2>
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
            onChange={(date) => setFormData({...formData, clockIn: date || new Date()})}
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

        {organizations.length > 1 && (
          <CustomDropdown
            label="Organization"
            options={organizations.map(org => ({ value: org.id, label: org.name }))}
            value={formData.organizationId}
            onChange={(value) => setFormData({...formData, organizationId: value})}
            placeholder="Select an organization"
            className="w-full"
          />
        )}

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

        <TextInput
          label="Description"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Optional description"
        />

        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
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
            variant="success"
            loading={loading}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          >
            Log Time
          </Button>
        </div>
      </form>
    </div>
  )
}

export default CreateTimeEntryModal