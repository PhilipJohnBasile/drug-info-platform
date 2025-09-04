import { Drug, DrugSearchParams } from '@/types/drug'

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'

class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message)
    this.name = 'APIError'
  }
}

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    let errorData
    try {
      errorData = await response.json()
    } catch {
      errorData = { message: 'An error occurred' }
    }
    
    throw new APIError(
      errorData.message || `HTTP ${response.status}`,
      response.status,
      errorData
    )
  }

  return response.json()
}

export const drugAPI = {
  // Get all drugs with optional filtering
  async getDrugs(params?: DrugSearchParams): Promise<Drug[]> {
    const searchParams = new URLSearchParams()
    
    if (params?.published !== undefined) {
      searchParams.set('published', params.published.toString())
    }
    if (params?.limit) {
      searchParams.set('limit', params.limit.toString())
    }

    const endpoint = `/drugs${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    return fetchAPI<Drug[]>(endpoint)
  },

  // Get drug by ID
  async getDrugById(id: string): Promise<Drug> {
    return fetchAPI<Drug>(`/drugs/${id}`)
  },

  // Get drug by slug
  async getDrugBySlug(slug: string): Promise<Drug> {
    return fetchAPI<Drug>(`/drugs/slug/${slug}`)
  },

  // Search drugs
  async searchDrugs(query: string, filters?: { manufacturer?: string; route?: string; hasWarning?: boolean }, limit = 20): Promise<Drug[]> {
    const searchParams = new URLSearchParams({
      query,
      limit: limit.toString(),
      published: 'true',
    })
    
    if (filters?.manufacturer) {
      searchParams.set('manufacturer', filters.manufacturer)
    }
    if (filters?.route) {
      searchParams.set('route', filters.route)
    }
    if (filters?.hasWarning) {
      searchParams.set('hasWarning', 'true')
    }
    
    return fetchAPI<Drug[]>(`/drugs/search?${searchParams.toString()}`)
  },

  // Compare multiple drugs by IDs
  async compareDrugs(drugIds: string[]): Promise<Drug[]> {
    return fetchAPI<Drug[]>('/drugs/compare', {
      method: 'POST',
      body: JSON.stringify({ ids: drugIds }),
    })
  },
}

// Cache for static generation
export const drugCache = {
  // Get all published drug slugs for static generation
  async getAllDrugSlugs(): Promise<string[]> {
    try {
      const drugs = await drugAPI.getDrugs({ published: true })
      return drugs.map(drug => drug.slug)
    } catch (error) {
      console.error('Error fetching drug slugs:', error)
      return []
    }
  },

  // Get drug data for static generation
  async getDrugForStaticGeneration(slug: string): Promise<Drug | null> {
    try {
      return await drugAPI.getDrugBySlug(slug)
    } catch (error) {
      console.error(`Error fetching drug data for ${slug}:`, error)
      return null
    }
  },
}

export { APIError }