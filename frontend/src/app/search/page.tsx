import { Metadata } from 'next'
import { generateSearchSEO } from '@/lib/seo'
import SearchPage from '@/components/SearchPage'

export const metadata: Metadata = generateSearchSEO()

export default function Search() {
  return <SearchPage />
}