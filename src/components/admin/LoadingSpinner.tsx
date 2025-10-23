interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'blue' | 'red' | 'green' | 'gray'
  text?: string
  className?: string
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-12 w-12'
}

const colorClasses = {
  blue: 'border-blue-600',
  red: 'border-red-600',
  green: 'border-green-600',
  gray: 'border-gray-600'
}

export default function LoadingSpinner({ 
  size = 'md', 
  color = 'blue', 
  text,
  className = '' 
}: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`animate-spin rounded-full border-b-2 ${sizeClasses[size]} ${colorClasses[color]}`}></div>
      {text && (
        <p className="mt-2 text-slate-600 text-sm">{text}</p>
      )}
    </div>
  )
}