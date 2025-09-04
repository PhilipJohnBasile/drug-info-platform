'use client'

import { Drug } from '@/types/drug'
import { AlertTriangle, Check, X, Pill, Users, Factory, Route, ChevronDown } from 'lucide-react'
import { useState } from 'react'

interface MobileDrugComparisonProps {
  drugs: Drug[]
  onRemoveDrug?: (drugId: string) => void
}

interface ComparisonField {
  label: string
  key: keyof Drug
  type: 'text' | 'list' | 'warning' | 'boolean'
  icon?: React.ComponentType<{ className?: string }>
  description?: string
}

const COMPARISON_FIELDS: ComparisonField[] = [
  { label: 'Generic Name', key: 'genericName', type: 'text', icon: Pill },
  { label: 'Brand Name', key: 'fdaBrandName', type: 'text', icon: Users },
  { label: 'Manufacturer', key: 'manufacturer', type: 'text', icon: Factory },
  { label: 'Route of Administration', key: 'route', type: 'text', icon: Route },
  { label: 'Indications', key: 'indications', type: 'text', description: 'What is this medication used for?' },
  { label: 'Dosage Information', key: 'dosageInfo', type: 'text', description: 'How should this medication be taken?' },
  { label: 'Contraindications', key: 'contraindications', type: 'text', description: 'When should this medication not be used?' },
  { label: 'Warnings', key: 'warnings', type: 'warning', icon: AlertTriangle, description: 'Important safety information' },
  { label: 'Boxed Warning', key: 'boxedWarning', type: 'warning', icon: AlertTriangle, description: 'FDA\'s strongest warning' },
  { label: 'Adverse Reactions', key: 'adverseReactions', type: 'text', description: 'Common side effects' },
]

