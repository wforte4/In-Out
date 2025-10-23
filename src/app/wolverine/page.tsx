'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AuthenticatedLayout from '../../components/AuthenticatedLayout'
import StatsCard from '../../components/admin/StatsCard'
import ManagementCard from '../../components/admin/ManagementCard'
import LoadingSpinner from '../../components/admin/LoadingSpinner'
import PageHeader from '../../components/admin/PageHeader'
import { useSystemAdminAuth } from '../../hooks/useSystemAdminAuth'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchSystemStats } from '../../store/slices/systemAdminSlice'
import {
  UserGroupIcon,
  BuildingOfficeIcon,
  ClockIcon,
  FolderIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

export default function WolverineSystemAdmin() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { isSystemAdmin, loading } = useSystemAdminAuth()
  const { stats, statsLoading } = useAppSelector((state) => state.systemAdmin)

  useEffect(() => {
    if (isSystemAdmin) {
      dispatch(fetchSystemStats())
    }
  }, [isSystemAdmin, dispatch])

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

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <PageHeader
            title="System Administration"
            description="Wolverine Control Panel - Manage all system resources"
            icon={ShieldCheckIcon}
            iconColor="red"
          />

          {/* Stats Cards */}
          {statsLoading ? (
            <div className="mb-8">
              <LoadingSpinner text="Loading system statistics..." />
            </div>
          ) : stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <StatsCard
                title="Total Users"
                value={stats.totalUsers}
                icon={UserGroupIcon}
                iconColor="blue"
              />
              <StatsCard
                title="Organizations"
                value={stats.totalOrganizations}
                icon={BuildingOfficeIcon}
                iconColor="purple"
              />
              <StatsCard
                title="Time Entries"
                value={stats.totalTimeEntries}
                icon={ClockIcon}
                iconColor="green"
              />
              <StatsCard
                title="Projects"
                value={stats.totalProjects}
                icon={FolderIcon}
                iconColor="orange"
              />
              <StatsCard
                title="System Admins"
                value={stats.systemAdmins}
                icon={ShieldCheckIcon}
                iconColor="red"
              />
            </div>
          )}

          {/* Management Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ManagementCard
              title="User Management"
              description="View, search, and manage all users"
              icon={UserGroupIcon}
              iconColor="blue"
              onClick={() => router.push('/wolverine/users')}
            />
            <ManagementCard
              title="Organizations"
              description="Manage all organizations and memberships"
              icon={BuildingOfficeIcon}
              iconColor="purple"
              onClick={() => router.push('/wolverine/organizations')}
            />
            <ManagementCard
              title="System Settings"
              description="Configure system-wide settings"
              icon={ShieldCheckIcon}
              iconColor="red"
              onClick={() => router.push('/wolverine/system')}
            />
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}