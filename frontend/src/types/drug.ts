export interface Drug {
  id: string
  name: string
  genericName?: string
  fdaGenericName?: string
  fdaBrandName?: string
  brandNames?: string[]
  slug: string
  manufacturer?: string
  route?: string
  published: boolean
  createdAt: string
  updatedAt: string
  
  // FDA Label Information
  fdaLabelData?: any
  indications?: string
  contraindications?: string
  warnings?: string
  boxedWarning?: string
  dosageInfo?: string
  adverseReactions?: string
  
  // AI-Enhanced Content
  aiEnhancedTitle?: string
  aiEnhancedDescription?: string
  seoMetaTitle?: string
  seoMetaDescription?: string
  
  // FAQs
  faqs?: DrugFAQ[]
}

export interface DrugFAQ {
  id: string
  question: string
  answer: string
  createdAt: string
  updatedAt: string
  drugId: string
}

export interface DrugSearchParams {
  query?: string
  limit?: number
  published?: boolean
}

export interface DrugSearchResponse {
  drugs: Drug[]
  total: number
  query?: string
  limit?: number
}

export interface APIResponse<T> {
  data?: T
  error?: string
  message?: string
}