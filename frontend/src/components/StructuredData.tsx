import { Drug } from '@/types/drug'

interface StructuredDataProps {
  drug: Drug
}

export default function StructuredData({ drug }: StructuredDataProps) {
  // Schema.org Drug structured data
  const drugSchema = {
    '@context': 'https://schema.org',
    '@type': 'Drug',
    name: drug.name,
    description: drug.aiEnhancedDescription || `Information about ${drug.name}`,
    url: `https://druginfo.example.com/drugs/${drug.slug}`,
    ...(drug.genericName && { activeIngredient: drug.genericName }),
    ...(drug.fdaBrandName && { alternateName: drug.fdaBrandName }),
    ...(drug.manufacturer && {
      manufacturer: {
        '@type': 'Organization',
        name: drug.manufacturer,
      },
    }),
    ...(drug.route && { administrationRoute: drug.route }),
    ...(drug.indications && { indication: drug.indications }),
    ...(drug.contraindications && { contraindication: drug.contraindications }),
    ...(drug.warnings && { warning: drug.warnings }),
    ...(drug.dosageInfo && { dosageForm: drug.dosageInfo }),
    ...(drug.adverseReactions && { adverseOutcome: drug.adverseReactions }),
    isAvailableGenerically: !!drug.genericName,
    isPrescriptionOnly: true,
    legalStatus: 'PrescriptionOnly',
    rxcui: drug.id, // Using our internal ID as identifier
    dateCreated: drug.createdAt,
    dateModified: drug.updatedAt,
    ...(drug.brandNames && drug.brandNames.length > 0 && {
      sameAs: drug.brandNames.map(brand => `https://druginfo.example.com/search?q=${encodeURIComponent(brand)}`),
    }),
  }

  // Schema.org Medical WebPage structured data
  const medicalWebPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name: drug.seoMetaTitle || `${drug.name} - Drug Information`,
    description: drug.seoMetaDescription || drug.aiEnhancedDescription || `Information about ${drug.name}`,
    url: `https://druginfo.example.com/drugs/${drug.slug}`,
    mainEntity: drugSchema,
    about: {
      '@type': 'Drug',
      name: drug.name,
    },
    audience: {
      '@type': 'MedicalAudience',
      audienceType: ['Patient', 'MedicalProfessional'],
    },
    lastReviewed: drug.updatedAt,
    reviewedBy: {
      '@type': 'Organization',
      name: 'Drug Information Platform',
    },
    medicalAudience: [
      {
        '@type': 'MedicalAudience',
        audienceType: 'Patient',
      },
      {
        '@type': 'MedicalAudience',
        audienceType: 'MedicalProfessional',
      },
    ],
    ...(drug.boxedWarning && {
      warning: {
        '@type': 'MedicalWarning',
        content: drug.boxedWarning,
        category: 'BlackBoxWarning',
      },
    }),
  }

  // Schema.org Article structured data for SEO
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: drug.seoMetaTitle || `${drug.name} - Drug Information`,
    description: drug.seoMetaDescription || drug.aiEnhancedDescription,
    image: `https://druginfo.example.com/api/og?drug=${encodeURIComponent(drug.name)}`,
    author: {
      '@type': 'Organization',
      name: 'Drug Information Platform',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Drug Information Platform',
      logo: {
        '@type': 'ImageObject',
        url: 'https://druginfo.example.com/logo.png',
      },
    },
    datePublished: drug.createdAt,
    dateModified: drug.updatedAt,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://druginfo.example.com/drugs/${drug.slug}`,
    },
    about: drugSchema,
    articleSection: 'Drug Information',
    keywords: [
      drug.name,
      drug.genericName,
      drug.fdaBrandName,
      ...(drug.brandNames || []),
      'medication',
      'drug information',
      'prescription',
    ].filter(Boolean).join(', '),
  }

  // FAQPage structured data if FAQs exist
  const faqSchema = drug.faqs && drug.faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: drug.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  } : null

  // Combine all schemas
  const structuredData = [
    drugSchema,
    medicalWebPageSchema,
    articleSchema,
    ...(faqSchema ? [faqSchema] : []),
  ]

  return (
    <>
      {structuredData.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema, null, 0),
          }}
        />
      ))}
    </>
  )
}