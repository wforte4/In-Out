'use client'

import { ReactNode } from 'react'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: ReactNode
  gradient: string
  textColor?: string
}

export default function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  gradient,
  textColor = 'text-white'
}: MetricCardProps) {
  return (
    <div className={`bg-gradient-to-r ${gradient} rounded-2xl p-6 ${textColor}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`${textColor === 'text-white' ? 'text-opacity-80' : 'text-slate-600'} text-sm font-medium`}>
            {title}
          </p>
          <p className="text-3xl font-bold">{value}</p>
          {subtitle && (
            <p className={`${textColor === 'text-white' ? 'text-opacity-70' : 'text-slate-500'} text-xs mt-1`}>
              {subtitle}
            </p>
          )}
        </div>
        <div className={`${textColor === 'text-white' ? 'text-opacity-60' : 'text-slate-400'}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}