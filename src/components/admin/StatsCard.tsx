interface StatsCardProps {
  title: string
  value: number | string
  icon: React.ComponentType<{ className?: string }>
  iconColor: 'blue' | 'purple' | 'green' | 'orange' | 'red'
  className?: string
}

const iconColorClasses = {
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  green: 'bg-green-500',
  orange: 'bg-orange-500',
  red: 'bg-red-500'
}

export default function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  iconColor, 
  className = '' 
}: StatsCardProps) {
  return (
    <div className={`bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-6 ${className}`}>
      <div className="flex items-center">
        <div className={`p-2 ${iconColorClasses[iconColor]} rounded-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  )
}