'use client'

import React from 'react'

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

interface Shift {
  id: string
  title: string
  description: string | null
  startTime: string
  endTime: string
  isRecurring: boolean
  recurringPattern: string | null
  assignedUser?: {
    id: string
    name: string | null
    email: string
  } | null
  project?: {
    id: string
    name: string
  } | null
  schedule: {
    id: string
    name: string
  }
}

interface CalendarDayData {
  date: Date
  entries: TimeEntry[]
  shifts: Shift[]
  totalHours: number
  isToday: boolean
  isCurrentMonth: boolean
}

interface CalendarDayProps {
  day: CalendarDayData
  viewMode: 'month' | 'week' | 'day'
  onClick: (day: CalendarDayData) => void
  formatTime: (timeString: string) => string
}

const CalendarDay: React.FC<CalendarDayProps> = ({
  day,
  viewMode,
  onClick,
  formatTime
}) => {
  if (viewMode === 'month') {
    return (
      <div
        onClick={() => onClick(day)}
        className={`min-h-[100px] p-2 border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors ${
          !day.isCurrentMonth ? 'bg-slate-50 text-slate-400' : 'bg-white'
        } ${day.isToday ? 'ring-2 ring-purple-500' : ''}`}
      >
        <div className={`text-sm font-semibold mb-2 ${day.isToday ? 'text-purple-600' : 'text-slate-900'}`}>
          {day.date.getDate()}
        </div>
        <div className="space-y-1">
          {day.totalHours > 0 && (
            <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              {day.totalHours.toFixed(1)}h logged
            </div>
          )}
          {day.shifts.length > 0 && (
            <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {day.shifts.length} shift{day.shifts.length > 1 ? 's' : ''}
            </div>
          )}
          {day.entries.slice(0, 1).map((entry) => (
            <div key={entry.id} className="text-xs text-green-700 truncate bg-green-50 px-1 py-0.5 rounded">
              ✓ {formatTime(entry.clockIn)} - {entry.clockOut ? formatTime(entry.clockOut) : 'Active'}
            </div>
          ))}
          {day.shifts.slice(0, 1).map((shift) => (
            <div key={shift.id} className="text-xs text-blue-700 truncate bg-blue-50 px-1 py-0.5 rounded">
              📅 {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
            </div>
          ))}
          {(day.entries.length + day.shifts.length) > 2 && (
            <div className="text-xs text-slate-400">
              +{(day.entries.length + day.shifts.length) - 2} more
            </div>
          )}
        </div>
      </div>
    )
  }

  if (viewMode === 'week') {
    return (
      <div
        onClick={() => onClick(day)}
        className={`min-h-[200px] p-3 rounded-2xl border cursor-pointer hover:shadow-md transition-all duration-200 ${
          day.isToday ? 'bg-gradient-to-br from-purple-50 to-blue-50 border-purple-300' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className={`text-sm font-bold ${day.isToday ? 'text-purple-600' : 'text-slate-900'}`}>
            {day.date.toLocaleDateString('en-US', { weekday: 'short' })}
          </div>
          <div className={`text-lg font-bold ${day.isToday ? 'text-purple-600' : 'text-slate-600'}`}>
            {day.date.getDate()}
          </div>
        </div>
        <div className="space-y-2">
          {day.totalHours > 0 && (
            <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-lg font-semibold">
              {day.totalHours.toFixed(1)} hours logged
            </div>
          )}
          {day.shifts.length > 0 && (
            <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-lg font-semibold">
              {day.shifts.length} scheduled shift{day.shifts.length > 1 ? 's' : ''}
            </div>
          )}
          {day.entries.slice(0, 2).map((entry) => (
            <div key={entry.id} className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded-lg">
              ✓ {formatTime(entry.clockIn)} - {entry.clockOut ? formatTime(entry.clockOut) : 'Active'}
            </div>
          ))}
          {day.shifts.slice(0, 2).map((shift) => (
            <div key={shift.id} className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded-lg">
              📅 {shift.title}: {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
            </div>
          ))}
          {(day.entries.length + day.shifts.length) > 4 && (
            <div className="text-xs text-slate-500 italic">
              +{(day.entries.length + day.shifts.length) - 4} more items
            </div>
          )}
        </div>
      </div>
    )
  }

  return null
}

export default CalendarDay