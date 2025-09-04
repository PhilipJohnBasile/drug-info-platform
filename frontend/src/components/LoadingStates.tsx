'use client'

import { Loader2, AlertCircle, RefreshCw, Search, Pill } from 'lucide-react'
import { ReactNode } from 'react'

// Generic loading spinner
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  text?: string
}

export function LoadingSpinner({ size = 'md', className = '', text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex items-center gap-2">
        <Loader2 className={`${sizeClasses[size]} animate-spin text-primary-600`} />
        {text && <span className="text-secondary-600">{text}</span>}
      </div>
    </div>
  )
}

// Page-level loading state
interface PageLoadingProps {
  title?: string
  description?: string
}

export function PageLoading({ title = 'Loading...', description }: PageLoadingProps) {
  return (
    <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
      <div className="text-center">
        <div className="bg-white rounded-full p-6 w-24 h-24 flex items-center justify-center mx-auto mb-4 shadow-sm">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
        </div>
        <h2 className="text-xl font-semibold text-secondary-900 mb-2">{title}</h2>
        {description && (
          <p className="text-secondary-600">{description}</p>
        )}
      </div>
    </div>
  )
}

// Card skeleton loader
export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="card animate-pulse">
          <div className="card-body">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-secondary-200 rounded-lg flex-shrink-0"></div>
              <div className="flex-1 space-y-3">
                <div className="h-6 bg-secondary-200 rounded w-3/4"></div>
                <div className="h-4 bg-secondary-100 rounded w-full"></div>
                <div className="h-4 bg-secondary-100 rounded w-2/3"></div>
                <div className="flex gap-2">
                  <div className="h-6 bg-secondary-100 rounded px-3 w-20"></div>
                  <div className="h-6 bg-secondary-100 rounded px-3 w-16"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Table skeleton loader
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-secondary-200">
      {/* Header */}
      <div className="bg-secondary-50 border-b border-secondary-200 p-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, index) => (
            <div key={index} className="h-4 bg-secondary-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="border-b border-secondary-200 p-4 last:border-b-0">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {Array.from({ length: cols }).map((_, colIndex) => (
              <div 
                key={colIndex} 
                className="h-4 bg-secondary-100 rounded animate-pulse"
                style={{ animationDelay: `${(rowIndex * cols + colIndex) * 50}ms` }}
              ></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// Button loading state
interface LoadingButtonProps {
  loading: boolean
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
  variant?: 'primary' | 'secondary' | 'outline'
}

export function LoadingButton({ 
  loading, 
  children, 
  onClick, 
  disabled, 
  className = '',
  variant = 'primary' 
}: LoadingButtonProps) {
  const baseClasses = 'btn flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline'
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      <span className={loading ? 'opacity-75' : ''}>{children}</span>
    </button>
  )
}

// Error state component
interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
  icon?: 'error' | 'search' | 'pill'
}

export function ErrorState({ 
  title = 'Something went wrong',
  message = 'Please try again later',
  onRetry,
  className = '',
  icon = 'error'
}: ErrorStateProps) {
  const iconComponents = {
    error: AlertCircle,
    search: Search,
    pill: Pill
  }
  
  const IconComponent = iconComponents[icon]

  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="max-w-md mx-auto">
        <div className="bg-danger-50 border border-danger-200 rounded-full p-6 w-24 h-24 flex items-center justify-center mx-auto mb-4">
          <IconComponent className="w-12 h-12 text-danger-600" />
        </div>
        <h3 className="text-lg font-semibold text-secondary-900 mb-2">{title}</h3>
        <p className="text-secondary-600 mb-4">{message}</p>
        {onRetry && (
          <LoadingButton
            loading={false}
            onClick={onRetry}
            variant="outline"
            className="inline-flex"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </LoadingButton>
        )}
      </div>
    </div>
  )
}

// Empty state component
interface EmptyStateProps {
  title?: string
  message?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
  icon?: 'search' | 'pill' | 'compare'
}

export function EmptyState({ 
  title = 'No data available',
  message = 'There is nothing to display at the moment',
  action,
  className = '',
  icon = 'search'
}: EmptyStateProps) {
  const iconComponents = {
    search: Search,
    pill: Pill,
    compare: () => (
      <svg className="w-12 h-12 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  }
  
  const IconComponent = iconComponents[icon]

  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="max-w-md mx-auto">
        <div className="bg-secondary-100 rounded-full p-6 w-24 h-24 flex items-center justify-center mx-auto mb-4">
          <IconComponent />
        </div>
        <h3 className="text-lg font-semibold text-secondary-900 mb-2">{title}</h3>
        <p className="text-secondary-600 mb-4">{message}</p>
        {action && (
          <LoadingButton
            loading={false}
            onClick={action.onClick}
            variant="primary"
            className="inline-flex"
          >
            {action.label}
          </LoadingButton>
        )}
      </div>
    </div>
  )
}

// Inline loading component for content that's loading within a page
interface InlineLoadingProps {
  text?: string
  className?: string
}

export function InlineLoading({ text = 'Loading...', className = '' }: InlineLoadingProps) {
  return (
    <div className={`flex items-center justify-center py-8 ${className}`}>
      <div className="flex items-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
        <span className="text-secondary-600">{text}</span>
      </div>
    </div>
  )
}

// Progress bar component
interface ProgressBarProps {
  progress: number // 0-100
  text?: string
  className?: string
  showPercentage?: boolean
}

export function ProgressBar({ 
  progress, 
  text, 
  className = '', 
  showPercentage = false 
}: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress))
  
  return (
    <div className={className}>
      {(text || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {text && <span className="text-sm text-secondary-600">{text}</span>}
          {showPercentage && (
            <span className="text-sm font-medium text-secondary-900">
              {Math.round(clampedProgress)}%
            </span>
          )}
        </div>
      )}
      <div className="w-full bg-secondary-200 rounded-full h-2">
        <div 
          className="bg-primary-600 h-2 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  )
}