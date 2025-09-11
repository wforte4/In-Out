'use client'

import { motion } from 'framer-motion'

interface ProjectStat {
  projectId: string
  projectName: string
  hours: number
  cost: number
  contributors: number
  completion: number
}

interface ProjectPerformanceTableProps {
  projects: ProjectStat[]
  title?: string
  maxItems?: number
}

export default function ProjectPerformanceTable({ 
  projects, 
  title = 'Project Performance',
  maxItems = 8 
}: ProjectPerformanceTableProps) {
  const getCompletionBadge = (completion: number) => {
    const badgeColor = 
      completion >= 100 ? 'bg-green-100 text-green-800' :
      completion >= 75 ? 'bg-blue-100 text-blue-800' :
      completion >= 50 ? 'bg-yellow-100 text-yellow-800' :
      'bg-slate-100 text-slate-800'

    return (
      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${badgeColor}`}>
        {completion.toFixed(0)}%
      </span>
    )
  }

  return (
    <motion.div 
      className="lg:col-span-2 bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-slate-200/50 p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <h3 className="text-lg font-semibold text-slate-900 mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-2 font-medium text-slate-900">Project</th>
              <th className="text-right py-2 font-medium text-slate-900">Hours</th>
              <th className="text-right py-2 font-medium text-slate-900">Revenue</th>
              <th className="text-right py-2 font-medium text-slate-900">Team</th>
              <th className="text-right py-2 font-medium text-slate-900">Progress</th>
            </tr>
          </thead>
          <tbody>
            {projects.slice(0, maxItems).map((project) => (
              <tr key={project.projectId} className="border-b border-slate-100">
                <td className="py-2 text-slate-800 font-medium">{project.projectName}</td>
                <td className="text-right py-2 text-slate-800">{project.hours.toFixed(1)}</td>
                <td className="text-right py-2 text-slate-800 font-semibold">${project.cost.toFixed(0)}</td>
                <td className="text-right py-2 text-slate-800">{project.contributors}</td>
                <td className="text-right py-2">
                  {getCompletionBadge(project.completion)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}