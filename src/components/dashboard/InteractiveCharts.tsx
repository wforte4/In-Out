'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ChartBarIcon,
  ChartPieIcon,
  PresentationChartLineIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline'

interface ChartData {
  id: string
  label: string
  value: number
  color: string
  trend?: number[]
}

interface InteractiveChartsProps {
  title: string
  data: ChartData[]
  type?: 'bar' | 'pie' | 'line' | 'heatmap'
  height?: number
}

export default function InteractiveCharts({ 
  title, 
  data, 
  type = 'bar', 
  height = 300 
}: InteractiveChartsProps) {
  const [chartType, setChartType] = useState(type)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const maxValue = Math.max(...data.map(d => d.value))

  const renderBarChart = () => {
    return (
      <div className="flex items-end justify-center space-x-4 h-full px-4">
        {data.map((item, index) => (
          <motion.div
            key={item.id}
            className="flex flex-col items-center space-y-2 cursor-pointer"
            onHoverStart={() => setHoveredIndex(index)}
            onHoverEnd={() => setHoveredIndex(null)}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className={`w-12 rounded-t-lg transition-all duration-300 ${item.color} relative`}
              style={{ height: `${(item.value / maxValue) * 80}%` }}
              initial={{ height: 0 }}
              animate={{ height: `${(item.value / maxValue) * 80}%` }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
            >
              {hoveredIndex === index && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-xs rounded px-2 py-1"
                >
                  {item.value}
                </motion.div>
              )}
            </motion.div>
            <span className="text-xs text-slate-600 text-center max-w-16 truncate">
              {item.label}
            </span>
          </motion.div>
        ))}
      </div>
    )
  }

  const renderPieChart = () => {
    const total = data.reduce((sum, item) => sum + item.value, 0)
    let cumulativeAngle = 0

    return (
      <div className="flex items-center justify-center h-full">
        <div className="relative">
          <svg width="200" height="200" className="transform -rotate-90">
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100
              const angle = (percentage / 100) * 360
              const startAngle = cumulativeAngle
              cumulativeAngle += angle

              const radius = 80
              const centerX = 100
              const centerY = 100

              const x1 = centerX + radius * Math.cos((startAngle * Math.PI) / 180)
              const y1 = centerY + radius * Math.sin((startAngle * Math.PI) / 180)
              const x2 = centerX + radius * Math.cos(((startAngle + angle) * Math.PI) / 180)
              const y2 = centerY + radius * Math.sin(((startAngle + angle) * Math.PI) / 180)

              const largeArcFlag = angle > 180 ? 1 : 0
              const pathData = [
                `M ${centerX} ${centerY}`,
                `L ${x1} ${y1}`,
                `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                'Z'
              ].join(' ')

              return (
                <motion.path
                  key={item.id}
                  d={pathData}
                  className={`${item.color.replace('bg-', 'fill-')} stroke-white stroke-2 cursor-pointer`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={{
                    filter: hoveredIndex === index ? 'brightness(1.1)' : 'none',
                    transform: hoveredIndex === index ? 'scale(1.05)' : 'scale(1)',
                    transformOrigin: '100px 100px'
                  }}
                />
              )
            })}
          </svg>
          
          {/* Legend */}
          <div className="absolute -right-32 top-0 space-y-2">
            {data.map((item, index) => (
              <div
                key={item.id}
                className={`flex items-center space-x-2 text-sm transition-opacity ${
                  hoveredIndex === null || hoveredIndex === index ? 'opacity-100' : 'opacity-50'
                }`}
              >
                <div className={`w-3 h-3 rounded ${item.color}`} />
                <span className="text-slate-700">{item.label}</span>
                <span className="text-slate-500">({((item.value / total) * 100).toFixed(1)}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderLineChart = () => {
    if (!data[0]?.trend) return <div className="flex items-center justify-center h-full text-slate-500">No trend data available</div>

    const trendLength = data[0].trend.length
    const maxTrendValue = Math.max(...data.flatMap(d => d.trend || []))

    return (
      <div className="relative h-full px-8 py-4">
        <svg width="100%" height="100%" className="overflow-visible">
          {data.map((item, seriesIndex) => {
            if (!item.trend) return null

            const points = item.trend.map((value, index) => ({
              x: (index / (trendLength - 1)) * 100,
              y: ((maxTrendValue - value) / maxTrendValue) * 80
            }))

            const pathData = points
              .map((point, index) => 
                index === 0 ? `M ${point.x}% ${point.y}%` : `L ${point.x}% ${point.y}%`
              )
              .join(' ')

            return (
              <g key={item.id}>
                <motion.path
                  d={pathData}
                  fill="none"
                  className={`stroke-2 ${item.color.replace('bg-', 'stroke-')}`}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1, delay: seriesIndex * 0.2 }}
                />
                {points.map((point, pointIndex) => (
                  <motion.circle
                    key={pointIndex}
                    cx={`${point.x}%`}
                    cy={`${point.y}%`}
                    r="3"
                    className={`${item.color.replace('bg-', 'fill-')} cursor-pointer`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3, delay: seriesIndex * 0.2 + pointIndex * 0.1 }}
                    whileHover={{ scale: 1.5 }}
                  />
                ))}
              </g>
            )
          })}
        </svg>
      </div>
    )
  }

  const renderHeatmap = () => {
    const rows = 7 // Days of week
    const cols = Math.ceil(data.length / rows)

    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: rows * cols }).map((_, index) => {
            const dataItem = data[index]
            const intensity = dataItem ? (dataItem.value / maxValue) : 0
            
            return (
              <motion.div
                key={index}
                className={`w-8 h-8 rounded cursor-pointer transition-all duration-200 ${
                  dataItem ? dataItem.color : 'bg-slate-100'
                }`}
                style={{ opacity: intensity }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.02 }}
                whileHover={{ scale: 1.2 }}
                onHoverStart={() => dataItem && setHoveredIndex(index)}
                onHoverEnd={() => setHoveredIndex(null)}
              >
                {hoveredIndex === index && dataItem && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bg-slate-900 text-white text-xs rounded px-2 py-1 pointer-events-none z-10"
                    style={{ marginTop: '-2.5rem' }}
                  >
                    {dataItem.label}: {dataItem.value}
                  </motion.div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderChart = () => {
    switch (chartType) {
      case 'bar': return renderBarChart()
      case 'pie': return renderPieChart()
      case 'line': return renderLineChart()
      case 'heatmap': return renderHeatmap()
      default: return renderBarChart()
    }
  }

  const chartTypeIcons = {
    bar: ChartBarIcon,
    pie: ChartPieIcon,
    line: PresentationChartLineIcon,
    heatmap: Squares2X2Icon
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
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <div className="flex space-x-2">
          {Object.entries(chartTypeIcons).map(([type, Icon]) => (
            <button
              key={type}
              onClick={() => setChartType(type as typeof chartType)}
              className={`p-2 rounded-lg transition-all duration-200 ${
                chartType === type
                  ? 'bg-purple-100 text-purple-600'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-5 h-5" />
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: `${height}px` }} className="relative">
        {renderChart()}
      </div>
    </motion.div>
  )
}