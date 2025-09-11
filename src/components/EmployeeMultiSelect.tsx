'use client'

import React, { useState, useEffect } from 'react'
import { ChevronDownIcon, XMarkIcon, UsersIcon } from '@heroicons/react/24/outline'
import { CheckIcon } from '@heroicons/react/24/solid'

export interface Employee {
  id: string
  name: string
  email: string
}

interface EmployeeMultiSelectProps {
  value: string[]
  onChange: (selectedIds: string[]) => void
  organizationId: string
  className?: string
  disabled?: boolean
  placeholder?: string
}

const EmployeeMultiSelect: React.FC<EmployeeMultiSelectProps> = ({
  value,
  onChange,
  organizationId,
  className = '',
  disabled = false,
  placeholder = 'Select employees'
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (organizationId) {
      fetchEmployees()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId])

  const fetchEmployees = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/organization/${organizationId}/members`)
      if (response.ok) {
        const data = await response.json()
        setEmployees(data.members.map((member: { user: { id: string; name: string; email: string } }) => ({
          id: member.user.id,
          name: member.user.name || member.user.email,
          email: member.user.email
        })))
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedEmployees = employees.filter(emp => value.includes(emp.id))

  const handleSelectAll = () => {
    if (value.length === employees.length) {
      onChange([])
    } else {
      onChange(employees.map(emp => emp.id))
    }
  }

  const handleToggleEmployee = (employeeId: string) => {
    if (value.includes(employeeId)) {
      onChange(value.filter(id => id !== employeeId))
    } else {
      onChange([...value, employeeId])
    }
  }

  const handleRemoveEmployee = (employeeId: string) => {
    onChange(value.filter(id => id !== employeeId))
  }

  const getDisplayText = () => {
    if (value.length === 0) return placeholder
    if (value.length === employees.length) return 'All employees'
    if (value.length === 1) {
      const employee = employees.find(emp => emp.id === value[0])
      return employee?.name || 'Unknown employee'
    }
    return `${value.length} employees selected`
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || loading}
        className="w-full flex items-center justify-between px-4 py-3 text-left bg-white border border-slate-300 rounded-lg shadow-sm hover:border-slate-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex-1 min-w-0">
          {value.length === 0 ? (
            <span className="text-slate-500">{getDisplayText()}</span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {selectedEmployees.slice(0, 2).map((employee) => (
                <span
                  key={employee.id}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-md"
                >
                  {employee.name}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveEmployee(employee.id)
                    }}
                    className="ml-1 hover:text-purple-900"
                  >
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {value.length > 2 && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-md">
                  +{value.length - 2} more
                </span>
              )}
            </div>
          )}
        </div>
        <ChevronDownIcon className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-2 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
          <div className="p-3 border-b border-slate-200">
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div className="p-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="w-full flex items-center px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md"
            >
              <div className="flex items-center justify-center w-4 h-4 border border-slate-300 rounded mr-3">
                {value.length === employees.length && (
                  <CheckIcon className="w-3 h-3 text-purple-600" />
                )}
              </div>
              <UsersIcon className="w-4 h-4 mr-2 text-slate-400" />
              {value.length === employees.length ? 'Deselect all' : 'Select all employees'}
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-slate-500">Loading employees...</div>
            ) : filteredEmployees.length === 0 ? (
              <div className="p-4 text-center text-slate-500">
                {searchTerm ? 'No employees found' : 'No employees available'}
              </div>
            ) : (
              filteredEmployees.map((employee) => (
                <button
                  key={employee.id}
                  type="button"
                  onClick={() => handleToggleEmployee(employee.id)}
                  className="w-full flex items-center px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  <div className="flex items-center justify-center w-4 h-4 border border-slate-300 rounded mr-3">
                    {value.includes(employee.id) && (
                      <CheckIcon className="w-3 h-3 text-purple-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="font-medium truncate">{employee.name}</div>
                    <div className="text-xs text-slate-500 truncate">{employee.email}</div>
                  </div>
                </button>
              ))
            )}
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

export default EmployeeMultiSelect