'use client'

import { useEffect } from 'react'

interface JsonLdProps {
  data: object
  id?: string
}

export default function JsonLd({ data, id = 'jsonld' }: JsonLdProps) {
  useEffect(() => {
    // Remove existing script with the same id
    const existing = document.getElementById(id)
    if (existing) {
      existing.remove()
    }

    // Create and inject new script
    const script = document.createElement('script')
    script.id = id
    script.type = 'application/ld+json'
    script.innerHTML = JSON.stringify(data, null, 0)
    document.head.appendChild(script)

    return () => {
      const scriptToRemove = document.getElementById(id)
      if (scriptToRemove) {
        scriptToRemove.remove()
      }
    }
  }, [data, id])

  return null
}

// Organization structured data for the site
export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Drug Information Platform',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://druginfo.example.com',
  logo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://druginfo.example.com'}/logo.png`,
  description: 'Comprehensive drug information platform with AI-enhanced content and FDA label data.',
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Customer Service',
    availableLanguage: 'English'
  },
  sameAs: [
    'https://twitter.com/druginfoplatform'
  ]
}

// Website structured data
export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Drug Information Platform',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://druginfo.example.com',
  description: 'Comprehensive drug information with AI-enhanced content, FDA label data, and patient-friendly explanations.',
  publisher: {
    '@type': 'Organization',
    name: 'Drug Information Platform'
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://druginfo.example.com'}/search?q={search_term_string}`
    },
    'query-input': 'required name=search_term_string'
  }
}