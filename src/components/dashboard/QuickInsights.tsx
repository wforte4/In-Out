'use client'

import { motion } from 'framer-motion'
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

interface Insight {
  id: string
  title: string
  value: string
  change: number
  changeType: 'increase' | 'decrease' | 'neutral'
  icon: React.ReactNode
  color: string
  trend: number[]
  alert?: {
    type: 'warning' | 'success' | 'info'
    message: string
  }
}

interface QuickInsightsProps {
  insights: Insight[]
}

export default function QuickInsights({ insights }: QuickInsightsProps) {
  const getChangeIcon = (changeType: 'increase' | 'decrease' | 'neutral') => {
    switch (changeType) {
      case 'increase':
        return <ArrowTrendingUpIcon className="w-4 h-4" />
      case 'decrease':
        return <ArrowTrendingDownIcon className="w-4 h-4" />
      default:
        return null
    }
  }

  const getChangeColor = (changeType: 'increase' | 'decrease' | 'neutral') => {
    switch (changeType) {
      case 'increase':
        return 'text-green-600'
      case 'decrease':
        return 'text-red-600'
      default:
        return 'text-slate-500'
    }
  }

  const getAlertIcon = (type: 'warning' | 'success' | 'info') => {
    switch (type) {
      case 'warning':
        return <ExclamationTriangleIcon className="w-4 h-4" />
      case 'success':
        return <CheckCircleIcon className="w-4 h-4" />
      default:
        return <ClockIcon className="w-4 h-4" />
    }
  }

  const getAlertColor = (type: 'warning' | 'success' | 'info') => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200'
      case 'success':
        return 'bg-green-50 text-green-800 border-green-200'
      default:
        return 'bg-blue-50 text-blue-800 border-blue-200'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-slate-200/50 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900">Quick Insights</h3>
        <div className="flex items-center space-x-1 text-xs text-slate-500">
          <ClockIcon className="w-3 h-3" />
          <span>Live data</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {insights.map((insight, index) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`relative p-4 rounded-xl border ${insight.color} transition-all duration-200 hover:shadow-md`}
          >
            {/* Alert Badge */}
            {insight.alert && (
              <div className={`absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-medium border flex items-center space-x-1 ${getAlertColor(insight.alert.type)}`}>
                {getAlertIcon(insight.alert.type)}
                <span>Alert</span>
              </div>
            )}

            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <div className="text-slate-600">
                    {insight.icon}
                  </div>
                  <h4 className="text-sm font-medium text-slate-700">{insight.title}</h4>
                </div>
                
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-slate-900">{insight.value}</span>
                  {insight.change !== 0 && (
                    <div className={`flex items-center space-x-1 text-sm ${getChangeColor(insight.changeType)}`}>
                      {getChangeIcon(insight.changeType)}
                      <span>{Math.abs(insight.change)}%</span>
                    </div>
                  )}
                </div>

                {/* Mini Trend Line */}
                <div className="mt-2 flex items-end space-x-1 h-6">
                  {insight.trend.map((value, i) => (
                    <div
                      key={i}
                      className={`w-1 rounded-t transition-all duration-300 ${
                        insight.changeType === 'increase' ? 'bg-green-400' :
                        insight.changeType === 'decrease' ? 'bg-red-400' :
                        'bg-slate-400'
                      }`}
                      style={{ height: `${Math.max(value * 100, 8)}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Alert Message */}
            {insight.alert && (
              <div className="mt-3 text-xs text-slate-600 bg-slate-50 rounded p-2">
                {insight.alert.message}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

// Mock data generator for demo
export const generateMockInsights = (): Insight[] => {
  return [
    {
      id: 'productivity',
      title: 'Team Productivity',
      value: '94%',
      change: 8.5,
      changeType: 'increase',
      icon: <UserGroupIcon className="w-5 h-5" />,
      color: 'bg-green-50 border-green-200',
      trend: [0.6, 0.7, 0.8, 0.85, 0.9, 0.94, 1.0],
      alert: {
        type: 'success',
        message: 'Team exceeded productivity targets this week!'
      }
    },
    {
      id: 'billable-hours',
      title: 'Billable Hours',
      value: '347h',
      change: -12.3,
      changeType: 'decrease',
      icon: <ClockIcon className="w-5 h-5" />,
      color: 'bg-yellow-50 border-yellow-200',
      trend: [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.35],
      alert: {
        type: 'warning',
        message: 'Billable hours down 12% from last month'
      }
    },
    {
      id: 'project-revenue',
      title: 'Project Revenue',
      value: '$28.4k',
      change: 15.7,
      changeType: 'increase',
      icon: <CurrencyDollarIcon className="w-5 h-5" />,
      color: 'bg-blue-50 border-blue-200',
      trend: [0.4, 0.5, 0.6, 0.75, 0.8, 0.9, 1.0]
    },
    {
      id: 'overdue-tasks',
      title: 'Overdue Items',
      value: '3',
      change: 0,
      changeType: 'neutral',
      icon: <CalendarDaysIcon className="w-5 h-5" />,
      color: 'bg-red-50 border-red-200',
      trend: [0.8, 0.6, 0.4, 0.3, 0.3, 0.3, 0.3],
      alert: {
        type: 'info',
        message: '2 projects need immediate attention'
      }
    }
  ]
}