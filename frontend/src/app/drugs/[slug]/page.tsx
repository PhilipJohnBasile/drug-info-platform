import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { drugAPI, drugCache } from '@/lib/api'
import { Drug } from '@/types/drug'
import { generateDrugSEO } from '@/lib/seo'
import DrugDetailPage from '@/components/DrugDetailPage'

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

// Generate static paths for all published drugs
export async function generateStaticParams() {
  try {
    const slugs = await drugCache.getAllDrugSlugs()
    return slugs.map((slug) => ({
      slug,
    }))
  } catch (error) {
    console.error('Error generating static params:', error)
    return []
  }
}

// Generate metadata for each drug page
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const resolvedParams = await params
    const drug = await drugAPI.getDrugBySlug(resolvedParams.slug)
    
    if (!drug) {
      return {
        title: 'Drug Not Found | Drug Information Platform',
        description: 'The requested drug information could not be found.',
        robots: {
          index: false,
          follow: false,
        },
        alternates: {
          canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://druginfo.example.com'}/drugs/${resolvedParams.slug}`,
        },
      }
    }

    return generateDrugSEO(drug)
  } catch (error) {
    console.error(`Error generating metadata:`, error)
    return {
      title: 'Drug Information | Drug Information Platform',
      description: 'Drug information page',
      robots: {
        index: false,
        follow: false,
      },
    }
  }
}

export default async function DrugPage({ params }: PageProps) {
  let drug: Drug
  
  try {
    const resolvedParams = await params
    drug = await drugAPI.getDrugBySlug(resolvedParams.slug)
  } catch (error) {
    console.error(`Error fetching drug:`, error)
    notFound()
  }

  if (!drug) {
    notFound()
  }

  return <DrugDetailPage drug={drug} />
}

// Enable ISR (Incremental Static Regeneration)
export const revalidate = 3600 // Revalidate every hour