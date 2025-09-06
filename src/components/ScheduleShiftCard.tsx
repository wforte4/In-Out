'use client'

import React from 'react'
import RichTextDisplay from './RichTextDisplay'

interface User {
  id: string
  name: string | null
  email: string
}

interface Shift {
  id: string
  title: string
  description: string | null
  startTime: string
  endTime: string
  isRecurring: boolean
  recurringPattern: string | null
  assignedUser: User | null
  project?: {
    id: string
    name: string
  } | null
}

interface ScheduleShiftCardProps {
  shift: Shift
  onEdit?: (shift: Shift) => void
  onDelete?: (shiftId: string) => void
}

const ScheduleShiftCard: React.FC<ScheduleShiftCardProps> = ({
  shift,
  onEdit,
  onDelete
}) => {
  return (
    <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-2xl p-4 border border-slate-200/50">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-slate-900">{shift.title}</h4>
          {shift.description && (
            <div className="text-sm text-slate-600 mt-1">
              <RichTextDisplay content={shift.description} />
            </div>
          )}
          {shift.project && (
            <p className="text-xs text-purple-600 mt-1 font-medium">
              Project: {shift.project.name}
            </p>
          )}
          <div className="flex items-center space-x-4 mt-2 text-sm text-slate-500">
            <span>{new Date(shift.startTime).toLocaleString()}</span>
            <span>→</span>
            <span>{new Date(shift.endTime).toLocaleString()}</span>
            {shift.isRecurring && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-semibold">
                {shift.recurringPattern}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            {shift.assignedUser ? (
              <div>
                <p className="font-semibold text-slate-900">{shift.assignedUser.name || 'No name'}</p>
                <p className="text-sm text-slate-600">{shift.assignedUser.email}</p>
              </div>
            ) : (
              <p className="text-slate-500 italic">Unassigned</p>
            )}
          </div>
          
          {(onEdit || onDelete) && (
            <div className="flex space-x-2">
              {onEdit && (
                <button
                  onClick={() => onEdit(shift)}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit shift"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(shift.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete shift"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ScheduleShiftCard