export default function MobileDrugComparison({ drugs, onRemoveDrug }: MobileDrugComparisonProps) {
  const [selectedDrug, setSelectedDrug] = useState<string | null>(drugs.length > 0 ? drugs[0].id : null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['genericName', 'fdaBrandName', 'manufacturer']))

  if (drugs.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="max-w-sm mx-auto">
          <div className="bg-secondary-100 rounded-full p-6 w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <Pill className="w-10 h-10 text-secondary-400" />
          </div>
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">No drugs to compare</h3>
          <p className="text-secondary-600 text-sm">Add some drugs to start comparing their information.</p>
        </div>
      </div>
    )
  }

  if (drugs.length === 1) {
    return (
      <div className="text-center py-12 px-4">
        <div className="max-w-sm mx-auto">
          <div className="bg-primary-100 rounded-full p-6 w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <Pill className="w-10 h-10 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">Add another drug</h3>
          <p className="text-secondary-600 text-sm">You need at least two drugs to see a comparison.</p>
          <div className="mt-4 p-3 bg-secondary-50 rounded-lg text-left">
            <p className="font-medium text-secondary-900 text-sm">{drugs[0].aiEnhancedTitle || drugs[0].name}</p>
            <p className="text-xs text-secondary-600 mt-1">Generic: {drugs[0].genericName || 'Not specified'}</p>
          </div>
        </div>
      </div>
    )
  }

  const selectedDrugData = drugs.find(drug => drug.id === selectedDrug) || drugs[0]

  const toggleSection = (fieldKey: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(fieldKey)) {
      newExpanded.delete(fieldKey)
    } else {
      newExpanded.add(fieldKey)
    }
    setExpandedSections(newExpanded)
  }

  const renderFieldValue = (drug: Drug, field: ComparisonField) => {
    const value = drug[field.key]
    
    if (!value) {
      return (
        <div className="flex items-center text-secondary-400 text-sm">
          <X className="w-4 h-4 mr-1 flex-shrink-0" />
          <span>Not specified</span>
        </div>
      )
    }

    switch (field.type) {
      case 'warning':
        return (
          <div className={`p-3 rounded-lg text-sm ${field.key === 'boxedWarning' ? 'bg-danger-50 border border-danger-200 text-danger-800' : 'bg-warning-50 border border-warning-200 text-warning-800'}`}>
            <div className="flex items-start gap-2">
              {field.icon && <field.icon className="w-4 h-4 mt-0.5 flex-shrink-0" />}
              <span>{value as string}</span>
            </div>
          </div>
        )
      
      default:
        return (
          <div className="text-sm text-secondary-700">
            {value as string}
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center px-4">
        <h1 className="text-2xl font-bold text-secondary-900 mb-2">Drug Comparison</h1>
        <p className="text-secondary-600 text-sm">Compare {drugs.length} medications</p>
      </div>

      {/* Drug Selector */}
      <div className="px-4">
        <label className="block text-sm font-medium text-secondary-700 mb-2">
          Select drug to view details:
        </label>
        <div className="relative">
          <select
            value={selectedDrug || ''}
            onChange={(e) => setSelectedDrug(e.target.value)}
            className="w-full bg-white border border-secondary-300 rounded-lg px-3 py-3 pr-10 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {drugs.map((drug) => (
              <option key={drug.id} value={drug.id}>
                {drug.aiEnhancedTitle || drug.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400 pointer-events-none" />
        </div>
      </div>

      {/* Drug Cards - Horizontal scroll for multiple drugs */}
      <div className="px-4">
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4">
          {drugs.map((drug, index) => (
            <div 
              key={drug.id} 
              className={`flex-shrink-0 w-64 p-4 rounded-lg border-2 transition-colors ${
                drug.id === selectedDrug 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-secondary-200 bg-white'
              }`}
              onClick={() => setSelectedDrug(drug.id)}
            >
              {onRemoveDrug && (
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-medium text-secondary-500">Drug {index + 1}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemoveDrug(drug.id)
                    }}
                    className="p-1 rounded-full hover:bg-secondary-100 text-secondary-400 hover:text-secondary-600"
                    aria-label={`Remove ${drug.name} from comparison`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <h3 className="font-semibold text-secondary-900 text-sm mb-2 line-clamp-2">
                {drug.aiEnhancedTitle || drug.name}
              </h3>
              <p className="text-xs text-secondary-600 mb-1">
                Generic: {drug.genericName || drug.fdaGenericName || 'Not specified'}
              </p>
              {drug.fdaBrandName && (
                <p className="text-xs text-secondary-600">
                  Brand: {drug.fdaBrandName}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Information */}
      <div className="px-4">
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-4 border-b border-secondary-200">
            <h2 className="text-lg font-semibold text-secondary-900">
              {selectedDrugData.aiEnhancedTitle || selectedDrugData.name}
            </h2>
            <p className="text-sm text-secondary-600 mt-1">
              Detailed information and warnings
            </p>
          </div>

          <div className="divide-y divide-secondary-200">
            {COMPARISON_FIELDS.map((field) => {
              const isExpanded = expandedSections.has(field.key)
              const value = selectedDrugData[field.key]
              const hasValue = !!value

              return (
                <div key={field.key} className="p-4">
                  <button
                    onClick={() => toggleSection(field.key)}
                    className="w-full flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset rounded"
                  >
                    <div className="flex items-center gap-3">
                      {field.icon && <field.icon className="w-5 h-5 text-secondary-600 flex-shrink-0" />}
                      <div>
                        <h3 className="font-medium text-secondary-900 text-sm">{field.label}</h3>
                        {field.description && (
                          <p className="text-xs text-secondary-500 mt-0.5">{field.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasValue ? (
                        <Check className="w-4 h-4 text-success-600" />
                      ) : (
                        <X className="w-4 h-4 text-secondary-400" />
                      )}
                      <ChevronDown 
                        className={`w-4 h-4 text-secondary-400 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`} 
                      />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-secondary-100">
                      {hasValue ? (
                        renderFieldValue(selectedDrugData, field)
                      ) : (
                        <p className="text-sm text-secondary-500 italic">
                          No information available for this field.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Compare All Button */}
      <div className="px-4">
        <button
          onClick={() => {
            // Expand all sections to show full comparison
            setExpandedSections(new Set(COMPARISON_FIELDS.map(field => field.key)))
          }}
          className="w-full btn-outline py-3"
        >
          Show All Information
        </button>
      </div>

      {/* Disclaimer */}
      <div className="px-4">
        <div className="alert-warning text-xs">
          <p className="font-medium mb-1">Important Medical Disclaimer</p>
          <p>
            This comparison is for informational purposes only. Always consult with your healthcare provider 
            before making medication decisions.
          </p>
        </div>
      </div>
    </div>
  )
}