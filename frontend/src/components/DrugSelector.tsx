'use client'

import { useState, useEffect, useCallback } from 'react'
import { Drug } from '@/types/drug'
import { drugAPI } from '@/lib/api'
import { Search, Check, Plus, Loader2, AlertCircle } from 'lucide-react'
// Custom debounce utility
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T & { cancel(): void } {
  let timeout: NodeJS.Timeout | null = null
  
  const debounced = ((...args: Parameters<T>) => {
    const later = () => {
      timeout = null
      func(...args)
    }
    
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }) as T & { cancel(): void }
  
  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout)
      timeout = null
    }
  }
  
  return debounced
}

interface DrugSelectorProps {
  onSelectDrug: (drug: Drug) => void
  selectedDrugIds: string[]
  maxSelections: number
}


export default function DrugSelector({ onSelectDrug, selectedDrugIds, maxSelections }: DrugSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredDrugs, setFilteredDrugs] = useState<Drug[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  // Load all drugs on mount
  useEffect(() => {
    const loadAllDrugs = async () => {
      setIsSearching(true)
      try {
        const allDrugs = await drugAPI.getDrugs({ published: true, limit: 50 })
        setFilteredDrugs(allDrugs)
        setSearchError(null)
      } catch (error) {
        console.error('Error loading drugs:', error)
        setSearchError('Failed to load drugs')
        setFilteredDrugs([])
      } finally {
        setIsSearching(false)
      }
    }
    loadAllDrugs()
  }, [])

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      setIsSearching(true)
      setHasSearched(true)
      setSearchError(null)
      
      try {
        if (!query.trim()) {
          // Load all drugs when query is empty
          const allDrugs = await drugAPI.getDrugs({ published: true, limit: 50 })
          setFilteredDrugs(allDrugs)
        } else {
          // Search for drugs
          const searchResults = await drugAPI.searchDrugs(query, {}, 50)
          setFilteredDrugs(searchResults)
        }
      } catch (error) {
        console.error('Search error:', error)
        setSearchError('Search failed. Please try again.')
        setFilteredDrugs([])
      } finally {
        setIsSearching(false)
      }
    }, 300),
    []
  )

  useEffect(() => {
    debouncedSearch(searchQuery)
    return () => {
      debouncedSearch.cancel()
    }
  }, [searchQuery, debouncedSearch])

  const isSelected = (drugId: string) => selectedDrugIds.includes(drugId)
  const canSelect = selectedDrugIds.length < maxSelections

  const handleDrugSelect = (drug: Drug) => {
    if (!isSelected(drug.id) && canSelect) {
      onSelectDrug(drug)
    }
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="p-4 border-b border-secondary-200">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {isSearching ? (
              <Loader2 className="w-5 h-5 text-secondary-400 animate-spin" />
            ) : (
              <Search className="w-5 h-5 text-secondary-400" />
            )}
          </div>
          <input
            type="text"
            placeholder="Search drugs by name, generic name, or manufacturer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-secondary-300 rounded-md leading-5 bg-white placeholder-secondary-500 focus:outline-none focus:placeholder-secondary-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            autoFocus
          />
        </div>
      </div>

      {/* Selection Status */}
      {selectedDrugIds.length > 0 && (
        <div className="px-4">
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
            <p className="text-sm text-primary-800">
              {selectedDrugIds.length} of {maxSelections} drugs selected for comparison
            </p>
          </div>
        </div>
      )}

      {/* Drug List */}
      <div className="max-h-96 overflow-y-auto">
        {searchError ? (
          <div className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-danger-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-danger-900 mb-2">Error Loading Drugs</h3>
            <p className="text-danger-600 mb-4">{searchError}</p>
            <button
              onClick={() => {
                setSearchError(null)
                debouncedSearch(searchQuery)
              }}
              className="btn-secondary text-sm"
            >
              Try Again
            </button>
          </div>
        ) : filteredDrugs.length === 0 ? (
          <div className="p-8 text-center">
            {hasSearched ? (
              <div>
                <AlertCircle className="w-12 h-12 text-secondary-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-secondary-900 mb-2">No drugs found</h3>
                <p className="text-secondary-600">
                  Try searching with different keywords or check the spelling.
                </p>
              </div>
            ) : (
              <div>
                <Search className="w-12 h-12 text-secondary-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-secondary-900 mb-2">Search for drugs</h3>
                <p className="text-secondary-600">
                  Enter a drug name, generic name, or manufacturer to find medications to compare.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredDrugs.map((drug) => {
              const selected = isSelected(drug.id)
              const disabled = !canSelect && !selected

              return (
                <button
                  key={drug.id}
                  onClick={() => handleDrugSelect(drug)}
                  disabled={disabled}
                  className={`w-full p-4 text-left hover:bg-secondary-50 transition-colors border-b border-secondary-100 last:border-b-0 disabled:opacity-50 disabled:cursor-not-allowed ${
                    selected ? 'bg-primary-50 border-primary-200' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selected 
                            ? 'bg-primary-600 border-primary-600 text-white' 
                            : 'border-secondary-300'
                        }`}>
                          {selected ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            !disabled && <Plus className="w-4 h-4 text-secondary-400" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-semibold text-secondary-900 truncate">
                            {drug.aiEnhancedTitle || drug.name}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-secondary-600 mt-1">
                            <span>Generic: {drug.genericName || 'Not specified'}</span>
                            {drug.fdaBrandName && (
                              <span>Brand: {drug.fdaBrandName}</span>
                            )}
                            {drug.manufacturer && (
                              <span>Mfg: {drug.manufacturer}</span>
                            )}
                          </div>
                          {drug.aiEnhancedDescription && (
                            <p className="text-sm text-secondary-600 mt-1 line-clamp-2">
                              {drug.aiEnhancedDescription}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}