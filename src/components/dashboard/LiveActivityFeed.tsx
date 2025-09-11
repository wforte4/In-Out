'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ClockIcon,
  UserIcon,
  FolderIcon,
  CurrencyDollarIcon,
  PlayIcon,
  StopIcon,
  PlusIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface ActivityItem {
  id: string
  type: 'time_start' | 'time_stop' | 'project_created' | 'cost_added' | 'project_completed' | 'user_joined' | 'task_updated'
  user: {
    name: string
    avatar?: string
  }
  message: string
  timestamp: Date
  metadata?: {
    project?: string
    amount?: number
    duration?: number
    status?: string
  }
  priority: 'low' | 'medium' | 'high'
}

interface LiveActivityFeedProps {
  activities: ActivityItem[]
  maxItems?: number
  autoRefresh?: boolean
  refreshInterval?: number
}

export default function LiveActivityFeed({ 
  activities: initialActivities, 
  maxItems = 10, 
  autoRefresh = true,
  refreshInterval = 30000 
}: LiveActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>(initialActivities)
  const [isLive, setIsLive] = useState(autoRefresh)

  // Simulate real-time activity updates
  useEffect(() => {
    if (!isLive) return

    const interval = setInterval(() => {
      // Generate random activity
      const newActivity = generateRandomActivity()
      setActivities(prev => [newActivity, ...prev.slice(0, maxItems - 1)])
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [isLive, maxItems, refreshInterval])

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'time_start':
        return <PlayIcon className="w-4 h-4" />
      case 'time_stop':
        return <StopIcon className="w-4 h-4" />
      case 'project_created':
        return <FolderIcon className="w-4 h-4" />
      case 'cost_added':
        return <CurrencyDollarIcon className="w-4 h-4" />
      case 'project_completed':
        return <CheckCircleIcon className="w-4 h-4" />
      case 'user_joined':
        return <UserIcon className="w-4 h-4" />
      case 'task_updated':
        return <PencilSquareIcon className="w-4 h-4" />
      default:
        return <ClockIcon className="w-4 h-4" />
    }
  }

  const getActivityColor = (type: ActivityItem['type'], priority: ActivityItem['priority']) => {
    const baseColors = {
      time_start: 'bg-green-100 text-green-600 border-green-200',
      time_stop: 'bg-red-100 text-red-600 border-red-200',
      project_created: 'bg-blue-100 text-blue-600 border-blue-200',
      cost_added: 'bg-yellow-100 text-yellow-600 border-yellow-200',
      project_completed: 'bg-purple-100 text-purple-600 border-purple-200',
      user_joined: 'bg-indigo-100 text-indigo-600 border-indigo-200',
      task_updated: 'bg-orange-100 text-orange-600 border-orange-200'
    }

    let color = baseColors[type] || 'bg-slate-100 text-slate-600 border-slate-200'

    if (priority === 'high') {
      color = color.replace('100', '200').replace('600', '700')
    }

    return color
  }

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  const getPriorityIndicator = (priority: ActivityItem['priority']) => {
    switch (priority) {
      case 'high':
        return <ExclamationTriangleIcon className="w-3 h-3 text-red-500" />
      case 'medium':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full" />
      case 'low':
        return <div className="w-2 h-2 bg-green-500 rounded-full" />
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-slate-200/50 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-slate-900">Live Activity</h3>
          <motion.div
            animate={{ scale: isLive ? [1, 1.2, 1] : 1 }}
            transition={{ duration: 1, repeat: isLive ? Infinity : 0 }}
            className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500' : 'bg-slate-400'}`}
          />
        </div>
        <button
          onClick={() => setIsLive(!isLive)}
          className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
            isLive
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {isLive ? 'Live' : 'Paused'}
        </button>
      </div>

      {/* Activity List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {activities.slice(0, maxItems).map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="flex items-start space-x-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
            >
              {/* Icon */}
              <div className={`p-2 rounded-lg border ${getActivityColor(activity.type, activity.priority)}`}>
                {getActivityIcon(activity.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-slate-900 font-medium">
                      {activity.user.name}
                    </p>
                    <p className="text-sm text-slate-600 mt-1">
                      {activity.message}
                    </p>
                    
                    {/* Metadata */}
                    {activity.metadata && (
                      <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                        {activity.metadata.project && (
                          <span className="flex items-center space-x-1">
                            <FolderIcon className="w-3 h-3" />
                            <span>{activity.metadata.project}</span>
                          </span>
                        )}
                        {activity.metadata.amount && (
                          <span className="flex items-center space-x-1">
                            <CurrencyDollarIcon className="w-3 h-3" />
                            <span>${activity.metadata.amount.toFixed(2)}</span>
                          </span>
                        )}
                        {activity.metadata.duration && (
                          <span className="flex items-center space-x-1">
                            <ClockIcon className="w-3 h-3" />
                            <span>{activity.metadata.duration}h</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-2">
                    {getPriorityIndicator(activity.priority)}
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                      {formatTimestamp(activity.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Showing {Math.min(activities.length, maxItems)} of {activities.length} activities</span>
          <span>Updates every {refreshInterval / 1000}s</span>
        </div>
      </div>
    </motion.div>
  )
}

// Helper function to generate random activities for demo
const generateRandomActivity = (): ActivityItem => {
  const types: ActivityItem['type'][] = ['time_start', 'time_stop', 'project_created', 'cost_added', 'project_completed', 'user_joined', 'task_updated']
  const users = ['Alice Smith', 'Bob Johnson', 'Carol Davis', 'David Wilson', 'Eva Brown']
  const projects = ['Website Redesign', 'Mobile App', 'API Development', 'Database Migration', 'UI/UX Research']
  
  const type = types[Math.floor(Math.random() * types.length)]
  const user = users[Math.floor(Math.random() * users.length)]
  const project = projects[Math.floor(Math.random() * projects.length)]

  const messages = {
    time_start: `started working on ${project}`,
    time_stop: `stopped working on ${project}`,
    project_created: `created a new project: ${project}`,
    cost_added: `added a cost to ${project}`,
    project_completed: `completed ${project}`,
    user_joined: `joined the team`,
    task_updated: `updated a task in ${project}`
  }

  return {
    id: Math.random().toString(36).substr(2, 9),
    type,
    user: { name: user },
    message: messages[type],
    timestamp: new Date(),
    metadata: {
      project: ['project_created', 'cost_added', 'project_completed', 'task_updated'].includes(type) ? project : undefined,
      amount: type === 'cost_added' ? Math.random() * 1000 + 100 : undefined,
      duration: type === 'time_stop' ? Math.random() * 8 + 1 : undefined
    },
    priority: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low'
  }
}