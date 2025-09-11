'use client'

import { motion } from 'framer-motion'

interface Activity {
  id: string
  type: 'time_entry' | 'project_created' | 'user_joined' | 'admin_action'
  description: string
  user: {
    name: string | null
    email: string
  }
  timestamp: string
}

interface RecentActivityProps {
  activities: Activity[]
  title?: string
  maxItems?: number
}

export default function RecentActivity({ 
  activities, 
  title = 'Recent Activity',
  maxItems = 8 
}: RecentActivityProps) {
  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'time_entry': return 'bg-green-500'
      case 'project_created': return 'bg-blue-500'
      case 'user_joined': return 'bg-purple-500'
      default: return 'bg-orange-500'
    }
  }

  return (
    <motion.div 
      className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-slate-200/50 p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      <h3 className="text-lg font-semibold text-slate-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {activities.slice(0, maxItems).map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3">
            <div className={`w-2 h-2 rounded-full mt-2 ${getActivityColor(activity.type)}`} />
            <div className="flex-1">
              <p className="text-sm text-slate-800">{activity.description}</p>
              <p className="text-xs text-slate-500">{new Date(activity.timestamp).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}