'use client'

import { Drug } from '@/types/drug'
import { AlertTriangle, Check, X, Pill, Users, Factory, Route } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useState, useEffect } from 'react'
import MobileDrugComparison from './MobileDrugComparison'

interface DrugComparisonProps {
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

export default function DrugComparison({ drugs, onRemoveDrug }: DrugComparisonProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024) // lg breakpoint
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Use mobile version on smaller screens
  if (isMobile) {
    return <MobileDrugComparison drugs={drugs} onRemoveDrug={onRemoveDrug} />
  }
  if (drugs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="bg-secondary-100 rounded-full p-6 w-24 h-24 flex items-center justify-center mx-auto mb-4">
            <Pill className="w-12 h-12 text-secondary-400" />
          </div>
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">No drugs to compare</h3>
          <p className="text-secondary-600">Add some drugs to start comparing their information side by side.</p>
        </div>
      </div>
    )
  }

  if (drugs.length === 1) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="bg-primary-100 rounded-full p-6 w-24 h-24 flex items-center justify-center mx-auto mb-4">
            <Pill className="w-12 h-12 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">Add another drug to compare</h3>
          <p className="text-secondary-600">You need at least two drugs to see a side-by-side comparison.</p>
          <div className="mt-4 p-4 bg-secondary-50 rounded-lg">
            <p className="font-medium text-secondary-900">{drugs[0].aiEnhancedTitle || drugs[0].name}</p>
            <p className="text-sm text-secondary-600 mt-1">Generic: {drugs[0].genericName || 'Not specified'}</p>
          </div>
        </div>
      </div>
    )
  }

  const renderFieldValue = (drug: Drug, field: ComparisonField) => {
    const value = drug[field.key]
    
    if (!value) {
      return (
        <div className="flex items-center text-secondary-400 text-sm">
          <X className="w-4 h-4 mr-1" />
          Not specified
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
      
      case 'list':
        if (Array.isArray(value)) {
          return (
            <div className="space-y-1">
              {value.map((item, index) => (
                <div key={index} className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-success-600 mr-1" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )
        }
        return <span className="text-sm">{value as string}</span>
      
      default:
        return (
          <div className="text-sm text-secondary-700">
            {typeof value === 'string' && value.length > 200 
              ? `${value.substring(0, 200)}...` 
              : value as string
            }
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Comparison Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">Drug Comparison</h1>
        <p className="text-secondary-600">Compare key information for {drugs.length} medications side by side</p>
      </div>

      {/* Drug Cards Header */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {drugs.map((drug) => (
          <div key={drug.id} className="card relative">
            {onRemoveDrug && (
              <button
                onClick={() => onRemoveDrug(drug.id)}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-secondary-100 text-secondary-400 hover:text-secondary-600"
                aria-label={`Remove ${drug.name} from comparison`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <div className="card-body text-center">
              <h3 className="font-semibold text-secondary-900 mb-1">
                {drug.aiEnhancedTitle || drug.name}
              </h3>
              <p className="text-sm text-secondary-600">
                Generic: {drug.genericName || drug.fdaGenericName || 'Not specified'}
              </p>
              {drug.fdaBrandName && (
                <p className="text-sm text-secondary-600">
                  Brand: {drug.fdaBrandName}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {COMPARISON_FIELDS.map((field) => (
            <div key={field.key} className="border-b border-secondary-200 last:border-b-0">
              <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-0">
                {/* Field Header */}
                <div className="bg-secondary-50 p-4 border-r border-secondary-200 lg:col-span-1">
                  <div className="flex items-center gap-2 mb-1">
                    {field.icon && <field.icon className="w-4 h-4 text-secondary-600" />}
                    <h4 className="font-medium text-secondary-900 text-sm">{field.label}</h4>
                  </div>
                  {field.description && (
                    <p className="text-xs text-secondary-600">{field.description}</p>
                  )}
                </div>
                
                {/* Field Values */}
                {drugs.slice(0, 4).map((drug, index) => (
                  <div 
                    key={drug.id} 
                    className={`p-4 ${index < drugs.length - 1 ? 'border-r border-secondary-200' : ''} lg:col-span-1`}
                  >
                    {renderFieldValue(drug, field)}
                  </div>
                ))}
                
                {/* Empty cells if fewer than 4 drugs */}
                {drugs.length < 4 && (
                  <>
                    {Array.from({ length: 4 - drugs.length }).map((_, index) => (
                      <div 
                        key={`empty-${index}`}
                        className="p-4 bg-secondary-25 border-r border-secondary-200 last:border-r-0"
                      >
                        <div className="text-center text-secondary-400 text-sm">
                          <Pill className="w-8 h-8 mx-auto mb-1 opacity-50" />
                          <span>Add drug to compare</span>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-secondary-50 p-4 rounded-lg">
        <h4 className="font-medium text-secondary-900 mb-2">Legend</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-success-600" />
            <span>Information available</span>
          </div>
          <div className="flex items-center gap-2">
            <X className="w-4 h-4 text-secondary-400" />
            <span>Information not specified</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning-600" />
            <span>Warning information</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-danger-600" />
            <span>Boxed warning (most serious)</span>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="alert-warning">
        <p className="font-medium mb-2">Important Medical Disclaimer</p>
        <p className="text-sm">
          This comparison is for informational purposes only and should not replace professional medical advice. 
          Always consult with your healthcare provider before making any decisions about medication therapy. 
          Individual patient factors may significantly affect drug selection and dosing.
        </p>
      </div>
    </div>
  )
}