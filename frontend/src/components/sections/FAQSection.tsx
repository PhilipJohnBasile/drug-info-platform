'use client'

import { DrugFAQ } from '@/types/drug'

interface FAQSectionProps {
  faqs: DrugFAQ[]
}

export default function FAQSection({ faqs }: FAQSectionProps) {
  return (
    <section aria-labelledby="faq-heading" itemScope itemType="https://schema.org/FAQPage">
      <div className="card">
        <div className="card-header">
          <h2 id="faq-heading" className="text-lg font-semibold text-secondary-900">
            Frequently Asked Questions
          </h2>
        </div>
        <div className="card-body space-y-6">
          {faqs.map((faq, index) => (
            <article 
              key={faq.id} 
              itemScope 
              itemType="https://schema.org/Question"
              className="faq-item"
            >
              <h3 className="font-medium text-secondary-900 mb-2" itemProp="name">
                {faq.question}
              </h3>
              <div itemScope itemType="https://schema.org/Answer" itemProp="acceptedAnswer">
                <p className="text-sm text-secondary-600 leading-relaxed" itemProp="text">
                  {faq.answer}
                </p>
              </div>
              {index < faqs.length - 1 && (
                <hr className="mt-4 border-secondary-200" aria-hidden="true" />
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}