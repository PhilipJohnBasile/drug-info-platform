import { Metadata } from 'next'
import Link from 'next/link'
import { drugAPI } from '@/lib/api'
import { Drug } from '@/types/drug'
import { formatDate } from '@/lib/utils'
import { Pill, Calendar, Factory } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Browse All Drugs - Drug Information Platform',
  description: 'Browse our comprehensive database of drug information including FDA-approved medications with detailed usage, safety, and dosage information.',
  openGraph: {
    title: 'Browse All Drugs - Drug Information Platform',
    description: 'Browse our comprehensive database of drug information including FDA-approved medications with detailed usage, safety, and dosage information.',
  },
}

export default async function DrugsPage() {
  let drugs: Drug[] = []
  let error: string | null = null

  try {
    drugs = await drugAPI.getDrugs({ published: true })
  } catch (err) {
    console.error('Error fetching drugs:', err)
    error = 'Failed to load drug information. Please try again later.'
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-secondary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-secondary-900 mb-4">
              Drug Database
            </h1>
            <p className="text-xl text-secondary-600 max-w-2xl mx-auto">
              Browse our comprehensive collection of FDA-approved medications with detailed information, 
              safety guidelines, and patient-friendly explanations.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          <div className="alert-danger">
            <p>{error}</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-secondary-600">Total Medications</p>
                    <p className="text-2xl font-bold text-secondary-900">{drugs.length}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-secondary-500">
                      All medications include FDA label data and AI-enhanced content
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Drug Grid */}
            {drugs.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-12">
                  <Pill className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-secondary-900 mb-2">
                    No drugs available
                  </h3>
                  <p className="text-secondary-500">
                    Drug information is being updated. Please check back later.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {drugs.map((drug) => (
                  <Link key={drug.id} href={`/drugs/${drug.slug}`}>
                    <div className="card hover:shadow-lg transition-shadow duration-200 cursor-pointer h-full">
                      <div className="card-body flex flex-col h-full">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-secondary-900 mb-2 hover:text-primary-600 transition-colors">
                            {drug.name}
                          </h3>
                          
                          <div className="space-y-2 mb-4">
                            {drug.genericName && (
                              <div className="flex items-center gap-2 text-sm text-secondary-600">
                                <Pill className="w-4 h-4 flex-shrink-0" />
                                <span>Generic: {drug.genericName}</span>
                              </div>
                            )}
                            
                            {drug.manufacturer && (
                              <div className="flex items-center gap-2 text-sm text-secondary-600">
                                <Factory className="w-4 h-4 flex-shrink-0" />
                                <span>Mfg: {drug.manufacturer}</span>
                              </div>
                            )}
                          </div>

                          {drug.brandNames && drug.brandNames.length > 0 && (
                            <div className="mb-4">
                              <div className="flex flex-wrap gap-1">
                                {drug.brandNames.slice(0, 3).map((brand) => (
                                  <span key={brand} className="badge-secondary text-xs">
                                    {brand}
                                  </span>
                                ))}
                                {drug.brandNames.length > 3 && (
                                  <span className="badge-secondary text-xs">
                                    +{drug.brandNames.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {drug.aiEnhancedDescription && (
                            <p className="text-sm text-secondary-600 line-clamp-3 mb-4">
                              {drug.aiEnhancedDescription.length > 150
                                ? `${drug.aiEnhancedDescription.substring(0, 150)}...`
                                : drug.aiEnhancedDescription}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs text-secondary-500 pt-4 border-t border-secondary-200">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Updated {formatDate(drug.updatedAt)}</span>
                          </div>
                          
                          <div className="flex gap-2">
                            {drug.boxedWarning && (
                              <span className="badge-danger text-xs">
                                Boxed Warning
                              </span>
                            )}
                            {drug.faqs && drug.faqs.length > 0 && (
                              <span className="badge-primary text-xs">
                                {drug.faqs.length} FAQs
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {/* Medical Disclaimer */}
        <div className="mt-12">
          <div className="alert-warning">
            <p className="font-medium mb-2">Important Medical Disclaimer</p>
            <p className="text-sm">
              This information is for educational purposes only and should not replace professional medical advice. 
              Always consult with a healthcare provider before making decisions about medications.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Enable ISR (Incremental Static Regeneration)
export const revalidate = 1800 // Revalidate every 30 minutes