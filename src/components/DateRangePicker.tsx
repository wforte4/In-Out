'use client'

import React, { useState } from 'react'
import { CalendarIcon } from '@heroicons/react/24/outline'

export interface DateRange {
  startDate: string
  endDate: string
}

interface DateRangePickerProps {
  value: DateRange
  onChange: (dateRange: DateRange) => void
  className?: string
  disabled?: boolean
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  className = '',
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const handleStartDateChange = (newStartDate: string) => {
    onChange({
      ...value,
      startDate: newStartDate
    })
  }

  const handleEndDateChange = (newEndDate: string) => {
    onChange({
      ...value,
      endDate: newEndDate
    })
  }

  const getPresetRanges = () => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    
    // Last 7 days
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    // Last 30 days
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    // This month
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    
    // Last month
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]

    return [
      { label: 'Last 7 days', startDate: last7Days, endDate: today },
      { label: 'Last 30 days', startDate: last30Days, endDate: today },
      { label: 'This month', startDate: thisMonthStart, endDate: today },
      { label: 'Last month', startDate: lastMonthStart, endDate: lastMonthEnd }
    ]
  }

  const displayText = value.startDate && value.endDate
    ? `${formatDate(value.startDate)} - ${formatDate(value.endDate)}`
    : 'Select date range'

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full flex items-center justify-between px-4 py-3 text-left bg-white border border-slate-300 rounded-lg shadow-sm hover:border-slate-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className={value.startDate && value.endDate ? 'text-slate-900' : 'text-slate-500'}>
          {displayText}
        </span>
        <CalendarIcon className="w-5 h-5 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-2 w-full bg-white border border-slate-200 rounded-lg shadow-lg">
          <div className="p-4 space-y-4">
            {/* Preset ranges */}
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-2">Quick select</h4>
              <div className="grid grid-cols-2 gap-2">
                {getPresetRanges().map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      onChange({ startDate: preset.startDate, endDate: preset.endDate })
                      setIsOpen(false)
                    }}
                    className="px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <h4 className="text-sm font-medium text-slate-700 mb-2">Custom range</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={value.startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={value.endDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    min={value.startDate}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                Apply
              </button>
            </div>
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

export default DateRangePicker