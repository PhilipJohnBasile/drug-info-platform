'use client'

import { useState, useEffect } from 'react'
import { Drug } from '@/types/drug'
import { Network, Pill, Stethoscope, Brain, BookOpen, Loader2, AlertCircle } from 'lucide-react'

interface RelatedContentSuggestionsData {
  relatedDrugs: Array<{ name: string; reason: string; category: string }>
  relatedConditions: Array<{ condition: string; relationship: string; severity: string }>
  drugInteractions: Array<{ drug: string; type: 'major' | 'moderate' | 'minor'; description: string }>
  relatedTopics: Array<{ topic: string; relevance: string; category: string }>
}

interface RelatedContentSuggestionsProps {
  drug: Drug
}

// In-memory cache for related content (persists during session)
const relatedContentCache = new Map<string, RelatedContentSuggestionsData>()

export default function RelatedContentSuggestions({ drug }: RelatedContentSuggestionsProps) {
  const [relatedContent, setRelatedContent] = useState<RelatedContentSuggestionsData | null>(null)
  const [loading, setLoading] = useState(false) // Start as false - load on demand
  const [error, setError] = useState('')
  const [hasTriedToLoad, setHasTriedToLoad] = useState(false)

  const loadRelatedContent = async () => {
    // Create cache key based on drug details (v3 for performance optimization)
    const cacheKey = `v3-${drug.id}-${drug.name}-${drug.genericName || ''}`
    
    // Check cache first
    const cachedData = relatedContentCache.get(cacheKey)
    if (cachedData) {
      console.log('Using cached related content for', drug.name)
      setRelatedContent(cachedData)
      setLoading(false)
      setHasTriedToLoad(true)
      return
    }

    setLoading(true)
    setError('')
    setRelatedContent(null)
    setHasTriedToLoad(true)

    try {
      // Reduced timeout for better user experience - HuggingFace can be slow
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      const response = await fetch('http://localhost:4000/ai-service/generate-related-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          drugName: drug.name,
          genericName: drug.genericName || undefined,
          indications: drug.indications || undefined,
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setRelatedContent(data)
      // Cache the API data
      relatedContentCache.set(cacheKey, data)
    } catch (err: any) {
      console.error('Error loading related content:', err)
      
      // Provide fallback content instead of just showing error
      const fallbackContent: RelatedContentSuggestionsData = {
        relatedDrugs: [
          {
            name: drug.genericName ? `Other ${drug.genericName} brands` : 'Similar medications',
            reason: 'Same active ingredient or similar mechanism of action',
            category: 'Alternative Options'
          },
          {
            name: 'Generic equivalents',
            reason: 'Lower-cost alternatives with same therapeutic effect',
            category: 'Cost-Effective Options'
          }
        ],
        relatedConditions: [
          {
            condition: 'Primary indication',
            relationship: `Commonly prescribed for conditions treated by ${drug.name}`,
            severity: 'moderate'
          }
        ],
        drugInteractions: [
          {
            drug: 'Consult healthcare provider',
            type: 'moderate' as const,
            description: 'Always check for potential drug interactions with your healthcare team'
          }
        ],
        relatedTopics: [
          {
            topic: 'Medication Safety',
            relevance: 'Important safety considerations when taking any prescription medication',
            category: 'Patient Safety'
          },
          {
            topic: 'Drug Administration',
            relevance: 'Proper usage guidelines and administration instructions',
            category: 'Usage Guidelines'
          }
        ]
      }
      
      setRelatedContent(fallbackContent)
      
      if (err.name === 'AbortError') {
        setError('AI service timed out. Showing basic related content. Try refreshing for AI-generated suggestions.')
      } else if (err.message?.includes('Failed to fetch')) {
        setError('AI service unavailable. Showing basic related content.')
      } else {
        setError('AI service temporarily unavailable. Showing basic related content.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Auto-load related content on component mount
  useEffect(() => {
    const cacheKey = `v3-${drug.id}-${drug.name}-${drug.genericName || ''}`
    const cachedData = relatedContentCache.get(cacheKey)
    if (cachedData) {
      setRelatedContent(cachedData)
      setHasTriedToLoad(true)
    } else {
      // Auto-load content if not cached
      loadRelatedContent()
    }
  }, [drug.id, drug.name])


  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5 text-orange-600" />
          <h2 className="text-xl font-semibold text-secondary-900">
            Related Content Suggestions
          </h2>
          {loading && <Loader2 className="w-4 h-4 animate-spin text-orange-500 ml-2" />}
        </div>
      </div>

      <div className="card-body">
        {!hasTriedToLoad && !loading && (
          <div className="text-center py-8">
            <div className="mb-4">
              <Network className="w-12 h-12 text-orange-400 mx-auto mb-2" />
              <p className="text-gray-600 mb-2">AI-powered related content suggestions</p>
              <p className="text-sm text-gray-500">Get related drugs, conditions, interactions, and topics</p>
            </div>
            <button
              onClick={loadRelatedContent}
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2 mx-auto"
            >
              <Brain className="w-4 h-4" />
              Load Related Content
            </button>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading related content suggestions...</p>
            <p className="text-sm text-gray-500 mt-2">🤖 Powered by AI • This may take up to 30 seconds</p>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-medium">Failed to load related content</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
              <button
                onClick={loadRelatedContent}
                disabled={loading}
                className="mt-3 text-sm bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded transition-colors disabled:opacity-50"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {relatedContent && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Related Drugs */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <Pill className="w-5 h-5" />
                  Related Drugs
                </h3>
                <div className="space-y-3">
                  {relatedContent.relatedDrugs.map((drug, index) => (
                    <div key={index} className="bg-white p-3 rounded-md shadow-sm">
                      <h4 className="font-medium text-gray-900">{drug.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{drug.reason}</p>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded mt-2 inline-block">
                        {drug.category}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Related Conditions */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5" />
                  Related Conditions
                </h3>
                <div className="space-y-3">
                  {relatedContent.relatedConditions.map((condition, index) => (
                    <div key={index} className="bg-white p-3 rounded-md shadow-sm">
                      <h4 className="font-medium text-gray-900">{condition.condition}</h4>
                      <p className="text-sm text-gray-600 mt-1">{condition.relationship}</p>
                      <span className={`text-xs px-2 py-1 rounded mt-2 inline-block ${
                        condition.severity === 'major' ? 'bg-red-100 text-red-700' :
                        condition.severity === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {condition.severity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Drug Interactions */}
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-red-800 mb-3 flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Drug Interactions
                </h3>
                <div className="space-y-3">
                  {relatedContent.drugInteractions.map((interaction, index) => (
                    <div key={index} className="bg-white p-3 rounded-md shadow-sm">
                      <h4 className="font-medium text-gray-900">{interaction.drug}</h4>
                      <p className="text-sm text-gray-600 mt-1">{interaction.description}</p>
                      <span className={`text-xs px-2 py-1 rounded mt-2 inline-block ${
                        interaction.type === 'major' ? 'bg-red-100 text-red-700' :
                        interaction.type === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {interaction.type} interaction
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Related Topics */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-purple-800 mb-3 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Related Topics
                </h3>
                <div className="space-y-3">
                  {relatedContent.relatedTopics.map((topic, index) => (
                    <div key={index} className="bg-white p-3 rounded-md shadow-sm">
                      <h4 className="font-medium text-gray-900">{topic.topic}</h4>
                      <p className="text-sm text-gray-600 mt-1">{topic.relevance}</p>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded mt-2 inline-block">
                        {topic.category}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Badge */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500 text-center">
                🤖 Generated using HuggingFace AI • Related content suggestions for clinical reference
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}