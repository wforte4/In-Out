'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, UserPlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import Button from '../Button'
import Input from '../Input'
import SearchableSelect from '../SearchableSelect'
import { useSnackbar } from '../../hooks/useSnackbar'

interface ProjectEmployee {
  id: string
  hourlyRate: number | null
  role: string | null
  joinedAt: string
  user: {
    id: string
    name: string | null
    email: string
    defaultHourlyRate: number | null
  }
}

interface OrganizationMember {
  id: string
  user: {
    id: string
    name: string | null
    email: string
    defaultHourlyRate: number | null
  }
}

interface ProjectEmployeesModalProps {
  projectId: string
  projectName: string
  projectHourlyRate: number | null
  onClose: () => void
  onEmployeeUpdated: () => void
}

export default function ProjectEmployeesModal({
  projectId,
  projectName,
  projectHourlyRate,
  onClose,
  onEmployeeUpdated
}: ProjectEmployeesModalProps) {
  const [projectEmployees, setProjectEmployees] = useState<ProjectEmployee[]>([])
  const [orgMembers, setOrgMembers] = useState<OrganizationMember[]>([])
  const [loading, setLoading] = useState(true)
  const [editingEmployee, setEditingEmployee] = useState<ProjectEmployee | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newEmployee, setNewEmployee] = useState({
    userId: '',
    hourlyRate: '',
    role: ''
  })
  const [editForm, setEditForm] = useState({
    hourlyRate: '',
    role: ''
  })
  const snackbar = useSnackbar()

  useEffect(() => {
    fetchProjectEmployees()
    fetchOrgMembers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const fetchProjectEmployees = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/employees`)
      const data = await response.json()
      if (response.ok) {
        setProjectEmployees(data.projectEmployees || [])
      } else {
        snackbar.error(data.error || 'Failed to fetch project employees')
      }
    } catch (error) {
      console.error('Error fetching project employees:', error)
      snackbar.error('Error loading project employees')
    }
  }

  const fetchOrgMembers = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`)
      const data = await response.json()
      if (response.ok) {
        // Fetch org members
        const orgResponse = await fetch(`/api/organization/members?organizationId=${data.project.organizationId}`)
        const orgData = await orgResponse.json()
        if (orgResponse.ok) {
          setOrgMembers(orgData.members || [])
        }
      }
    } catch (error) {
      console.error('Error fetching organization members:', error)
    }
    setLoading(false)
  }

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmployee.userId) {
      snackbar.error('Please select an employee')
      return
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: newEmployee.userId,
          hourlyRate: newEmployee.hourlyRate || null,
          role: newEmployee.role || null
        })
      })

      const data = await response.json()
      if (response.ok) {
        snackbar.success('Employee added to project!')
        setShowAddForm(false)
        setNewEmployee({ userId: '', hourlyRate: '', role: '' })
        fetchProjectEmployees()
        onEmployeeUpdated()
      } else {
        snackbar.error(data.error || 'Failed to add employee')
      }
    } catch (error) {
      console.error('Error adding employee:', error)
      snackbar.error('Error adding employee')
    }
  }

  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEmployee) return

    try {
      const response = await fetch(`/api/projects/${projectId}/employees/${editingEmployee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hourlyRate: editForm.hourlyRate || null,
          role: editForm.role || null
        })
      })

      const data = await response.json()
      if (response.ok) {
        snackbar.success('Employee updated successfully!')
        setEditingEmployee(null)
        setEditForm({ hourlyRate: '', role: '' })
        fetchProjectEmployees()
        onEmployeeUpdated()
      } else {
        snackbar.error(data.error || 'Failed to update employee')
      }
    } catch (error) {
      console.error('Error updating employee:', error)
      snackbar.error('Error updating employee')
    }
  }

  const handleRemoveEmployee = async (employeeId: string) => {
    if (!confirm('Are you sure you want to remove this employee from the project?')) return

    try {
      const response = await fetch(`/api/projects/${projectId}/employees/${employeeId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        snackbar.success('Employee removed from project')
        fetchProjectEmployees()
        onEmployeeUpdated()
      } else {
        const data = await response.json()
        snackbar.error(data.error || 'Failed to remove employee')
      }
    } catch (error) {
      console.error('Error removing employee:', error)
      snackbar.error('Error removing employee')
    }
  }

  const startEdit = (employee: ProjectEmployee) => {
    setEditingEmployee(employee)
    setEditForm({
      hourlyRate: employee.hourlyRate?.toString() || '',
      role: employee.role || ''
    })
  }

  const getEffectiveRate = (employee: ProjectEmployee) => {
    return employee.hourlyRate || employee.user.defaultHourlyRate || projectHourlyRate || 0
  }

  const availableMembers = orgMembers.filter(member => 
    !projectEmployees.some(pe => pe.user.id === member.user.id)
  )

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-4 md:p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="text-lg md:text-2xl font-bold text-slate-900 truncate pr-4">
            <span className="hidden sm:inline">Manage Team - </span>{projectName}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* Add Employee Button */}
        <div className="mb-6">
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            variant="primary"
            size="sm"
            icon={<UserPlusIcon className="w-4 h-4" />}
            disabled={availableMembers.length === 0}
          >
            {availableMembers.length === 0 ? 'No more employees to add' : 'Add Employee'}
          </Button>
        </div>

        {/* Add Employee Form */}
        {showAddForm && (
          <div className="bg-slate-50 rounded-xl p-3 md:p-4 mb-4 md:mb-6">
            <h3 className="text-base md:text-lg font-semibold text-slate-900 mb-3 md:mb-4">Add Employee to Project</h3>
            <form onSubmit={handleAddEmployee} className="space-y-3 md:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Employee
                  </label>
                  <SearchableSelect
                    value={newEmployee.userId}
                    onChange={(value) => setNewEmployee({ ...newEmployee, userId: value as string })}
                    options={availableMembers.map(member => ({
                      value: member.user.id,
                      label: `${member.user.name || member.user.email} ${member.user.defaultHourlyRate ? `($${member.user.defaultHourlyRate}/hr)` : ''}`
                    }))}
                    placeholder="Choose employee..."
                  />
                </div>
                <Input
                  label="Project Hourly Rate ($)"
                  type="number"
                  step="0.01"
                  value={newEmployee.hourlyRate}
                  onChange={(e) => setNewEmployee({ ...newEmployee, hourlyRate: e.target.value })}
                  placeholder="Leave empty to use default"
                />
                <Input
                  label="Project Role"
                  type="text"
                  value={newEmployee.role}
                  onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
                  placeholder="Developer, Designer, etc."
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button type="submit" variant="success" size="sm" fullWidth={true} className="sm:w-auto">
                  Add to Project
                </Button>
                <Button 
                  type="button" 
                  onClick={() => setShowAddForm(false)} 
                  variant="secondary" 
                  size="sm"
                  fullWidth={true} 
                  className="sm:w-auto"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Current Employees */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Current Team Members ({projectEmployees.length})
          </h3>
          
          {projectEmployees.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No employees assigned to this project yet
            </div>
          ) : (
            <div className="space-y-3">
              {projectEmployees.map((employee) => (
                <div key={employee.id} className="bg-white border border-slate-200 rounded-xl p-4">
                  {editingEmployee?.id === employee.id ? (
                    <form onSubmit={handleEditEmployee} className="space-y-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-slate-900">
                            {employee.user.name || employee.user.email}
                          </h4>
                          <p className="text-sm text-slate-600">
                            Default Rate: ${employee.user.defaultHourlyRate || 'Not set'}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Project Hourly Rate ($)"
                          type="number"
                          step="0.01"
                          value={editForm.hourlyRate}
                          onChange={(e) => setEditForm({ ...editForm, hourlyRate: e.target.value })}
                          placeholder="Leave empty to use default"
                        />
                        <Input
                          label="Project Role"
                          type="text"
                          value={editForm.role}
                          onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                          placeholder="Developer, Designer, etc."
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button type="submit" variant="success" size="sm">
                          Save Changes
                        </Button>
                        <Button 
                          type="button" 
                          onClick={() => setEditingEmployee(null)} 
                          variant="secondary" 
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-slate-900">
                            {employee.user.name || employee.user.email}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => startEdit(employee)}
                              className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <PencilIcon className="w-4 h-4 text-slate-400" />
                            </button>
                            <button
                              onClick={() => handleRemoveEmployee(employee.id)}
                              className="p-1 hover:bg-red-100 rounded-lg transition-colors"
                            >
                              <TrashIcon className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-slate-600">
                          <span>
                            Effective Rate: <span className="font-semibold text-green-600">${getEffectiveRate(employee).toFixed(2)}/hr</span>
                          </span>
                          {employee.role && (
                            <span>Role: <span className="font-medium">{employee.role}</span></span>
                          )}
                          <span>Joined: {new Date(employee.joinedAt).toLocaleDateString()}</span>
                        </div>
                        {employee.hourlyRate && employee.hourlyRate !== employee.user.defaultHourlyRate && (
                          <div className="mt-1 text-xs text-blue-600">
                            Project-specific rate (default: ${employee.user.defaultHourlyRate || 'Not set'}/hr)
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}