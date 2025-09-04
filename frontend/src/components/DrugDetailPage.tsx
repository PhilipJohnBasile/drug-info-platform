'use client'

import { Drug } from '@/types/drug'
import { AlertTriangle, Calendar, Factory, Pill, Route, Users } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import DrugContent from './DrugContent'
import RelatedContentSuggestions from './RelatedContentSuggestions'

interface DrugDetailPageProps {
  drug: Drug
}

export default function DrugDetailPage({ drug }: DrugDetailPageProps) {
  return (
    <article className="min-h-screen bg-secondary-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-secondary-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start gap-8">
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold text-secondary-900 mb-4">
                {drug.aiEnhancedTitle || drug.name}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-secondary-600 mb-4">
                {drug.genericName && (
                  <div className="flex items-center gap-1">
                    <Pill className="w-4 h-4" />
                    <span>Generic: {drug.genericName}</span>
                  </div>
                )}
                {drug.fdaBrandName && (
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>Brand: {drug.fdaBrandName}</span>
                  </div>
                )}
                {drug.manufacturer && (
                  <div className="flex items-center gap-1">
                    <Factory className="w-4 h-4" />
                    <span>Manufacturer: {drug.manufacturer}</span>
                  </div>
                )}
                {drug.route && (
                  <div className="flex items-center gap-1">
                    <Route className="w-4 h-4" />
                    <span>Route: {drug.route}</span>
                  </div>
                )}
              </div>

              {drug.brandNames && drug.brandNames.length > 0 && (
                <div className="mb-4">
                  <span className="text-sm font-medium text-secondary-700">Other brand names: </span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {drug.brandNames.map((brand) => (
                      <span key={brand} className="badge-secondary">
                        {brand}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Drug Image Placeholder */}
            <div className="hidden sm:block">
              <img
                src={`https://picsum.photos/seed/${encodeURIComponent(drug.name)}/300/200`}
                alt={`${drug.name} medication`}
                className="w-48 h-32 object-cover rounded-lg shadow-md"
              />
            </div>

            <div className="text-right text-sm text-secondary-500">
              <div className="flex items-center gap-1 mb-1">
                <Calendar className="w-4 h-4" />
                <span>Updated: {formatDate(drug.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Related Content Suggestions */}
        <section className="mb-8">
          <RelatedContentSuggestions drug={drug} />
        </section>

        {/* Patient-Friendly Description */}
        {drug.aiEnhancedDescription && (
          <section className="mb-8">
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-secondary-900">Overview</h2>
              </div>
              <div className="card-body">
                <div className="prose max-w-none">
                  <p className="text-secondary-700 leading-relaxed">
                    {drug.aiEnhancedDescription}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Boxed Warning */}
        {drug.boxedWarning && (
          <section className="mb-8">
            <div className="bg-danger-50 border border-danger-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-danger-600 mt-1 flex-shrink-0" />
                <div>
                  <h2 className="text-lg font-bold text-danger-900 mb-2">
                    ⚠️ BLACK BOX WARNING
                  </h2>
                  <div className="prose prose-sm max-w-none text-danger-800">
                    <p>{drug.boxedWarning}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        <DrugContent drug={drug} />

        {/* Medical Disclaimer */}
        <section className="mt-12">
          <div className="alert-warning">
            <p className="font-medium mb-2">Important Medical Disclaimer</p>
            <p className="text-sm">
              This information is for educational purposes only and should not replace professional medical advice, 
              diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider 
              with any questions you may have regarding a medical condition. Never disregard professional medical 
              advice or delay in seeking it because of information you have read on this website.
            </p>
          </div>
        </section>
      </main>
    </article>
  )
}