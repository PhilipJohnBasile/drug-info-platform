'use client'

import { useState, useCallback, useEffect } from 'react'
import { Drug } from '@/types/drug'
import DrugComparison from './DrugComparison'
import DrugSelector from './DrugSelector'
import { Search, Plus } from 'lucide-react'
import Link from 'next/link'

const MAX_COMPARISON_DRUGS = 4

export default function DrugComparisonPage() {
  const [selectedDrugs, setSelectedDrugs] = useState<Drug[]>([])
  const [showSelector, setShowSelector] = useState(false)

  // Load selected drugs from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('drug-comparison')
    if (saved) {
      try {
        const drugs = JSON.parse(saved)
        setSelectedDrugs(drugs)
      } catch (error) {
        console.error('Failed to load saved comparison drugs:', error)
      }
    }
  }, [])

  // Save selected drugs to localStorage whenever they change
  useEffect(() => {
    if (selectedDrugs.length > 0) {
      localStorage.setItem('drug-comparison', JSON.stringify(selectedDrugs))
    } else {
      localStorage.removeItem('drug-comparison')
    }
  }, [selectedDrugs])

  const handleAddDrug = useCallback((drug: Drug) => {
    setSelectedDrugs(prev => {
      // Check if drug is already selected
      if (prev.some(d => d.id === drug.id)) {
        return prev
      }
      
      // Add drug if we haven't reached the limit
      if (prev.length < MAX_COMPARISON_DRUGS) {
        return [...prev, drug]
      }
      
      return prev
    })
    setShowSelector(false)
  }, [])

  const handleRemoveDrug = useCallback((drugId: string) => {
    setSelectedDrugs(prev => prev.filter(d => d.id !== drugId))
  }, [])

  const handleClearAll = useCallback(() => {
    setSelectedDrugs([])
    localStorage.removeItem('drug-comparison')
  }, [])

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-secondary-900">Drug Comparison</h1>
              <p className="text-secondary-600 mt-2">
                Compare up to {MAX_COMPARISON_DRUGS} medications side by side to understand their differences
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {selectedDrugs.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="btn-secondary text-sm"
                >
                  Clear All
                </button>
              )}
              
              {selectedDrugs.length < MAX_COMPARISON_DRUGS && (
                <button
                  onClick={() => setShowSelector(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Drug
                </button>
              )}
              
              <Link
                href="/search"
                className="btn-outline flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Search Drugs
              </Link>
            </div>
          </div>

          {/* Progress indicator */}
          {selectedDrugs.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-2 text-sm text-secondary-600">
                <span>{selectedDrugs.length} of {MAX_COMPARISON_DRUGS} drugs selected</span>
                <div className="flex-1 bg-secondary-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(selectedDrugs.length / MAX_COMPARISON_DRUGS) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Drug Selector Modal */}
        {showSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b border-secondary-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-secondary-900">Select Drug to Compare</h2>
                  <button
                    onClick={() => setShowSelector(false)}
                    className="p-2 hover:bg-secondary-100 rounded-full"
                  >
                    <Plus className="w-5 h-5 rotate-45 text-secondary-600" />
                  </button>
                </div>
              </div>
              <div className="overflow-y-auto max-h-[60vh]">
                <DrugSelector
                  onSelectDrug={handleAddDrug}
                  selectedDrugIds={selectedDrugs.map(d => d.id)}
                  maxSelections={MAX_COMPARISON_DRUGS}
                />
              </div>
            </div>
          </div>
        )}

        {/* Comparison Content */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <DrugComparison 
              drugs={selectedDrugs} 
              onRemoveDrug={handleRemoveDrug}
            />
          </div>
        </div>

        {/* Help Text */}
        {selectedDrugs.length === 0 && (
          <div className="mt-8 text-center">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">How to use Drug Comparison</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                <div className="p-4 bg-white rounded-lg shadow-sm">
                  <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-semibold mb-2">
                    1
                  </div>
                  <h4 className="font-medium text-secondary-900 mb-1">Search & Select</h4>
                  <p className="text-sm text-secondary-600">Use the search feature or browse to find drugs you want to compare</p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow-sm">
                  <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-semibold mb-2">
                    2
                  </div>
                  <h4 className="font-medium text-secondary-900 mb-1">Add to Compare</h4>
                  <p className="text-sm text-secondary-600">Add up to {MAX_COMPARISON_DRUGS} drugs to compare their information side by side</p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow-sm">
                  <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-semibold mb-2">
                    3
                  </div>
                  <h4 className="font-medium text-secondary-900 mb-1">Compare & Review</h4>
                  <p className="text-sm text-secondary-600">Review differences in indications, dosage, warnings, and side effects</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}