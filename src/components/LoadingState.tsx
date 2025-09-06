'use client'

import React from 'react'

export interface LoadingStateProps {
  message?: string
  iconColorScheme?: 'purple' | 'blue' | 'green' | 'red' | 'orange'
  className?: string
}

const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  iconColorScheme = 'purple',
  className = ''
}) => {
  const iconColorSchemes = {
    purple: 'from-purple-600 to-blue-600',
    blue: 'from-blue-600 to-indigo-600', 
    green: 'from-green-600 to-emerald-600',
    red: 'from-red-600 to-pink-600',
    orange: 'from-orange-600 to-amber-600'
  }

  return (
    <div className={`max-w-7xl mx-auto py-8 sm:px-6 lg:px-8 ${className}`}>
      <div className="px-4 py-6 sm:px-0 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 bg-gradient-to-br ${iconColorSchemes[iconColorScheme]} rounded-lg animate-pulse`}></div>
          <span className="text-slate-600 font-medium">{message}</span>
        </div>
      </div>
    </div>
  )
}

export default LoadingState