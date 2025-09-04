import { generateSEO, generateDrugSEO, generateSearchSEO, generateDrugStructuredData } from '../seo'
import { Drug } from '@/types/drug'

// Mock environment variables
process.env.NEXT_PUBLIC_SITE_URL = 'https://druginfo.example.com'

describe('SEO Utils', () => {
  describe('generateSEO', () => {
    it('should generate basic SEO metadata', () => {
      const seo = generateSEO({
        title: 'Test Page',
        description: 'Test description',
        url: '/test-page'
      })

      expect(seo.title).toBe('Test Page | Drug Information Platform')
      expect(seo.description).toBe('Test description')
      expect(seo.alternates?.canonical).toBe('http://localhost:3000/test-page')
    })

    it('should generate Open Graph metadata', () => {
      const seo = generateSEO({
        title: 'Test Article',
        description: 'Article description',
        type: 'article',
        publishedTime: '2024-01-01T00:00:00Z',
        modifiedTime: '2024-01-02T00:00:00Z'
      })

      expect(seo.openGraph?.type).toBe('article')
      expect(seo.openGraph?.title).toBe('Test Article | Drug Information Platform')
      expect(seo.openGraph?.publishedTime).toBe('2024-01-01T00:00:00Z')
      expect(seo.openGraph?.modifiedTime).toBe('2024-01-02T00:00:00Z')
    })

    it('should generate Twitter Card metadata', () => {
      const seo = generateSEO({
        title: 'Twitter Test',
        description: 'Twitter description'
      })

      expect(seo.twitter?.card).toBe('summary_large_image')
      expect(seo.twitter?.title).toBe('Twitter Test | Drug Information Platform')
      expect(seo.twitter?.creator).toBe('@druginfoplatform')
    })

    it('should include keywords in metadata', () => {
      const seo = generateSEO({
        title: 'Test',
        keywords: ['keyword1', 'keyword2']
      })

      expect(seo.keywords).toContain('keyword1')
      expect(seo.keywords).toContain('keyword2')
      expect(seo.keywords).toContain('drug information') // Default keyword
    })

    it('should set noIndex when specified', () => {
      const seo = generateSEO({
        title: 'Test',
        noIndex: true
      })

      expect(seo.robots?.index).toBe(false)
      expect(seo.robots?.follow).toBe(false)
    })
  })

  describe('generateDrugSEO', () => {
    const mockDrug: Drug = {
      id: 'test-id',
      name: 'Lisinopril',
      genericName: 'lisinopril',
      fdaBrandName: 'Prinivil',
      brandNames: ['Prinivil', 'Zestril'],
      manufacturer: 'Test Pharma',
      route: 'oral',
      indications: 'Treatment of hypertension',
      contraindications: 'Hypersensitivity to ACE inhibitors',
      warnings: 'May cause dizziness',
      dosageInfo: '10mg once daily',
      adverseReactions: 'Headache, nausea',
      aiEnhancedTitle: 'Lisinopril - ACE Inhibitor for Blood Pressure',
      aiEnhancedDescription: 'Lisinopril is an ACE inhibitor that helps lower blood pressure by relaxing blood vessels.',
      seoMetaTitle: 'Lisinopril - Blood Pressure Medication',
      seoMetaDescription: 'Learn about Lisinopril, an ACE inhibitor for treating high blood pressure and heart conditions.',
      fdaLabelData: {},
      published: true,
      slug: 'lisinopril',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
      faqs: []
    }

    it('should generate drug SEO with optimized title', () => {
      const seo = generateDrugSEO(mockDrug)

      expect(seo.title).toBe('Lisinopril - Blood Pressure Medication | Drug Information Platform')
      expect(seo.title!.length).toBeLessThanOrEqual(75) // Title + site name should be reasonable
    })

    it('should generate drug SEO with optimized description', () => {
      const seo = generateDrugSEO(mockDrug)

      expect(seo.description).toBe('Learn about Lisinopril, an ACE inhibitor for treating high blood pressure and heart conditions.')
      expect(seo.description!.length).toBeLessThanOrEqual(160)
    })

    it('should truncate long titles to 60 characters', () => {
      const drugWithLongTitle: Drug = {
        ...mockDrug,
        seoMetaTitle: 'This Is A Very Long Drug Title That Definitely Exceeds Sixty Characters And Should Be Truncated'
      }

      const seo = generateDrugSEO(drugWithLongTitle)
      const titleWithoutSiteName = seo.title!.replace(' | Drug Information Platform', '')
      
      expect(titleWithoutSiteName.length).toBeLessThanOrEqual(60)
      expect(titleWithoutSiteName).toContain('...')
    })

    it('should truncate long descriptions to 160 characters', () => {
      const drugWithLongDescription: Drug = {
        ...mockDrug,
        seoMetaDescription: 'This is a very long drug description that definitely exceeds one hundred and sixty characters and should be truncated to fit within the recommended meta description length limits for optimal SEO performance.'
      }

      const seo = generateDrugSEO(drugWithLongDescription)
      
      expect(seo.description!.length).toBeLessThanOrEqual(160)
      expect(seo.description).toContain('...')
    })

    it('should include drug-specific keywords', () => {
      const seo = generateDrugSEO(mockDrug)

      expect(seo.keywords).toContain('Lisinopril')
      expect(seo.keywords).toContain('lisinopril')
      expect(seo.keywords).toContain('Prinivil')
      expect(seo.keywords).toContain('Test Pharma')
      expect(seo.keywords).toContain('prescription drug')
    })

    it('should generate article-type Open Graph', () => {
      const seo = generateDrugSEO(mockDrug)

      expect(seo.openGraph?.type).toBe('article')
      expect(seo.openGraph?.publishedTime).toBe(mockDrug.createdAt)
      expect(seo.openGraph?.modifiedTime).toBe(mockDrug.updatedAt)
      expect(seo.openGraph?.section).toBe('Drug Information')
    })

    it('should generate canonical URL', () => {
      const seo = generateDrugSEO(mockDrug)

      expect(seo.alternates?.canonical).toBe('http://localhost:3000/drugs/lisinopril')
    })

    it('should include custom OG image for drug', () => {
      const seo = generateDrugSEO(mockDrug)

      expect(seo.openGraph?.images?.[0]?.url).toContain('/api/og/drug')
      expect(seo.openGraph?.images?.[0]?.url).toContain('name=Lisinopril')
      expect(seo.openGraph?.images?.[0]?.url).toContain('generic=lisinopril')
    })

    it('should handle drugs with missing optional fields', () => {
      const minimalDrug: Drug = {
        ...mockDrug,
        genericName: undefined,
        manufacturer: undefined,
        seoMetaTitle: undefined,
        seoMetaDescription: undefined
      }

      const seo = generateDrugSEO(minimalDrug)

      expect(seo.title).toContain(minimalDrug.name)
      expect(seo.description).toContain(minimalDrug.name)
      expect(seo.alternates?.canonical).toBeDefined()
    })
  })

  describe('generateSearchSEO', () => {
    it('should generate search page SEO without query', () => {
      const seo = generateSearchSEO()

      expect(seo.title).toBe('Search Drugs - Drug Information Platform | Drug Information Platform')
      expect(seo.description).toContain('Search our comprehensive database')
      expect(seo.alternates?.canonical).toBe('http://localhost:3000/search')
    })

    it('should generate search page SEO with query', () => {
      const seo = generateSearchSEO('lisinopril')

      expect(seo.title).toContain('Search results for "lisinopril"')
      expect(seo.description).toContain('"lisinopril"')
      expect(seo.alternates?.canonical).toBe('http://localhost:3000/search?q=lisinopril')
    })

    it('should include search-specific keywords', () => {
      const seo = generateSearchSEO()

      expect(seo.keywords).toContain('drug search')
      expect(seo.keywords).toContain('medication search')
      expect(seo.keywords).toContain('FDA drug database')
    })
  })

  describe('generateDrugStructuredData', () => {
    const mockDrug: Drug = {
      id: 'test-id',
      name: 'Aspirin',
      genericName: 'acetylsalicylic acid',
      fdaBrandName: 'Bayer Aspirin',
      manufacturer: 'Bayer',
      route: 'oral',
      indications: 'Pain relief and fever reduction',
      contraindications: 'Bleeding disorders',
      warnings: 'May cause stomach upset',
      dosageInfo: '325mg every 4-6 hours',
      adverseReactions: 'Stomach upset, bleeding',
      aiEnhancedDescription: 'Aspirin is a pain reliever and anti-inflammatory medication.',
      fdaLabelData: {},
      published: true,
      slug: 'aspirin',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
      faqs: []
    }

    it('should generate valid Schema.org Drug structured data', () => {
      const structuredData = generateDrugStructuredData(mockDrug)

      expect(structuredData['@context']).toBe('https://schema.org')
      expect(structuredData['@type']).toBe('Drug')
      expect(structuredData.name).toBe('Aspirin')
      expect(structuredData.description).toBe('Aspirin is a pain reliever and anti-inflammatory medication.')
      expect(structuredData.url).toBe('http://localhost:3000/drugs/aspirin')
    })

    it('should include drug properties when available', () => {
      const structuredData = generateDrugStructuredData(mockDrug)

      expect(structuredData.activeIngredient).toBe('acetylsalicylic acid')
      expect(structuredData.alternateName).toBe('Bayer Aspirin')
      expect(structuredData.manufacturer).toEqual({
        '@type': 'Organization',
        name: 'Bayer'
      })
      expect(structuredData.administrationRoute).toBe('oral')
      expect(structuredData.indication).toBe('Pain relief and fever reduction')
      expect(structuredData.contraindication).toBe('Bleeding disorders')
      expect(structuredData.warning).toBe('May cause stomach upset')
      expect(structuredData.dosageForm).toBe('325mg every 4-6 hours')
      expect(structuredData.adverseOutcome).toBe('Stomach upset, bleeding')
    })

    it('should set prescription properties', () => {
      const structuredData = generateDrugStructuredData(mockDrug)

      expect(structuredData.isPrescriptionOnly).toBe(true)
      expect(structuredData.legalStatus).toBe('PrescriptionOnly')
    })

    it('should include timestamps', () => {
      const structuredData = generateDrugStructuredData(mockDrug)

      expect(structuredData.dateCreated).toBe(mockDrug.createdAt)
      expect(structuredData.dateModified).toBe(mockDrug.updatedAt)
    })

    it('should handle missing optional fields gracefully', () => {
      const minimalDrug: Drug = {
        ...mockDrug,
        genericName: undefined,
        manufacturer: undefined,
        route: undefined,
        indications: undefined
      }

      const structuredData = generateDrugStructuredData(minimalDrug)

      expect(structuredData.name).toBe('Aspirin')
      expect(structuredData.activeIngredient).toBeUndefined()
      expect(structuredData.manufacturer).toBeUndefined()
      expect(structuredData.administrationRoute).toBeUndefined()
      expect(structuredData.indication).toBeUndefined()
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty strings gracefully', () => {
      const seo = generateSEO({
        title: '',
        description: '',
        url: ''
      })

      expect(seo.title).toBe('Drug Information Platform') // Empty title becomes just site name
      expect(seo.description).toBe('Comprehensive drug information with AI-enhanced content, FDA label data, and patient-friendly explanations.') // Fallback
    })

    it('should handle undefined NEXT_PUBLIC_SITE_URL', () => {
      delete process.env.NEXT_PUBLIC_SITE_URL

      const seo = generateSEO({
        title: 'Test',
        url: '/test'
      })

      expect(seo.alternates?.canonical).toBe('http://localhost:3000/test') // Fallback URL
    })

    it('should generate fallback descriptions for drugs', () => {
      const drugWithoutDescription: Drug = {
        id: 'test',
        name: 'Test Drug',
        fdaLabelData: {},
        published: true,
        slug: 'test-drug',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        faqs: [],
        aiEnhancedDescription: undefined,
        seoMetaDescription: undefined
      }

      const seo = generateDrugSEO(drugWithoutDescription)

      expect(seo.description).toContain('Learn about Test Drug')
      expect(seo.description).toContain('uses, dosage, side effects')
    })
  })
})