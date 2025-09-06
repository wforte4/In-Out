'use client'

import React from 'react'
import Button from './Button'

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
  editor?: {
    name: string | null
    email: string
  } | null
}

interface TimeEntryCardProps {
  entry: TimeEntry
  onEdit: (entry: TimeEntry) => void
  formatTime: (timeString: string) => string
  calculateHours: (clockIn: string, clockOut: string | null) => number
  showUserInfo?: boolean
}

const TimeEntryCard: React.FC<TimeEntryCardProps> = ({
  entry,
  onEdit,
  formatTime,
  calculateHours,
  showUserInfo = false
}) => {
  const hours = calculateHours(entry.clockIn, entry.clockOut)

  return (
    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/50">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-4 mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-slate-900">
                {formatTime(entry.clockIn)}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm font-semibold text-slate-900">
                {entry.clockOut ? formatTime(entry.clockOut) : 'Active'}
              </span>
            </div>
            <div className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">
              {hours.toFixed(2)} hours
            </div>
          </div>

          {showUserInfo && (
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {(entry.user.name || entry.user.email).charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {entry.user.name || 'No name'}
                </p>
                <p className="text-xs text-slate-500">{entry.user.email}</p>
              </div>
            </div>
          )}

          {entry.project && (
            <p className="text-sm text-purple-600 font-medium mb-2">
              Project: {entry.project.name}
            </p>
          )}

          {entry.description && (
            <div className="text-sm text-slate-600 mb-2">
              {entry.description}
            </div>
          )}

          {entry.organization && (
            <p className="text-xs text-slate-500">
              Organization: {entry.organization.name}
            </p>
          )}

          {entry.editedBy && entry.editedAt && (
            <div className="text-xs text-slate-500 mt-2">
              Edited by {entry.editor?.name || entry.editor?.email} on {new Date(entry.editedAt).toLocaleString()}
            </div>
          )}
        </div>

        <div className="ml-4">
          <Button
            onClick={() => onEdit(entry)}
            variant="secondary"
            size="sm"
            icon={
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            }
          >
            Edit
          </Button>
        </div>
      </div>
    </div>
  )
}

export default TimeEntryCard