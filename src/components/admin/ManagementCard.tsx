interface ManagementCardProps {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  iconColor: 'blue' | 'purple' | 'green' | 'orange' | 'red'
  onClick: () => void
  className?: string
}

const iconColorClasses = {
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  green: 'bg-green-500',
  orange: 'bg-orange-500',
  red: 'bg-red-500'
}

export default function ManagementCard({ 
  title, 
  description, 
  icon: Icon, 
  iconColor, 
  onClick, 
  className = '' 
}: ManagementCardProps) {
  return (
    <button
      onClick={onClick}
      className={`bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-6 text-left hover:bg-white/90 transition-all duration-200 cursor-pointer ${className}`}
    >
      <div className="flex items-center space-x-4">
        <div className={`p-3 ${iconColorClasses[iconColor]} rounded-xl`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
      </div>
    </button>
  )
}