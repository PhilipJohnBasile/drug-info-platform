'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { Search, Filter, Loader2 } from 'lucide-react'
import { Drug } from '@/types/drug'
import { drugAPI } from '@/lib/api'
import Link from 'next/link'
import { APIErrorBoundary, SearchErrorBoundary } from './ErrorBoundary'

const SearchResultsSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="card animate-pulse">
        <div className="card-body">
          <div className="h-6 bg-secondary-200 rounded mb-2"></div>
          <div className="h-4 bg-secondary-100 rounded mb-1"></div>
          <div className="h-4 bg-secondary-100 rounded w-3/4"></div>
        </div>
      </div>
    ))}
  </div>
)

const SearchResults = ({ results, loading, query }: { results: Drug[], loading: boolean, query: string }) => {
  if (loading) return <SearchResultsSkeleton />
  
  if (!query) {
    return (
      <div className="text-center py-12">
        <Search className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-secondary-700 mb-2">Search for drug information</h2>
        <p className="text-secondary-500">Enter a drug name, generic name, or condition to find detailed information</p>
      </div>
    )
  }
  
  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-xl font-semibold text-secondary-700 mb-2">No results found</h2>
        <p className="text-secondary-500">
          Try searching with different terms or check your spelling
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-secondary-600 mb-6">
        Found {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
      </p>
      {results.map((drug) => (
        <article key={drug.id} className="card hover:shadow-md transition-shadow">
          <div className="card-body">
            <div className="flex gap-4">
              {/* Drug Thumbnail */}
              <div className="hidden sm:block flex-shrink-0">
                <img
                  src={`https://picsum.photos/seed/${encodeURIComponent(drug.name)}/120/80`}
                  alt={`${drug.name} thumbnail`}
                  className="w-20 h-12 object-cover rounded border"
                />
              </div>
              
              {/* Drug Information */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                  <Link 
                    href={`/drugs/${drug.slug}`}
                    className="hover:text-primary-600 transition-colors"
                  >
                    {drug.aiEnhancedTitle || drug.name}
                  </Link>
                </h3>
            
            {drug.genericName && (
              <p className="text-sm text-secondary-600 mb-2">
                Generic: {drug.genericName}
              </p>
            )}
            
            {drug.aiEnhancedDescription && (
              <p className="text-secondary-700 mb-3 line-clamp-2">
                {drug.aiEnhancedDescription}
              </p>
            )}
            
                <div className="flex flex-wrap gap-2">
                  {drug.brandNames?.map((brand) => (
                    <span key={brand} className="badge-secondary text-xs">
                      {brand}
                    </span>
                  ))}
                  {drug.manufacturer && (
                    <span className="badge-primary text-xs">
                      {drug.manufacturer}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Drug[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    manufacturer: '',
    route: '',
    hasWarning: false
  })

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        performSearch(query.trim())
      } else {
        setResults([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, filters])

  const performSearch = async (searchQuery: string) => {
    setLoading(true)
    try {
      const searchResults = await drugAPI.searchDrugs(searchQuery, filters)
      setResults(searchResults)
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (filterKey: string, value: string | boolean) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }))
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="bg-white shadow-sm border-b border-secondary-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h1 className="text-3xl font-bold text-secondary-900">Search Drug Information</h1>
            <Link
              href="/compare"
              className="btn-outline flex items-center gap-2 self-start"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Compare Drugs
            </Link>
          </div>
          
          {/* Search Input */}
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-secondary-400" />
            </div>
            <input
              type="search"
              className="block w-full pl-10 pr-3 py-3 border border-secondary-300 rounded-lg 
                       leading-5 bg-white placeholder-secondary-500 
                       focus:outline-none focus:placeholder-secondary-400 
                       focus:ring-2 focus:ring-primary-500 focus:border-primary-500 
                       text-secondary-900 text-lg"
              placeholder="Search by drug name, generic name, condition, or manufacturer..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
              aria-label="Search drugs"
            />
            {loading && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <Loader2 className="h-5 w-5 text-primary-500 animate-spin" />
              </div>
            )}
          </div>

          {/* Filters */}
          <details className="mb-6">
            <summary className="flex items-center gap-2 cursor-pointer text-secondary-700 hover:text-secondary-900">
              <Filter className="w-4 h-4" />
              <span className="font-medium">Advanced Filters</span>
            </summary>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-secondary-50 rounded-lg">
              <div>
                <label htmlFor="manufacturer" className="block text-sm font-medium text-secondary-700 mb-1">
                  Manufacturer
                </label>
                <input
                  id="manufacturer"
                  type="text"
                  className="block w-full border border-secondary-300 rounded-md px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., Pfizer"
                  value={filters.manufacturer}
                  onChange={(e) => handleFilterChange('manufacturer', e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="route" className="block text-sm font-medium text-secondary-700 mb-1">
                  Administration Route
                </label>
                <select
                  id="route"
                  className="block w-full border border-secondary-300 rounded-md px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={filters.route}
                  onChange={(e) => handleFilterChange('route', e.target.value)}
                >
                  <option value="">All routes</option>
                  <option value="oral">Oral</option>
                  <option value="injection">Injection</option>
                  <option value="topical">Topical</option>
                  <option value="inhalation">Inhalation</option>
                </select>
              </div>
              <div className="flex items-center mt-6">
                <input
                  id="hasWarning"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                  checked={filters.hasWarning}
                  onChange={(e) => handleFilterChange('hasWarning', e.target.checked)}
                />
                <label htmlFor="hasWarning" className="ml-2 block text-sm text-secondary-700">
                  Has boxed warning
                </label>
              </div>
            </div>
          </details>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SearchErrorBoundary>
          <Suspense fallback={<SearchResultsSkeleton />}>
            <APIErrorBoundary>
              <SearchResults results={results} loading={loading} query={query} />
            </APIErrorBoundary>
          </Suspense>
        </SearchErrorBoundary>
      </div>
    </div>
  )
}