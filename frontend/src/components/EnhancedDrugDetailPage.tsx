'use client'

import { useState, useEffect } from 'react'
import { Drug } from '@/types/drug'
import { drugAPI } from '@/lib/api'
import DrugDetailPage from './DrugDetailPage'
import { PageLoading, ErrorState } from './LoadingStates'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface EnhancedDrugDetailPageProps {
  slug: string
}

export default function EnhancedDrugDetailPage({ slug }: EnhancedDrugDetailPageProps) {
  const [drug, setDrug] = useState<Drug | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDrug = async () => {
      setLoading(true)
      setError(null)

      try {
        const drugData = await drugAPI.getDrugBySlug(slug)
        setDrug(drugData)
      } catch (err) {
        console.error('Error fetching drug:', err)
        setError('Failed to load drug information')
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchDrug()
    }
  }, [slug])

  const handleRetry = () => {
    setError(null)
    setLoading(true)
    // Trigger refetch
    const fetchDrug = async () => {
      try {
        const drugData = await drugAPI.getDrugBySlug(slug)
        setDrug(drugData)
      } catch (err) {
        console.error('Error fetching drug:', err)
        setError('Failed to load drug information')
      } finally {
        setLoading(false)
      }
    }
    fetchDrug()
  }

  if (loading) {
    return (
      <PageLoading 
        title="Loading drug information..."
        description="Please wait while we fetch the latest data"
      />
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-secondary-50">
        {/* Navigation */}
        <div className="bg-white shadow-sm border-b border-secondary-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link 
              href="/search" 
              className="inline-flex items-center gap-2 text-secondary-600 hover:text-secondary-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Search
            </Link>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ErrorState
            title="Drug Not Found"
            message={error}
            onRetry={handleRetry}
            icon="pill"
          />
        </div>
      </div>
    )
  }

  if (!drug) {
    return (
      <div className="min-h-screen bg-secondary-50">
        {/* Navigation */}
        <div className="bg-white shadow-sm border-b border-secondary-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link 
              href="/search" 
              className="inline-flex items-center gap-2 text-secondary-600 hover:text-secondary-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Search
            </Link>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ErrorState
            title="Drug Not Found"
            message={`The drug "${slug}" was not found in our database.`}
            icon="pill"
            onRetry={handleRetry}
          />
        </div>
      </div>
    )
  }

  return <DrugDetailPage drug={drug} />
}

// Loading skeleton specifically for drug detail page
export function DrugDetailSkeleton() {
  return (
    <article className="min-h-screen bg-secondary-50">
      {/* Header Skeleton */}
      <div className="bg-white shadow-sm border-b border-secondary-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="h-8 bg-secondary-200 rounded w-3/4 mb-4"></div>
              
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-secondary-200 rounded"></div>
                  <div className="h-4 bg-secondary-200 rounded w-20"></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-secondary-200 rounded"></div>
                  <div className="h-4 bg-secondary-200 rounded w-24"></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-secondary-200 rounded"></div>
                  <div className="h-4 bg-secondary-200 rounded w-28"></div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="h-6 bg-secondary-100 rounded px-3 w-16"></div>
                <div className="h-6 bg-secondary-100 rounded px-3 w-20"></div>
                <div className="h-6 bg-secondary-100 rounded px-3 w-18"></div>
              </div>
            </div>

            <div className="text-right">
              <div className="h-4 bg-secondary-200 rounded w-24"></div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Card Skeleton */}
        <div className="card mb-8 animate-pulse">
          <div className="card-header">
            <div className="h-6 bg-secondary-200 rounded w-24"></div>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              <div className="h-4 bg-secondary-100 rounded w-full"></div>
              <div className="h-4 bg-secondary-100 rounded w-5/6"></div>
              <div className="h-4 bg-secondary-100 rounded w-4/6"></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column Skeleton */}
          <div className="lg:col-span-2 space-y-8">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="card animate-pulse">
                <div className="card-header">
                  <div className="h-6 bg-secondary-200 rounded w-48"></div>
                </div>
                <div className="card-body">
                  <div className="space-y-3">
                    <div className="h-4 bg-secondary-100 rounded w-full"></div>
                    <div className="h-4 bg-secondary-100 rounded w-11/12"></div>
                    <div className="h-4 bg-secondary-100 rounded w-5/6"></div>
                    <div className="h-4 bg-secondary-100 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar Skeleton */}
          <aside className="space-y-6">
            {/* FAQs Skeleton */}
            <div className="card animate-pulse">
              <div className="card-header">
                <div className="h-6 bg-secondary-200 rounded w-32"></div>
              </div>
              <div className="card-body space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="space-y-2">
                    <div className="h-4 bg-secondary-100 rounded w-4/5"></div>
                    <div className="space-y-1">
                      <div className="h-3 bg-secondary-50 rounded w-full"></div>
                      <div className="h-3 bg-secondary-50 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Drug Info Skeleton */}
            <div className="card animate-pulse">
              <div className="card-header">
                <div className="h-6 bg-secondary-200 rounded w-40"></div>
              </div>
              <div className="card-body space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index}>
                    <div className="h-3 bg-secondary-100 rounded w-20 mb-1"></div>
                    <div className="h-3 bg-secondary-50 rounded w-32"></div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </article>
  )
}