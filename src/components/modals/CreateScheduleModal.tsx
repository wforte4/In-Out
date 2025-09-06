'use client'

import React, { useState } from 'react'
import Button from '../Button'
import TextInput from '../TextInput'
import { useSnackbar } from '../../hooks/useSnackbar'

export interface CreateScheduleModalProps {
  onClose?: () => void
  selectedOrgId: string
  onScheduleCreated?: () => void
}

const CreateScheduleModal: React.FC<CreateScheduleModalProps> = ({
  onClose,
  selectedOrgId,
  onScheduleCreated
}) => {
  const snackbar = useSnackbar()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrgId || !formData.name) return

    setLoading(true)
    try {
      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          organizationId: selectedOrgId
        })
      })

      if (response.ok) {
        snackbar.success('Schedule created successfully!')
        onScheduleCreated?.()
        onClose?.()
      } else {
        const data = await response.json()
        snackbar.error(data.error || 'Failed to create schedule')
      }
    } catch (error) {
      console.error('Error creating schedule:', error)
      snackbar.error('Failed to create schedule')
    }
    setLoading(false)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900">Create New Schedule</h2>
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
          label="Schedule Name"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          placeholder="Weekly Schedule, Holiday Schedule, etc."
          required
        />

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-slate-900"
            rows={3}
            placeholder="Optional description of the schedule"
          />
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
            variant="primary"
            loading={loading}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            Create Schedule
          </Button>
        </div>
      </form>
    </div>
  )
}

export default CreateScheduleModal