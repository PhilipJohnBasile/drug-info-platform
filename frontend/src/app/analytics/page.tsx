import { Metadata } from 'next'
import AnalyticsDashboard from '@/components/AnalyticsDashboard'

export const metadata: Metadata = {
  title: 'Analytics Dashboard | Drug Information Platform',
  description: 'View platform analytics, popular drugs, usage statistics, and user engagement metrics.',
  keywords: 'analytics, drug platform statistics, popular medications, usage metrics, dashboard',
  robots: 'noindex, nofollow', // Analytics should typically not be indexed
}

export default function AnalyticsPage() {
  return <AnalyticsDashboard />
}