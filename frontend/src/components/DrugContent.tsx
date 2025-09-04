'use client'

import { Drug } from '@/types/drug'
import { AlertTriangle } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { Suspense, lazy } from 'react'

interface DrugContentProps {
  drug: Drug
}

const LazyFAQSection = lazy(() => import('./sections/FAQSection'))

export default function DrugContent({ drug }: DrugContentProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Column */}
      <div className="lg:col-span-2 space-y-8">
        {/* Indications and Usage */}
        {drug.indications && (
          <section aria-labelledby="indications-heading">
            <div className="card">
              <div className="card-header">
                <h2 id="indications-heading" className="text-xl font-semibold text-secondary-900">
                  Indications and Usage
                </h2>
              </div>
              <div className="card-body">
                <div className="prose max-w-none">
                  <p className="text-secondary-700" itemProp="indication">
                    {drug.indications}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Dosage and Administration */}
        {drug.dosageInfo && (
          <section aria-labelledby="dosage-heading">
            <div className="card">
              <div className="card-header">
                <h2 id="dosage-heading" className="text-xl font-semibold text-secondary-900">
                  Dosage and Administration
                </h2>
              </div>
              <div className="card-body">
                <div className="prose max-w-none">
                  <p className="text-secondary-700" itemProp="dosageForm">
                    {drug.dosageInfo}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Warnings and Precautions */}
        {drug.warnings && (
          <section aria-labelledby="warnings-heading">
            <div className="card">
              <div className="card-header">
                <h2 id="warnings-heading" className="text-xl font-semibold text-secondary-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-warning-600" aria-hidden="true" />
                  Warnings and Precautions
                </h2>
              </div>
              <div className="card-body">
                <div className="prose max-w-none">
                  <p className="text-secondary-700" itemProp="warning">
                    {drug.warnings}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Contraindications */}
        {drug.contraindications && (
          <section aria-labelledby="contraindications-heading">
            <div className="card">
              <div className="card-header">
                <h2 id="contraindications-heading" className="text-xl font-semibold text-secondary-900">
                  Contraindications
                </h2>
              </div>
              <div className="card-body">
                <div className="prose max-w-none">
                  <p className="text-secondary-700" itemProp="contraindication">
                    {drug.contraindications}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Adverse Reactions */}
        {drug.adverseReactions && (
          <section aria-labelledby="adverse-reactions-heading">
            <div className="card">
              <div className="card-header">
                <h2 id="adverse-reactions-heading" className="text-xl font-semibold text-secondary-900">
                  Adverse Reactions
                </h2>
              </div>
              <div className="card-body">
                <div className="prose max-w-none">
                  <p className="text-secondary-700" itemProp="adverseOutcome">
                    {drug.adverseReactions}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Sidebar */}
      <aside className="space-y-6" role="complementary" aria-label="Drug information sidebar">
        {/* FAQs */}
        {drug.faqs && drug.faqs.length > 0 && (
          <Suspense fallback={<div className="card animate-pulse"><div className="card-header h-8 bg-secondary-200 rounded"></div><div className="card-body h-32 bg-secondary-100 rounded"></div></div>}>
            <LazyFAQSection faqs={drug.faqs} />
          </Suspense>
        )}

        {/* Drug Information Summary */}
        <section aria-labelledby="drug-info-heading">
          <div className="card">
            <div className="card-header">
              <h2 id="drug-info-heading" className="text-lg font-semibold text-secondary-900">
                Drug Information
              </h2>
            </div>
            <div className="card-body space-y-3">
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-secondary-700">Generic Name:</dt>
                  <dd className="text-sm text-secondary-900" itemProp="activeIngredient">
                    {drug.genericName || drug.fdaGenericName || 'Not specified'}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-secondary-700">Brand Name:</dt>
                  <dd className="text-sm text-secondary-900" itemProp="alternateName">
                    {drug.fdaBrandName || 'Not specified'}
                  </dd>
                </div>

                {drug.manufacturer && (
                  <div>
                    <dt className="text-sm font-medium text-secondary-700">Manufacturer:</dt>
                    <dd className="text-sm text-secondary-900" itemProp="manufacturer" itemScope itemType="https://schema.org/Organization">
                      <span itemProp="name">{drug.manufacturer}</span>
                    </dd>
                  </div>
                )}

                {drug.route && (
                  <div>
                    <dt className="text-sm font-medium text-secondary-700">Route:</dt>
                    <dd className="text-sm text-secondary-900" itemProp="administrationRoute">
                      {drug.route}
                    </dd>
                  </div>
                )}

                <div>
                  <dt className="text-sm font-medium text-secondary-700">Last Updated:</dt>
                  <dd className="text-sm text-secondary-900" itemProp="dateModified">
                    <time dateTime={drug.updatedAt}>{formatDate(drug.updatedAt)}</time>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </section>
      </aside>
    </div>
  )
}