'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Search, 
  Eye, 
  Pill, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Calendar,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { useResponsiveClasses } from '@/hooks/useResponsive'

interface AnalyticsData {
  overview: {
    totalDrugs: number
    totalViews: number
    totalSearches: number
    avgSessionDuration: string
  }
  popularDrugs: Array<{
    id: string
    name: string
    views: number
    searches: number
    trend: 'up' | 'down' | 'stable'
    trendPercentage: number
  }>
  searchTerms: Array<{
    term: string
    count: number
    resultCount: number
  }>
  timeSeriesData: Array<{
    date: string
    views: number
    searches: number
  }>
  drugCategories: Array<{
    category: string
    count: number
    percentage: number
  }>
  userEngagement: {
    bounceRate: number
    avgPagesPerSession: number
    newUsers: number
    returningUsers: number
  }
}

// Mock analytics data - in a real app this would come from an API
const MOCK_ANALYTICS: AnalyticsData = {
  overview: {
    totalDrugs: 247,
    totalViews: 15429,
    totalSearches: 8932,
    avgSessionDuration: '3m 45s'
  },
  popularDrugs: [
    {
      id: '1',
      name: 'Lisinopril',
      views: 1205,
      searches: 342,
      trend: 'up',
      trendPercentage: 12.5
    },
    {
      id: '2', 
      name: 'Metformin',
      views: 987,
      searches: 289,
      trend: 'up',
      trendPercentage: 8.3
    },
    {
      id: '3',
      name: 'Atorvastatin',
      views: 876,
      searches: 245,
      trend: 'down',
      trendPercentage: -5.2
    },
    {
      id: '4',
      name: 'Sertraline',
      views: 743,
      searches: 198,
      trend: 'up',
      trendPercentage: 15.7
    },
    {
      id: '5',
      name: 'Omeprazole',
      views: 654,
      searches: 167,
      trend: 'stable',
      trendPercentage: 0.8
    }
  ],
  searchTerms: [
    { term: 'blood pressure medication', count: 432, resultCount: 28 },
    { term: 'diabetes drugs', count: 387, resultCount: 19 },
    { term: 'cholesterol medicine', count: 298, resultCount: 15 },
    { term: 'antidepressants', count: 267, resultCount: 23 },
    { term: 'acid reflux treatment', count: 189, resultCount: 12 }
  ],
  timeSeriesData: [
    { date: '2024-01-01', views: 1200, searches: 680 },
    { date: '2024-01-02', views: 1350, searches: 720 },
    { date: '2024-01-03', views: 1180, searches: 650 },
    { date: '2024-01-04', views: 1420, searches: 780 },
    { date: '2024-01-05', views: 1380, searches: 810 },
    { date: '2024-01-06', views: 1250, searches: 690 },
    { date: '2024-01-07', views: 1490, searches: 820 }
  ],
  drugCategories: [
    { category: 'Cardiovascular', count: 67, percentage: 27.1 },
    { category: 'Endocrine', count: 43, percentage: 17.4 },
    { category: 'Gastrointestinal', count: 39, percentage: 15.8 },
    { category: 'Psychiatric', count: 35, percentage: 14.2 },
    { category: 'Other', count: 63, percentage: 25.5 }
  ],
  userEngagement: {
    bounceRate: 34.2,
    avgPagesPerSession: 2.8,
    newUsers: 1247,
    returningUsers: 892
  }
}

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d'>('7d')
  const { container, heading, cardPadding, gap } = useResponsiveClasses()

  useEffect(() => {
    // Simulate API call
    const loadAnalytics = async () => {
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 800)) // Simulate delay
      setAnalytics(MOCK_ANALYTICS)
      setLoading(false)
    }

    loadAnalytics()
  }, [selectedTimeframe])

  if (loading) {
    return <AnalyticsDashboardSkeleton />
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-danger-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-secondary-900 mb-2">Failed to Load Analytics</h2>
          <p className="text-secondary-600">Please try again later.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className={`max-w-7xl mx-auto ${container} py-8`}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className={`${heading} font-bold text-secondary-900`}>Analytics Dashboard</h1>
              <p className="text-secondary-600 mt-1">Platform usage and performance metrics</p>
            </div>
            
            {/* Time Range Selector */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-secondary-500" />
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value as '7d' | '30d' | '90d')}
                className="input text-sm py-2"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 ${gap} mb-8`}>
          <MetricCard
            title="Total Drugs"
            value={analytics.overview.totalDrugs.toLocaleString()}
            icon={Pill}
            color="primary"
          />
          <MetricCard
            title="Total Views"
            value={analytics.overview.totalViews.toLocaleString()}
            icon={Eye}
            color="success"
          />
          <MetricCard
            title="Total Searches"
            value={analytics.overview.totalSearches.toLocaleString()}
            icon={Search}
            color="warning"
          />
          <MetricCard
            title="Avg Session"
            value={analytics.overview.avgSessionDuration}
            icon={Clock}
            color="info"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Popular Drugs */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-secondary-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Popular Drugs
              </h2>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {analytics.popularDrugs.map((drug, index) => (
                  <div key={drug.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-secondary-100 rounded-full flex items-center justify-center text-sm font-medium text-secondary-700">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-secondary-900">{drug.name}</p>
                        <p className="text-sm text-secondary-600">{drug.views} views • {drug.searches} searches</p>
                      </div>
                    </div>
                    <TrendIndicator trend={drug.trend} percentage={drug.trendPercentage} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Search Terms */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-secondary-900 flex items-center gap-2">
                <Search className="w-5 h-5" />
                Top Search Terms
              </h2>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {analytics.searchTerms.map((term, index) => (
                  <div key={term.term} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-secondary-900">{term.term}</p>
                      <p className="text-sm text-secondary-600">{term.resultCount} results found</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-secondary-900">{term.count}</p>
                      <p className="text-xs text-secondary-600">searches</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Drug Categories */}
          <div className="card lg:col-span-2">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-secondary-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Drug Categories
              </h2>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {analytics.drugCategories.map((category) => (
                  <div key={category.category}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-secondary-900">{category.category}</span>
                      <span className="text-sm text-secondary-600">{category.count} drugs ({category.percentage}%)</span>
                    </div>
                    <div className="w-full bg-secondary-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${category.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* User Engagement */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-secondary-900 flex items-center gap-2">
                <Users className="w-5 h-5" />
                User Engagement
              </h2>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <div className="text-center p-4 bg-secondary-50 rounded-lg">
                  <div className="text-2xl font-bold text-secondary-900">{analytics.userEngagement.bounceRate}%</div>
                  <div className="text-sm text-secondary-600">Bounce Rate</div>
                </div>
                
                <div className="text-center p-4 bg-secondary-50 rounded-lg">
                  <div className="text-2xl font-bold text-secondary-900">{analytics.userEngagement.avgPagesPerSession}</div>
                  <div className="text-sm text-secondary-600">Pages per Session</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-3 bg-success-50 rounded-lg">
                    <div className="text-lg font-bold text-success-900">{analytics.userEngagement.newUsers.toLocaleString()}</div>
                    <div className="text-xs text-success-600">New Users</div>
                  </div>
                  <div className="text-center p-3 bg-primary-50 rounded-lg">
                    <div className="text-lg font-bold text-primary-900">{analytics.userEngagement.returningUsers.toLocaleString()}</div>
                    <div className="text-xs text-primary-600">Returning</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Metric Card Component
interface MetricCardProps {
  title: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  color: 'primary' | 'success' | 'warning' | 'info'
}

function MetricCard({ title, value, icon: Icon, color }: MetricCardProps) {
  const colorClasses = {
    primary: 'bg-primary-100 text-primary-600',
    success: 'bg-success-100 text-success-600', 
    warning: 'bg-warning-100 text-warning-600',
    info: 'bg-secondary-100 text-secondary-600'
  }

  return (
    <div className="card">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-secondary-600">{title}</p>
            <p className="text-2xl font-bold text-secondary-900">{value}</p>
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Trend Indicator Component
interface TrendIndicatorProps {
  trend: 'up' | 'down' | 'stable'
  percentage: number
}

function TrendIndicator({ trend, percentage }: TrendIndicatorProps) {
  const getIcon = () => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="w-4 h-4" />
      case 'down':
        return <ArrowDown className="w-4 h-4" />
      default:
        return null
    }
  }

  const getColor = () => {
    switch (trend) {
      case 'up':
        return 'text-success-600'
      case 'down':
        return 'text-danger-600'
      default:
        return 'text-secondary-500'
    }
  }

  return (
    <div className={`flex items-center gap-1 ${getColor()}`}>
      {getIcon()}
      <span className="text-sm font-medium">
        {Math.abs(percentage).toFixed(1)}%
      </span>
    </div>
  )
}

// Loading Skeleton
function AnalyticsDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="h-8 bg-secondary-200 rounded w-64 mb-2 animate-pulse" />
          <div className="h-4 bg-secondary-100 rounded w-48 animate-pulse" />
        </div>

        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="card-body">
                <div className="h-4 bg-secondary-200 rounded w-20 mb-2" />
                <div className="h-8 bg-secondary-100 rounded w-16" />
              </div>
            </div>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="card animate-pulse">
            <div className="card-body">
              <div className="h-6 bg-secondary-200 rounded w-32 mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-4 bg-secondary-100 rounded" />
                ))}
              </div>
            </div>
          </div>
          <div className="card animate-pulse">
            <div className="card-body">
              <div className="h-6 bg-secondary-200 rounded w-40 mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-4 bg-secondary-100 rounded" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}