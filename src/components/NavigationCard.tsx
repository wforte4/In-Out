'use client'

import React from 'react'

export interface NavigationCardProps {
  title: string
  description: string
  onClick: () => void
  icon: React.ReactNode
  colorScheme?: 'blue' | 'orange' | 'purple' | 'green' | 'red'
  className?: string
}

const NavigationCard: React.FC<NavigationCardProps> = ({
  title,
  description,
  onClick,
  icon,
  colorScheme = 'blue',
  className = ''
}) => {
  const colorSchemes = {
    blue: {
      bg: 'from-blue-50 to-indigo-50',
      hoverBg: 'hover:from-blue-100 hover:to-indigo-100',
      border: 'border-blue-200/50',
      focus: 'focus:ring-blue-500',
      iconBg: 'from-blue-500 to-indigo-600',
      titleHover: 'group-hover:text-blue-900',
      descHover: 'group-hover:text-blue-700',
      arrowHover: 'group-hover:text-blue-600'
    },
    orange: {
      bg: 'from-orange-50 to-amber-50',
      hoverBg: 'hover:from-orange-100 hover:to-amber-100',
      border: 'border-orange-200/50',
      focus: 'focus:ring-orange-500',
      iconBg: 'from-orange-500 to-amber-600',
      titleHover: 'group-hover:text-orange-900',
      descHover: 'group-hover:text-orange-700',
      arrowHover: 'group-hover:text-orange-600'
    },
    purple: {
      bg: 'from-purple-50 to-pink-50',
      hoverBg: 'hover:from-purple-100 hover:to-pink-100',
      border: 'border-purple-200/50',
      focus: 'focus:ring-purple-500',
      iconBg: 'from-purple-500 to-pink-600',
      titleHover: 'group-hover:text-purple-900',
      descHover: 'group-hover:text-purple-700',
      arrowHover: 'group-hover:text-purple-600'
    },
    green: {
      bg: 'from-green-50 to-emerald-50',
      hoverBg: 'hover:from-green-100 hover:to-emerald-100',
      border: 'border-green-200/50',
      focus: 'focus:ring-green-500',
      iconBg: 'from-green-500 to-emerald-600',
      titleHover: 'group-hover:text-green-900',
      descHover: 'group-hover:text-green-700',
      arrowHover: 'group-hover:text-green-600'
    },
    red: {
      bg: 'from-red-50 to-rose-50',
      hoverBg: 'hover:from-red-100 hover:to-rose-100',
      border: 'border-red-200/50',
      focus: 'focus:ring-red-500',
      iconBg: 'from-red-500 to-rose-600',
      titleHover: 'group-hover:text-red-900',
      descHover: 'group-hover:text-red-700',
      arrowHover: 'group-hover:text-red-600'
    }
  }

  const scheme = colorSchemes[colorScheme]

  return (
    <button
      onClick={onClick}
      className={`w-full group relative p-6 bg-gradient-to-br ${scheme.bg} border ${scheme.border} rounded-2xl ${scheme.hoverBg} focus:outline-none focus:ring-2 ${scheme.focus} focus:ring-offset-2 transform hover:-translate-y-1 hover:shadow-lg transition-all duration-200 cursor-pointer ${className}`}
    >
      <div className="flex items-center space-x-4">
        <div className={`w-12 h-12 bg-gradient-to-br ${scheme.iconBg} rounded-xl flex items-center justify-center`}>
          {icon}
        </div>
        <div className="flex-1 text-left">
          <div className={`text-lg font-bold text-slate-900 ${scheme.titleHover} transition-colors`}>
            {title}
          </div>
          <div className={`text-slate-600 ${scheme.descHover} transition-colors`}>
            {description}
          </div>
        </div>
        <svg className={`w-5 h-5 text-slate-400 ${scheme.arrowHover} transition-colors`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  )
}

export default NavigationCard