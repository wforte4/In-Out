import { ShieldCheckIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import LoadingSpinner from './LoadingSpinner'

interface User {
  id: string
  email: string
  name: string | null
  systemAdmin: boolean
  emailVerified: boolean
  createdAt: string
  _count: {
    memberships: number
    timeEntries: number
  }
}

interface UserTableProps {
  users: User[]
  loading?: boolean
  emptyMessage?: string
  className?: string
}

export default function UserTable({ 
  users, 
  loading = false, 
  emptyMessage = 'No users found',
  className = '' 
}: UserTableProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className={`bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/50 overflow-hidden ${className}`}>
        <div className="p-8 text-center">
          <LoadingSpinner text="Loading users..." />
        </div>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className={`bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/50 overflow-hidden ${className}`}>
        <div className="p-8 text-center">
          <UserGroupIcon className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-2 text-sm font-medium text-slate-900">No users found</h3>
          <p className="mt-1 text-sm text-slate-500">{emptyMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/50 overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Organizations
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Time Entries
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Joined
              </th>
            </tr>
          </thead>
          <tbody className="bg-white/30 divide-y divide-slate-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {(user.name || user.email).charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-slate-900">
                        {user.name || 'No name'}
                      </div>
                      <div className="text-sm text-slate-500">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    {user.systemAdmin && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <ShieldCheckIcon className="w-3 h-3 mr-1" />
                        System Admin
                      </span>
                    )}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.emailVerified 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.emailVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                  {user._count.memberships}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                  {user._count.timeEntries}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {formatDate(user.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}