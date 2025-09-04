import { Metadata } from 'next'
import { Drug } from '@/types/drug'

const SITE_CONFIG = {
  name: 'Drug Information Platform',
  description: 'Comprehensive drug information with AI-enhanced content, FDA label data, and patient-friendly explanations.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://druginfo.example.com',
  ogImage: '/og-image.png',
  twitter: '@druginfoplatform',
  keywords: [
    'drug information',
    'medication guide',
    'FDA labels',
    'prescription drugs',
    'pharmaceutical information',
    'medical reference',
    'drug safety',
    'medication side effects'
  ]
}

interface SEOProps {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  url?: string
  type?: 'website' | 'article'
  publishedTime?: string
  modifiedTime?: string
  section?: string
  tags?: string[]
  noIndex?: boolean
}

export function generateSEO({
  title,
  description,
  keywords = [],
  image,
  url,
  type = 'website',
  publishedTime,
  modifiedTime,
  section,
  tags = [],
  noIndex = false
}: SEOProps): Metadata {
  const seoTitle = title 
    ? `${title} | ${SITE_CONFIG.name}`
    : SITE_CONFIG.name
  
  const seoDescription = description || SITE_CONFIG.description
  const seoImage = image ? `${SITE_CONFIG.url}${image}` : `${SITE_CONFIG.url}${SITE_CONFIG.ogImage}`
  const seoUrl = url ? `${SITE_CONFIG.url}${url}` : SITE_CONFIG.url
  
  const allKeywords = [...SITE_CONFIG.keywords, ...keywords].join(', ')

  return {
    metadataBase: new URL(SITE_CONFIG.url),
    title: seoTitle,
    description: seoDescription,
    keywords: allKeywords,
    
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    openGraph: {
      type,
      locale: 'en_US',
      url: seoUrl,
      title: seoTitle,
      description: seoDescription,
      siteName: SITE_CONFIG.name,
      images: [
        {
          url: seoImage,
          width: 1200,
          height: 630,
          alt: title || SITE_CONFIG.name,
        }
      ],
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      ...(section && { section }),
      ...(tags.length > 0 && { tags }),
    },

    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: seoDescription,
      creator: SITE_CONFIG.twitter,
      site: SITE_CONFIG.twitter,
      images: [seoImage],
    },

    alternates: {
      canonical: seoUrl,
    },

    authors: [{ name: SITE_CONFIG.name }],
    creator: SITE_CONFIG.name,
    publisher: SITE_CONFIG.name,

    // Schema.org metadata
    other: {
      'article:author': SITE_CONFIG.name,
      'article:publisher': SITE_CONFIG.name,
      ...(publishedTime && { 'article:published_time': publishedTime }),
      ...(modifiedTime && { 'article:modified_time': modifiedTime }),
      ...(section && { 'article:section': section }),
      ...(tags.length > 0 && { 'article:tag': tags.join(',') }),
    }
  }
}

export function generateDrugSEO(drug: Drug): Metadata {
  const title = drug.seoMetaTitle || drug.aiEnhancedTitle || `${drug.name} - Drug Information`
  const description = drug.seoMetaDescription || drug.aiEnhancedDescription || 
    `Learn about ${drug.name}${drug.genericName ? ` (${drug.genericName})` : ''}, including uses, dosage, side effects, and safety information.`

  // Optimize title and description lengths
  const optimizedTitle = title.length > 60 ? `${title.substring(0, 57)}...` : title
  const optimizedDescription = description.length > 160 ? `${description.substring(0, 157)}...` : description

  const keywords = [
    drug.name,
    drug.genericName,
    drug.fdaGenericName,
    drug.fdaBrandName,
    ...(drug.brandNames || []),
    drug.manufacturer,
    'medication',
    'prescription drug',
    'FDA approved',
    'side effects',
    'dosage',
    'contraindications',
    'warnings',
  ].filter(Boolean)

  const tags = [
    drug.name,
    drug.genericName,
    'medication',
    'drug information',
    'healthcare',
  ].filter(Boolean)

  return generateSEO({
    title: optimizedTitle,
    description: optimizedDescription,
    keywords,
    url: `/drugs/${drug.slug}`,
    type: 'article',
    publishedTime: drug.createdAt,
    modifiedTime: drug.updatedAt,
    section: 'Drug Information',
    tags,
    image: `/api/og/drug?name=${encodeURIComponent(drug.name)}&generic=${encodeURIComponent(drug.genericName || '')}`,
  })
}

export function generateSearchSEO(query?: string): Metadata {
  const title = query 
    ? `Search results for "${query}" - Drug Information`
    : 'Search Drugs - Drug Information Platform'
  
  const description = query
    ? `Find detailed information about "${query}" and related medications including uses, dosage, side effects, and safety information.`
    : 'Search our comprehensive database of drug information including FDA labels, indications, contraindications, and patient-friendly explanations.'

  return generateSEO({
    title,
    description,
    url: query ? `/search?q=${encodeURIComponent(query)}` : '/search',
    keywords: ['drug search', 'medication search', 'prescription drug lookup', 'FDA drug database'],
  })
}

// Utility to generate structured data for drugs
export function generateDrugStructuredData(drug: Drug) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Drug',
    name: drug.name,
    description: drug.aiEnhancedDescription || `Information about ${drug.name}`,
    url: `${SITE_CONFIG.url}/drugs/${drug.slug}`,
    identifier: drug.id,
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
    dateCreated: drug.createdAt,
    dateModified: drug.updatedAt,
  }
}