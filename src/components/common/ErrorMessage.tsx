import { AlertCircle } from 'lucide-react'

interface ErrorMessageProps {
  message?: string | null
  className?: string
}

function ErrorMessage({ message, className = '' }: ErrorMessageProps) {
  if (!message) return null

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
        <p className="text-sm text-red-800">{message}</p>
      </div>
    </div>
  )
}

export default ErrorMessage
