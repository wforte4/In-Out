'use client'

import React from 'react'

interface TimeEntry {
  id: string
  clockIn: string
  clockOut: string | null
  totalHours: number | null
  description: string | null
  project?: {
    id: string
    name: string
  }
  organization?: {
    id: string
    name: string
  }
}

export interface ActiveTimeEntryCardProps {
  activeEntry: TimeEntry
  className?: string
}

const ActiveTimeEntryCard: React.FC<ActiveTimeEntryCardProps> = ({
  activeEntry,
  className = ''
}) => {
  const calculateCurrentHours = () => {
    const clockIn = new Date(activeEntry.clockIn)
    const now = new Date()
    return Math.round(((now.getTime() - clockIn.getTime()) / (1000 * 60 * 60)) * 100) / 100
  }

  return (
    <div className={`relative bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200/50 rounded-2xl p-6 ${className}`}>
      <div className="absolute top-4 right-4">
        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
      </div>
      <div className="flex items-start space-x-4">
        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="text-lg font-bold text-emerald-900 mb-2">Currently Clocked In</h4>
          <div className="space-y-1">
            <p className="text-emerald-800">
              <span className="font-medium">Started:</span> {new Date(activeEntry.clockIn).toLocaleTimeString()}
            </p>
            <p className="text-emerald-800">
              <span className="font-medium">Hours worked:</span> {calculateCurrentHours()}
            </p>
            {activeEntry.description && (
              <p className="text-emerald-800">
                <span className="font-medium">Working on:</span> {activeEntry.description}
              </p>
            )}
            {activeEntry.project && (
              <p className="text-emerald-800">
                <span className="font-medium">Project:</span> {activeEntry.project.name}
              </p>
            )}
            {activeEntry.organization && (
              <p className="text-emerald-800">
                <span className="font-medium">Organization:</span> {activeEntry.organization.name}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ActiveTimeEntryCard