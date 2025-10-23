import { ArrowLeftIcon } from '@heroicons/react/24/outline'

interface PageHeaderProps {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  iconColor: 'blue' | 'purple' | 'green' | 'orange' | 'red'
  onBack?: () => void
  className?: string
}

const iconColorClasses = {
  blue: 'bg-blue-600',
  purple: 'bg-purple-600',
  green: 'bg-green-600',
  orange: 'bg-orange-600',
  red: 'bg-red-600'
}

export default function PageHeader({ 
  title, 
  description, 
  icon: Icon, 
  iconColor, 
  onBack,
  className = '' 
}: PageHeaderProps) {
  return (
    <div className={`mb-8 ${className}`}>
      <div className="flex items-center space-x-4 mb-4">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-6 h-6 text-slate-600" />
          </button>
        )}
        <div className="flex items-center space-x-3">
          <div className={`p-2 ${iconColorClasses[iconColor]} rounded-lg`}>
            <Icon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {title}
            </h1>
            <p className="text-slate-600">
              {description}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}