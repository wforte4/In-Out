'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import {
  BriefcaseIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  FolderIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  ChevronDoubleLeftIcon,
  ChartBarIcon,
  CogIcon
} from '@heroicons/react/24/outline'

interface SidebarProps {
  showOrganization?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

export default function Sidebar({ showOrganization = true, onCollapsedChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()

  useEffect(() => {
    const checkMobile = () => {
      const shouldCollapse = window.innerWidth < 768
      setIsCollapsed(shouldCollapse)
      onCollapsedChange?.(shouldCollapse)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [onCollapsedChange])

  // Check if user has admin access to any organization
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!session?.user) return

      try {
        const response = await fetch('/api/organization/members')
        const data = await response.json()
        if (response.ok && data.organizations) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const hasAdminAccess = data.organizations.some((org: any) => org.isAdmin)
          setIsAdmin(hasAdminAccess)
        }
      } catch (error) {
        console.error('Error checking admin status:', error)
        setIsAdmin(false)
      }
    }

    checkAdminStatus()
  }, [session])

  const handleToggleCollapse = () => {
    const newCollapsed = !isCollapsed
    setIsCollapsed(newCollapsed)
    onCollapsedChange?.(newCollapsed)
  }

  const mainNavItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: <BriefcaseIcon className="w-5 h-5" />,
    },
    {
      name: 'My Timesheet',
      href: '/timesheet',
      icon: <DocumentTextIcon className="w-5 h-5" />,
    },
    {
      name: 'My Schedule',
      href: '/my-schedule',
      icon: <CalendarDaysIcon className="w-5 h-5" />,
    },
  ]

  const allOrganizationNavItems = [
    {
      name: 'Admin Dashboard',
      href: '/admin',
      icon: <CogIcon className="w-5 h-5" />,
      adminOnly: true,
    },
    {
      name: 'Projects',
      href: '/projects',
      icon: <FolderIcon className="w-5 h-5" />,
      adminOnly: true,
    },
    {
      name: 'Reports',
      href: '/reports',
      icon: <ChartBarIcon className="w-5 h-5" />,
      adminOnly: true,
    },
    {
      name: 'Organization',
      href: '/organization',
      icon: <BuildingOfficeIcon className="w-5 h-5" />,
      adminOnly: false,
    },
    {
      name: 'Manage Schedules',
      href: '/schedules',
      icon: <CalendarDaysIcon className="w-5 h-5" />,
      adminOnly: true,
    },
    {
      name: 'Team Invitations',
      href: '/invitations',
      icon: <UserGroupIcon className="w-5 h-5" />,
      adminOnly: true,
    },
  ]

  const organizationNavItems = allOrganizationNavItems.filter(item =>
    !item.adminOnly || isAdmin
  )

  const isActiveLink = (href: string) => {
    return pathname === href
  }

  return (
    <div className={`fixed left-0 top-0 h-full bg-white/80 backdrop-blur-sm border-r border-slate-200 z-40 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 h-16">
          {isCollapsed ? (
            <button
              onClick={handleToggleCollapse}
              className="flex items-center justify-center w-full hover:bg-slate-100 rounded-lg p-1 transition-colors"
              title="Expand sidebar"
            >
              <Image
                src="/logo_simple.png"
                alt="In&Out Logo"
                width={24}
                height={24}
                className="object-contain"
              />
            </button>
          ) : (
            <>
              <Link href="/dashboard" className="flex items-center space-x-2">
                <Image
                  src="/logo_simple.png"
                  alt="In&Out Logo"
                  width={28}
                  height={28}
                  className="object-contain"
                />
                <span className="text-lg font-bold text-slate-900">In&Out</span>
              </Link>
              <button
                onClick={handleToggleCollapse}
                className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
                title="Collapse sidebar"
              >
                <ChevronDoubleLeftIcon className="w-5 h-5 text-slate-600" />
              </button>
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {/* Main Navigation */}
          <div className="space-y-1">
            {!isCollapsed && (
              <h3 className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Main
              </h3>
            )}
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${isActiveLink(item.href)
                  ? 'bg-purple-100 text-purple-900 border border-purple-200'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-purple-700'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? item.name : undefined}
              >
                <span className={`${isCollapsed ? '' : 'mr-3'}`}>
                  {item.icon}
                </span>
                {!isCollapsed && item.name}
              </Link>
            ))}
          </div>

          {/* Organization Navigation */}
          {showOrganization && (
            <div className="space-y-1 pt-4">
              {!isCollapsed && (
                <h3 className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Organization
                </h3>
              )}
              {isCollapsed && (
                <div className="border-b border-slate-200 mx-3 mb-2"></div>
              )}
              {organizationNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${isActiveLink(item.href)
                    ? 'bg-purple-100 text-purple-900 border border-purple-200'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-purple-700'
                    } ${isCollapsed ? 'justify-center' : ''}`}
                  title={isCollapsed ? item.name : undefined}
                >
                  <span className={`${isCollapsed ? '' : 'mr-3'}`}>
                    {item.icon}
                  </span>
                  {!isCollapsed && item.name}
                </Link>
              ))}
            </div>
          )}
        </nav>
      </div>
    </div>
  )
}