'use client'

import React from 'react'

export interface SectionCardProps {
  children: React.ReactNode
  title: string
  description: string
  icon?: React.ReactNode
  iconColorScheme?: 'blue' | 'green' | 'red' | 'purple' | 'orange'
  className?: string
}

const SectionCard: React.FC<SectionCardProps> = ({
  children,
  title,
  description,
  icon,
  iconColorScheme = 'blue',
  className = ''
}) => {
  const iconColorSchemes = {
    blue: 'from-blue-500 to-indigo-500',
    green: 'from-green-500 to-emerald-500', 
    red: 'from-red-500 to-pink-500',
    purple: 'from-purple-500 to-pink-500',
    orange: 'from-orange-500 to-amber-500'
  }

  return (
    <div className={`bg-white/70 backdrop-blur-sm shadow-xl rounded-3xl border border-slate-200/50 overflow-hidden ${className}`}>
      <div className="px-8 py-8">
        <div className="flex items-center space-x-4 mb-6">
          {icon && (
            <div className={`w-16 h-16 bg-gradient-to-br ${iconColorSchemes[iconColorScheme]} rounded-2xl flex items-center justify-center`}>
              {icon}
            </div>
          )}
          <div>
            <h3 className="text-2xl font-bold text-slate-900">{title}</h3>
            <p className="text-slate-600">{description}</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}

export default SectionCard