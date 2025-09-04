import { Metadata } from 'next'
import DrugComparisonPage from '@/components/DrugComparisonPage'

export const metadata: Metadata = {
  title: 'Drug Comparison Tool | Compare Medications Side by Side',
  description: 'Compare multiple medications side by side. View indications, dosage, side effects, and warnings for different drugs to make informed healthcare decisions.',
  keywords: 'drug comparison, medication comparison, compare drugs, pharmaceutical comparison, medicine comparison tool',
  openGraph: {
    title: 'Drug Comparison Tool',
    description: 'Compare multiple medications side by side with detailed information about each drug.',
    type: 'website',
    images: [
      {
        url: '/api/og?title=Drug+Comparison+Tool',
        width: 1200,
        height: 630,
        alt: 'Drug Comparison Tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Drug Comparison Tool',
    description: 'Compare multiple medications side by side with detailed information.',
    images: ['/api/og?title=Drug+Comparison+Tool'],
  },
  alternates: {
    canonical: '/compare',
  },
}

export default function ComparePage() {
  return <DrugComparisonPage />
}