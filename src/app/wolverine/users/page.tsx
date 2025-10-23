'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AuthenticatedLayout from '../../../components/AuthenticatedLayout'
import TextInput from '../../../components/TextInput'
import LoadingSpinner from '../../../components/admin/LoadingSpinner'
import PageHeader from '../../../components/admin/PageHeader'
import UserTable from '../../../components/admin/UserTable'
import Pagination from '../../../components/admin/Pagination'
import { useSystemAdminAuth } from '../../../hooks/useSystemAdminAuth'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { fetchUsers, setSearchQuery } from '../../../store/slices/systemAdminSlice'
import {
  UserGroupIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'

export default function WolverineUserManagement() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { isSystemAdmin, loading } = useSystemAdminAuth()
  const { 
    users, 
    usersLoading, 
    searchQuery, 
    currentPage 
  } = useAppSelector((state) => state.systemAdmin)

  useEffect(() => {
    if (isSystemAdmin) {
      dispatch(fetchUsers({ page: 1 }))
    }
  }, [isSystemAdmin, dispatch])

  const handleSearch = (query: string) => {
    dispatch(setSearchQuery(query))
    dispatch(fetchUsers({ page: 1, search: query }))
  }

  const handlePageChange = (page: number) => {
    dispatch(fetchUsers({ page, search: searchQuery }))
  }

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" color="red" />
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    )
  }

  if (!isSystemAdmin) {
    return null
  }

  const emptyMessage = searchQuery 
    ? 'Try adjusting your search criteria.' 
    : 'No users exist in the system.'

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <PageHeader
            title="User Management"
            description="View and manage all system users"
            icon={UserGroupIcon}
            iconColor="blue"
            onBack={() => router.push('/wolverine')}
          />

          {/* Stats and Search */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center space-x-4">
                {users && (
                  <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-slate-200/50 px-4 py-2">
                    <span className="text-sm font-medium text-slate-600">
                      Total Users: <span className="text-slate-900 font-bold">{users.totalUsers}</span>
                    </span>
                  </div>
                )}
              </div>
              
              <div className="relative max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
                </div>
                <TextInput
                  id="search"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search by name, email..."
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Users Table */}
          <UserTable
            users={users?.users || []}
            loading={usersLoading}
            emptyMessage={emptyMessage}
          />

          {/* Pagination */}
          {users && users.totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={users.totalPages}
              totalItems={users.totalUsers}
              itemsPerPage={25}
              onPageChange={handlePageChange}
              className="mt-6"
            />
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  )
}