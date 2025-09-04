import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import { AppModule } from '../app.module'
import { PrismaService } from '../prisma/prisma.service'
import { Drug } from '@prisma/client'

describe('DrugsController (Integration)', () => {
  let app: INestApplication
  let prisma: PrismaService

  const testDrug = {
    name: 'Test Drug',
    genericName: 'test-generic',
    fdaBrandName: 'Test Brand',
    brandNames: ['Brand 1', 'Brand 2'],
    manufacturer: 'Test Pharma Inc.',
    route: 'oral',
    indications: 'Treatment of test conditions',
    contraindications: 'Do not use if allergic',
    warnings: 'May cause drowsiness',
    dosageInfo: '10mg once daily',
    adverseReactions: 'Headache, nausea',
    aiEnhancedTitle: 'Test Drug - Medication for Testing',
    aiEnhancedDescription: 'This is a test drug used for testing purposes',
    seoMetaTitle: 'Test Drug - Test Medication',
    seoMetaDescription: 'Learn about Test Drug, a medication used for testing',
    fdaLabelData: {
      brand_name: ['Test Brand'],
      generic_name: ['test-generic'],
      manufacturer: ['Test Pharma Inc.']
    },
    published: true,
    slug: 'test-drug'
  }

  const testFAQs = [
    {
      question: 'What is Test Drug used for?',
      answer: 'Test Drug is used for testing purposes in our application.'
    },
    {
      question: 'How does Test Drug work?',
      answer: 'Test Drug works by providing test data for our integration tests.'
    }
  ]

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    prisma = moduleFixture.get<PrismaService>(PrismaService)
    
    await app.init()
  })

  beforeEach(async () => {
    // Clean up test data
    await prisma.drugFAQ.deleteMany({})
    await prisma.drug.deleteMany({})
  })

  afterAll(async () => {
    // Final cleanup
    await prisma.drugFAQ.deleteMany({})
    await prisma.drug.deleteMany({})
    await prisma.$disconnect()
    await app.close()
  })

  describe('POST /drugs', () => {
    it('should create a new drug', async () => {
      const response = await request(app.getHttpServer())
        .post('/drugs')
        .send(testDrug)
        .expect(201)

      expect(response.body).toMatchObject({
        name: testDrug.name,
        genericName: testDrug.genericName,
        slug: testDrug.slug,
        published: testDrug.published
      })
      expect(response.body.id).toBeDefined()
      expect(response.body.createdAt).toBeDefined()
      expect(response.body.updatedAt).toBeDefined()
    })

    it('should validate required fields', async () => {
      const invalidDrug = { genericName: 'test' } // Missing required 'name' field

      await request(app.getHttpServer())
        .post('/drugs')
        .send(invalidDrug)
        .expect(400)
    })

    it('should prevent duplicate slugs', async () => {
      // Create first drug
      await request(app.getHttpServer())
        .post('/drugs')
        .send(testDrug)
        .expect(201)

      // Try to create second drug with same slug
      await request(app.getHttpServer())
        .post('/drugs')
        .send({ ...testDrug, name: 'Different Name' })
        .expect(409) // Conflict
    })
  })

  describe('GET /drugs', () => {
    let createdDrug: Drug

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/drugs')
        .send(testDrug)

      createdDrug = response.body
    })

    it('should return all drugs', async () => {
      const response = await request(app.getHttpServer())
        .get('/drugs')
        .expect(200)

      expect(response.body).toHaveLength(1)
      expect(response.body[0]).toMatchObject({
        id: createdDrug.id,
        name: testDrug.name,
        slug: testDrug.slug
      })
    })

    it('should filter by published status', async () => {
      // Create unpublished drug
      await request(app.getHttpServer())
        .post('/drugs')
        .send({ ...testDrug, name: 'Unpublished Drug', slug: 'unpublished', published: false })

      const response = await request(app.getHttpServer())
        .get('/drugs?published=true')
        .expect(200)

      expect(response.body).toHaveLength(1)
      expect(response.body[0].published).toBe(true)
    })

    it('should limit results', async () => {
      // Create additional drugs
      for (let i = 1; i <= 5; i++) {
        await request(app.getHttpServer())
          .post('/drugs')
          .send({ 
            ...testDrug, 
            name: `Test Drug ${i}`, 
            slug: `test-drug-${i}` 
          })
      }

      const response = await request(app.getHttpServer())
        .get('/drugs?limit=3')
        .expect(200)

      expect(response.body).toHaveLength(3)
    })
  })

  describe('GET /drugs/:id', () => {
    let createdDrug: Drug

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/drugs')
        .send(testDrug)

      createdDrug = response.body

      // Add FAQs
      for (const faq of testFAQs) {
        await prisma.drugFAQ.create({
          data: {
            ...faq,
            drugId: createdDrug.id
          }
        })
      }
    })

    it('should return drug by ID with FAQs', async () => {
      const response = await request(app.getHttpServer())
        .get(`/drugs/${createdDrug.id}`)
        .expect(200)

      expect(response.body).toMatchObject({
        id: createdDrug.id,
        name: testDrug.name,
        slug: testDrug.slug
      })
      expect(response.body.faqs).toHaveLength(2)
      expect(response.body.faqs[0]).toMatchObject(testFAQs[0])
    })

    it('should return 404 for non-existent drug', async () => {
      await request(app.getHttpServer())
        .get('/drugs/non-existent-id')
        .expect(404)
    })
  })

  describe('GET /drugs/slug/:slug', () => {
    let createdDrug: Drug

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/drugs')
        .send(testDrug)

      createdDrug = response.body
    })

    it('should return drug by slug', async () => {
      const response = await request(app.getHttpServer())
        .get(`/drugs/slug/${testDrug.slug}`)
        .expect(200)

      expect(response.body).toMatchObject({
        id: createdDrug.id,
        name: testDrug.name,
        slug: testDrug.slug
      })
    })

    it('should return 404 for non-existent slug', async () => {
      await request(app.getHttpServer())
        .get('/drugs/slug/non-existent-slug')
        .expect(404)
    })
  })

  describe('PUT /drugs/:id', () => {
    let createdDrug: Drug

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/drugs')
        .send(testDrug)

      createdDrug = response.body
    })

    it('should update drug', async () => {
      const updates = {
        name: 'Updated Test Drug',
        aiEnhancedDescription: 'Updated description'
      }

      const response = await request(app.getHttpServer())
        .put(`/drugs/${createdDrug.id}`)
        .send(updates)
        .expect(200)

      expect(response.body).toMatchObject({
        id: createdDrug.id,
        name: updates.name,
        aiEnhancedDescription: updates.aiEnhancedDescription
      })
      expect(response.body.updatedAt).not.toBe(createdDrug.updatedAt)
    })

    it('should return 404 for non-existent drug', async () => {
      await request(app.getHttpServer())
        .put('/drugs/non-existent-id')
        .send({ name: 'Updated Name' })
        .expect(404)
    })
  })

  describe('DELETE /drugs/:id', () => {
    let createdDrug: Drug

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/drugs')
        .send(testDrug)

      createdDrug = response.body
    })

    it('should delete drug and associated FAQs', async () => {
      // Add FAQs
      await prisma.drugFAQ.create({
        data: {
          ...testFAQs[0],
          drugId: createdDrug.id
        }
      })

      await request(app.getHttpServer())
        .delete(`/drugs/${createdDrug.id}`)
        .expect(200)

      // Verify drug is deleted
      await request(app.getHttpServer())
        .get(`/drugs/${createdDrug.id}`)
        .expect(404)

      // Verify FAQs are deleted
      const faqs = await prisma.drugFAQ.findMany({
        where: { drugId: createdDrug.id }
      })
      expect(faqs).toHaveLength(0)
    })

    it('should return 404 for non-existent drug', async () => {
      await request(app.getHttpServer())
        .delete('/drugs/non-existent-id')
        .expect(404)
    })
  })

  describe('POST /drugs/process-fda-label', () => {
    const fdaLabelData = {
      meta: {},
      results: [{
        brand_name: ['Integration Test Drug'],
        generic_name: ['integration-test-generic'],
        manufacturer_name: ['Integration Pharma'],
        indications_and_usage: ['For integration testing'],
        contraindications: ['None for testing'],
        warnings: ['Test warnings only'],
        dosage_and_administration: ['As directed for tests']
      }]
    }

    it('should process FDA label data successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/drugs/process-fda-label')
        .send(fdaLabelData)
        .expect(201)

      expect(response.body).toMatchObject({
        name: 'Integration Test Drug',
        genericName: 'integration-test-generic',
        manufacturer: 'Integration Pharma'
      })
      expect(response.body.id).toBeDefined()
    })

    it('should validate FDA label structure', async () => {
      const invalidLabel = {
        meta: {},
        results: [] // Empty results
      }

      await request(app.getHttpServer())
        .post('/drugs/process-fda-label')
        .send(invalidLabel)
        .expect(400)
    })
  })

  describe('GET /drugs/search', () => {
    beforeEach(async () => {
      // Create test drugs for search
      const drugs = [
        { ...testDrug, name: 'Aspirin', slug: 'aspirin', genericName: 'acetylsalicylic acid' },
        { ...testDrug, name: 'Ibuprofen', slug: 'ibuprofen', genericName: 'ibuprofen' },
        { ...testDrug, name: 'Acetaminophen', slug: 'acetaminophen', genericName: 'acetaminophen' }
      ]

      for (const drug of drugs) {
        await request(app.getHttpServer())
          .post('/drugs')
          .send(drug)
      }
    })

    it('should search drugs by name', async () => {
      const response = await request(app.getHttpServer())
        .get('/drugs/search?query=aspirin')
        .expect(200)

      expect(response.body).toHaveLength(1)
      expect(response.body[0].name).toBe('Aspirin')
    })

    it('should search drugs by generic name', async () => {
      const response = await request(app.getHttpServer())
        .get('/drugs/search?query=acetylsalicylic')
        .expect(200)

      expect(response.body).toHaveLength(1)
      expect(response.body[0].genericName).toBe('acetylsalicylic acid')
    })

    it('should return empty array for no matches', async () => {
      const response = await request(app.getHttpServer())
        .get('/drugs/search?query=nonexistentdrug')
        .expect(200)

      expect(response.body).toHaveLength(0)
    })

    it('should require query parameter', async () => {
      await request(app.getHttpServer())
        .get('/drugs/search')
        .expect(400)
    })

    it('should limit search results', async () => {
      const response = await request(app.getHttpServer())
        .get('/drugs/search?query=a&limit=2')
        .expect(200)

      expect(response.body.length).toBeLessThanOrEqual(2)
    })
  })

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // This test would require mocking Prisma to simulate connection failure
      // For now, we'll test with a malformed request that would cause a DB error
      
      await request(app.getHttpServer())
        .post('/drugs')
        .send({
          name: 'Test Drug',
          // Invalid foreign key reference that would cause DB error
          someInvalidField: 'invalid-reference-id'
        })
        .expect(400)
    })

    it('should handle validation errors with proper error messages', async () => {
      const response = await request(app.getHttpServer())
        .post('/drugs')
        .send({
          // Missing required name field
          genericName: 'test'
        })
        .expect(400)

      expect(response.body.message).toContain('validation')
    })
  })

  describe('Performance Tests', () => {
    it('should handle bulk drug creation efficiently', async () => {
      const startTime = Date.now()
      const promises = []

      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app.getHttpServer())
            .post('/drugs')
            .send({
              ...testDrug,
              name: `Bulk Drug ${i}`,
              slug: `bulk-drug-${i}`
            })
        )
      }

      await Promise.all(promises)
      const endTime = Date.now()

      expect(endTime - startTime).toBeLessThan(5000) // Should complete in under 5 seconds
      
      // Verify all drugs were created
      const response = await request(app.getHttpServer())
        .get('/drugs')
        .expect(200)

      expect(response.body).toHaveLength(10)
    })

    it('should handle large search queries efficiently', async () => {
      const startTime = Date.now()

      await request(app.getHttpServer())
        .get('/drugs/search?query=test')
        .expect(200)

      const endTime = Date.now()
      expect(endTime - startTime).toBeLessThan(1000) // Should respond in under 1 second
    })
  })
})