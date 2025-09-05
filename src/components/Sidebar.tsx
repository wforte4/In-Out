'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

interface SidebarProps {
  showOrganization?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

export default function Sidebar({ showOrganization = true, onCollapsedChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()

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

  const handleToggleCollapse = () => {
    const newCollapsed = !isCollapsed
    setIsCollapsed(newCollapsed)
    onCollapsedChange?.(newCollapsed)
  }

  const mainNavItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
        </svg>
      ),
    },
    {
      name: 'My Timesheet',
      href: '/timesheet',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      name: 'My Schedule',
      href: '/my-schedule',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 8l-2-2m6 0l-2 2m-2-4v8" />
        </svg>
      ),
    },
  ]

  const organizationNavItems = [
    {
      name: 'Projects',
      href: '/projects',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 00-2 2v2" />
        </svg>
      ),
    },
    {
      name: 'Organization',
      href: '/organization',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      name: 'Manage Schedules',
      href: '/schedules',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      name: 'Team Invitations',
      href: '/invitations',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ]

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
                <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
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
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  isActiveLink(item.href)
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
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    isActiveLink(item.href)
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