'use client'

import React, { useState } from 'react'
import Button from '../Button'
import TextInput from '../TextInput'
import CustomDropdown from '../CustomDropdown'
import SimpleRichTextEditor from '../SimpleRichTextEditor'
import { useSnackbar } from '../../hooks/useSnackbar'

interface User {
  id: string
  name: string | null
  email: string
}

interface Project {
  id: string
  name: string
  description?: string | null
}

interface Organization {
  id: string
  name: string
  userRole: string
  isAdmin: boolean
  memberships: Array<{
    id: string
    role: string
    user: User
  }>
}

export interface AddShiftModalProps {
  onClose?: () => void
  selectedOrg?: Organization
  projects: Project[]
  scheduleId?: string
  onShiftCreated?: () => void
}

const AddShiftModal: React.FC<AddShiftModalProps> = ({
  onClose,
  selectedOrg,
  projects,
  scheduleId,
  onShiftCreated
}) => {
  const snackbar = useSnackbar()
  const [loading, setLoading] = useState(false)
  const [shiftFormData, setShiftFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    userId: '',
    projectId: '',
    isRecurring: false,
    recurringPattern: '',
    recurringEndDate: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...shiftFormData,
          scheduleId: scheduleId,
          userId: shiftFormData.userId || null,
          projectId: shiftFormData.projectId || null
        })
      })
      
      if (response.ok) {
        snackbar.success('Shift created successfully!')
        onShiftCreated?.()
        onClose?.()
      } else {
        const data = await response.json()
        snackbar.error(data.error || 'Failed to create shift')
      }
    } catch (error) {
      console.error('Error creating shift:', error)
      snackbar.error('Failed to create shift')
    }
    
    setLoading(false)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900">Add New Shift</h2>
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
        <TextInput
          label="Title"
          value={shiftFormData.title}
          onChange={(e) => setShiftFormData({...shiftFormData, title: e.target.value})}
          placeholder="Morning Shift, Customer Service, etc."
          required
        />

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
          <SimpleRichTextEditor
            value={shiftFormData.description}
            onChange={(value) => setShiftFormData({...shiftFormData, description: value})}
            placeholder="Optional details about the shift"
            className="mb-2"
          />
        </div>

        <CustomDropdown
          label="Project"
          options={[
            { value: '', label: 'No Project' },
            ...projects.map(project => ({ value: project.id, label: project.name }))
          ]}
          value={shiftFormData.projectId}
          onChange={(value) => setShiftFormData({...shiftFormData, projectId: value})}
          placeholder="Select a project"
          className="w-full"
        />

        <CustomDropdown
          label="Assign to Employee"
          options={[
            { value: '', label: 'Unassigned' },
            ...(selectedOrg?.memberships.map(membership => ({
              value: membership.user.id,
              label: membership.user.name || membership.user.email
            })) || [])
          ]}
          value={shiftFormData.userId}
          onChange={(value) => setShiftFormData({...shiftFormData, userId: value})}
          placeholder="Select an employee"
          className="w-full"
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Start Time</label>
            <input
              type="datetime-local"
              value={shiftFormData.startTime}
              onChange={(e) => setShiftFormData({...shiftFormData, startTime: e.target.value})}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">End Time</label>
            <input
              type="datetime-local"
              value={shiftFormData.endTime}
              onChange={(e) => setShiftFormData({...shiftFormData, endTime: e.target.value})}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-slate-900"
            />
          </div>
        </div>

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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            Add Shift
          </Button>
        </div>
      </form>
    </div>
  )
}

export default AddShiftModal