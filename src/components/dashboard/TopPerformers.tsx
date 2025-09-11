'use client'

import { motion } from 'framer-motion'

interface Performer {
  userId: string
  userName: string | null
  userEmail: string
  hours: number
  cost: number
}

interface TopPerformersProps {
  performers: Performer[]
  title?: string
  maxItems?: number
}

export default function TopPerformers({ 
  performers, 
  title = 'Top Performers',
  maxItems = 5 
}: TopPerformersProps) {
  const getRankColor = (index: number) => {
    switch (index) {
      case 0: return 'bg-yellow-500'
      case 1: return 'bg-gray-400'
      case 2: return 'bg-orange-600'
      default: return 'bg-slate-400'
    }
  }

  return (
    <motion.div 
      className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-slate-200/50 p-6"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <h3 className="text-lg font-semibold text-slate-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {performers.slice(0, maxItems).map((performer, index) => (
          <div key={performer.userId} className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${getRankColor(index)}`}>
              {index + 1}
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-900">{performer.userName || performer.userEmail}</p>
              <p className="text-sm text-slate-600">{performer.hours.toFixed(1)}h • ${performer.cost.toFixed(0)}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}