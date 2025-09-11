'use client'

import React, { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import Button from '../Button'
import Input from '../Input'
import CustomDropdown from '../CustomDropdown'
import { useSnackbar } from '../../hooks/useSnackbar'

interface AddCostModalProps {
  projectId: string
  onClose: () => void
  onCostAdded: () => void
}

export default function AddCostModal({
  projectId,
  onClose,
  onCostAdded
}: AddCostModalProps) {
  const snackbar = useSnackbar()
  const [loading, setLoading] = useState(false)
  const [newCost, setNewCost] = useState({
    costType: 'FIXED_COST' as 'FIXED_COST' | 'EXPENSE',
    amount: '',
    description: ''
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

    if (!newCost.amount) {
      snackbar.error('Amount is required')
      return
    }

    if (!newCost.description.trim()) {
      snackbar.error('Description is required')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/costs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          costType: newCost.costType,
          amount: parseFloat(newCost.amount),
          description: newCost.description || null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        snackbar.success('Cost added successfully!')
        onCostAdded()
        onClose()
      } else {
        snackbar.error(data.error || 'Failed to add cost')
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
          <h2 className="text-xl font-bold text-slate-900">Add Project Cost</h2>
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
            <CustomDropdown
              label="Cost Type"
              required
              options={[
                { value: 'FIXED_COST', label: 'Fixed Cost' },
                { value: 'EXPENSE', label: 'Expense' }
              ]}
              value={newCost.costType}
              onChange={(value) => setNewCost({ ...newCost, costType: value as typeof newCost.costType })}
              placeholder="Select cost type"
              className="w-full"
            />
            <Input
              label="Amount ($)"
              type="number"
              step="0.01"
              value={newCost.amount}
              onChange={(e) => setNewCost({ ...newCost, amount: e.target.value })}
              placeholder="500.00"
              required
            />
          </div>

          <Input
            label="Description"
            type="text"
            value={newCost.description}
            onChange={(e) => setNewCost({ ...newCost, description: e.target.value })}
            placeholder="Software licenses, materials, equipment, etc."
            required
          />

          {/* Footer */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              variant="success"
              loading={loading}
              disabled={loading}
            >
              Add Cost
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