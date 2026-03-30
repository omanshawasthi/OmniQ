import React from 'react'
import { Loader2 } from 'lucide-react'

export const Loading = ({ 
  size = 'md', 
  text = 'Loading...', 
  className = '',
  overlay = false 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  }

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  }

  const content = (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className={`animate-spin ${sizeClasses[size]} text-primary-600 mr-2`} />
      {text && <span className={`${textSizes[size]} text-gray-600`}>{text}</span>}
    </div>
  )

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
        {content}
      </div>
    )
  }

  return content
}

export const PageLoading = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <Loading size="lg" text="Loading application..." />
  </div>
)

export const TableLoading = ({ colSpan = 1 }) => (
  <tr>
    <td colSpan={colSpan} className="px-6 py-12">
      <Loading size="md" text="Loading data..." className="justify-center" />
    </td>
  </tr>
)

export const CardLoading = () => (
  <div className="animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
  </div>
)

export const SkeletonLoader = ({ 
  lines = 3, 
  className = '',
  avatar = false 
}) => (
  <div className={`animate-pulse ${className}`}>
    {avatar && (
      <div className="h-10 w-10 bg-gray-200 rounded-full mb-4"></div>
    )}
    {Array.from({ length: lines }).map((_, index) => (
      <div
        key={index}
        className={`h-4 bg-gray-200 rounded mb-2 ${
          index === lines - 1 ? 'w-3/4' : 'w-full'
        }`}
      ></div>
    ))}
  </div>
)

export default Loading
