'use client'

import React from 'react'

interface Schedule {
  id: string
  name: string
}

interface Shift {
  id: string
  title: string
  description: string | null
  startTime: string
  endTime: string
  isRecurring: boolean
  recurringPattern: string | null
  schedule: Schedule
}

export interface ShiftCardProps {
  shift: Shift
  variant?: 'today' | 'upcoming'
  className?: string
}

const ShiftCard: React.FC<ShiftCardProps> = ({
  shift,
  variant = 'upcoming',
  className = ''
}) => {
  const calculateDuration = () => {
    return Math.round((new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) / (1000 * 60 * 60) * 10) / 10
  }

  const variantStyles = {
    today: {
      background: 'from-green-50 to-green-100/50',
      border: 'border-green-200/50',
      timeColor: 'text-green-700'
    },
    upcoming: {
      background: 'from-slate-50 to-slate-100/50',
      border: 'border-slate-200/50',
      timeColor: 'text-slate-700'
    }
  }

  const style = variantStyles[variant]

  return (
    <div className={`bg-gradient-to-r ${style.background} rounded-2xl p-6 border ${style.border} ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{shift.title}</h3>
          {shift.description && (
            <p className="text-slate-600 mt-1">{shift.description}</p>
          )}
          <p className="text-sm text-slate-500 mt-2">Schedule: {shift.schedule.name}</p>
          {shift.isRecurring && (
            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-semibold mt-2">
              Recurring: {shift.recurringPattern}
            </span>
          )}
        </div>
        <div className="text-right">
          {variant === 'today' ? (
            <>
              <div className={`text-lg font-bold ${style.timeColor}`}>
                {new Date(shift.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(shift.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
              <div className="text-sm text-slate-500 mt-1">
                Duration: {calculateDuration()}h
              </div>
            </>
          ) : (
            <>
              <div className={`text-lg font-bold ${style.timeColor}`}>
                {new Date(shift.startTime).toLocaleDateString()}
              </div>
              <div className="text-sm text-slate-600">
                {new Date(shift.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(shift.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
              <div className="text-sm text-slate-500 mt-1">
                Duration: {calculateDuration()}h
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ShiftCard