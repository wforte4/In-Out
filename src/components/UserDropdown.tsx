'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'

interface UserDropdownProps {
  showOrganization?: boolean
}

export default function UserDropdown({ showOrganization = true }: UserDropdownProps) {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  if (!session?.user) return null

  const userName = session.user.name || session.user.email || ''
  const userInitial = userName.charAt(0).toUpperCase()

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-1 rounded-xl hover:bg-slate-100/50 transition-colors duration-200 cursor-pointer"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-semibold">
            {userInitial}
          </span>
        </div>
        <span className="text-sm font-medium text-slate-700 hidden sm:block">{userName}</span>
        <svg 
          className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 py-2 z-50">
          <div className="px-4 py-3 border-b border-slate-200/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">
                  {userInitial}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{session.user.name || 'No name'}</p>
                <p className="text-xs text-slate-600">{session.user.email}</p>
              </div>
            </div>
          </div>

          <div className="py-2">
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100/70 hover:text-purple-700 transition-colors duration-200 cursor-pointer"
            >
              <svg className="w-5 h-5 mr-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
              </svg>
              Dashboard
            </Link>

            <Link
              href="/timesheet"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100/70 hover:text-purple-700 transition-colors duration-200 cursor-pointer"
            >
              <svg className="w-5 h-5 mr-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              My Timesheet
            </Link>

            {showOrganization && (
              <Link
                href="/organization"
                onClick={() => setIsOpen(false)}
                className="flex items-center px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100/70 hover:text-purple-700 transition-colors duration-200 cursor-pointer"
              >
                <svg className="w-5 h-5 mr-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Organization
              </Link>
            )}

            <Link
              href="/account"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100/70 hover:text-purple-700 transition-colors duration-200 cursor-pointer"
            >
              <svg className="w-5 h-5 mr-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              My Account
            </Link>

            <div className="border-t border-slate-200/50 mt-2 pt-2">
              <button
                onClick={() => {
                  setIsOpen(false)
                  signOut()
                }}
                className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-200 cursor-pointer"
              >
                <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}