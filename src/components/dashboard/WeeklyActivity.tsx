'use client'

import { motion } from 'framer-motion'

interface WeeklyActivityData {
  day: string
  hours: number
  entries: number
}

interface WeeklyActivityProps {
  data: WeeklyActivityData[]
  title?: string
}

export default function WeeklyActivity({ data, title = 'Weekly Activity' }: WeeklyActivityProps) {
  const maxHours = Math.max(...data.map(d => d.hours))

  return (
    <motion.div 
      className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-slate-200/50 p-6"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <h3 className="text-lg font-semibold text-slate-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((day, index) => (
          <div key={day.day} className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700 w-16">{day.day}</span>
            <div className="flex-1 mx-4">
              <div className="bg-slate-200 rounded-full h-2">
                <motion.div 
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((day.hours / maxHours) * 100, 100)}%` }}
                  transition={{ duration: 0.8, delay: 0.5 + index * 0.1 }}
                />
              </div>
            </div>
            <span className="text-sm text-slate-600 w-12 text-right">{day.hours.toFixed(1)}h</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}