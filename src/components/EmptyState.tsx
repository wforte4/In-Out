'use client'

import React from 'react'

export interface EmptyStateProps {
  title: string
  message: string
  icon?: React.ReactNode
  iconColorScheme?: 'slate' | 'blue' | 'green' | 'red' | 'purple'
  className?: string
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  icon,
  iconColorScheme = 'slate',
  className = ''
}) => {
  const iconColorSchemes = {
    slate: 'from-slate-400 to-slate-600',
    blue: 'from-blue-400 to-blue-600',
    green: 'from-green-400 to-green-600',
    red: 'from-red-400 to-red-600',
    purple: 'from-purple-400 to-purple-600'
  }

  const defaultIcon = (
    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  )

  return (
    <div className={`bg-white/70 backdrop-blur-sm shadow-xl rounded-3xl border border-slate-200/50 overflow-hidden ${className}`}>
      <div className="text-center py-16">
        <div className={`w-16 h-16 bg-gradient-to-br ${iconColorSchemes[iconColorScheme]} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
          {icon || defaultIcon}
        </div>
        <p className="text-xl font-semibold text-slate-600 mb-4">{title}</p>
        <p className="text-slate-500">{message}</p>
      </div>
    </div>
  )
}

export default EmptyState