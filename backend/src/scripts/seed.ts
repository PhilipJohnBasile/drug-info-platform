#!/usr/bin/env ts-node

import { NestFactory } from '@nestjs/core'
import { Logger } from '@nestjs/common'
import { AppModule } from '../app.module'
import { PrismaService } from '../prisma/prisma.service'
import { DrugsService } from '../drugs/drugs.service'
import { AiServiceService } from '../ai-service/ai-service.service'
import * as fs from 'fs'
import * as path from 'path'

interface FDALabelData {
  meta: any
  results: Array<{
    application_number?: string[]
    brand_name?: string[]
    generic_name?: string[]
    manufacturer_name?: string[]
    product_ndc?: string[]
    product_type?: string[]
    route?: string[]
    substance_name?: string[]
    rxcui?: string[]
    spl_id?: string[]
    package_ndc?: string[]
    description?: string[]
    purpose?: string[]
    active_ingredient?: string[]
    inactive_ingredient?: string[]
    indications_and_usage?: string[]
    dosage_and_administration?: string[]
    contraindications?: string[]
    warnings?: string[]
    boxed_warning?: string[]
    adverse_reactions?: string[]
    drug_interactions?: string[]
    pregnancy?: string[]
    pediatric_use?: string[]
    geriatric_use?: string[]
    overdosage?: string[]
    clinical_pharmacology?: string[]
  }>
}

class DataSeeder {
  private readonly logger = new Logger(DataSeeder.name)
  private app: any
  private prisma: PrismaService
  private drugsService: DrugsService
  private aiService: AiServiceService

  async initialize() {
    this.logger.log('Initializing NestJS application...')
    this.app = await NestFactory.createApplicationContext(AppModule)
    this.prisma = this.app.get(PrismaService)
    this.drugsService = this.app.get(DrugsService)
    this.aiService = this.app.get(AiServiceService)
  }

  async cleanup() {
    if (this.app) {
      await this.app.close()
    }
  }

  async seedDatabase() {
    this.logger.log('🌱 Starting database seeding...')
    
    try {
      // Clear existing data
      await this.clearExistingData()
      
      // Load and process FDA label files
      const fdaLabels = await this.loadFDALabels()
      this.logger.log(`Found ${fdaLabels.length} FDA label files`)
      
      // Process each drug
      for (let i = 0; i < fdaLabels.length; i++) {
        const { filename, data } = fdaLabels[i]
        this.logger.log(`Processing drug ${i + 1}/${fdaLabels.length}: ${filename}`)
        
        try {
          await this.processDrug(data, filename)
        } catch (error) {
          this.logger.error(`Failed to process ${filename}:`, error.message)
        }
      }
      
      // Generate summary
      await this.generateSummary()
      
      this.logger.log('✅ Database seeding completed successfully!')
      
    } catch (error) {
      this.logger.error('❌ Database seeding failed:', error)
      throw error
    }
  }

  private async clearExistingData() {
    this.logger.log('Clearing existing drug data...')
    
    await this.prisma.drugFAQ.deleteMany({})
    await this.prisma.drug.deleteMany({})
    
    this.logger.log('Existing data cleared')
  }

  private async loadFDALabels(): Promise<Array<{ filename: string; data: FDALabelData }>> {
    const dataDir = path.join(process.cwd(), '..', 'data', 'fda-labels')
    const files: Array<{ filename: string; data: FDALabelData }> = []
    
    if (!fs.existsSync(dataDir)) {
      throw new Error(`FDA labels directory not found: ${dataDir}`)
    }
    
    const filenames = fs.readdirSync(dataDir).filter(file => file.endsWith('.json'))
    
    for (const filename of filenames) {
      const filePath = path.join(dataDir, filename)
      const rawData = fs.readFileSync(filePath, 'utf-8')
      const data = JSON.parse(rawData) as FDALabelData
      
      files.push({ filename, data })
    }
    
    return files
  }

  private async processDrug(fdaData: FDALabelData, filename: string) {
    if (!fdaData.results || fdaData.results.length === 0) {
      throw new Error('No results found in FDA data')
    }
    
    const fdaResult = fdaData.results[0]
    const drugName = this.getFirstValue(fdaResult.brand_name) || 
                    this.getFirstValue(fdaResult.generic_name) || 
                    filename.replace('.json', '')
    
    this.logger.log(`  Processing: ${drugName}`)
    
    // Create basic drug record
    const drugData = {
      name: drugName,
      genericName: this.getFirstValue(fdaResult.generic_name),
      fdaGenericName: this.getFirstValue(fdaResult.generic_name),
      fdaBrandName: this.getFirstValue(fdaResult.brand_name),
      brandNames: fdaResult.brand_name?.slice(1) || [],
      manufacturer: this.getFirstValue(fdaResult.manufacturer_name),
      route: this.getFirstValue(fdaResult.route)?.toLowerCase(),
      indications: this.getFirstValue(fdaResult.indications_and_usage),
      contraindications: this.getFirstValue(fdaResult.contraindications),
      warnings: this.getFirstValue(fdaResult.warnings),
      boxedWarning: this.getFirstValue(fdaResult.boxed_warning),
      dosageInfo: this.getFirstValue(fdaResult.dosage_and_administration),
      adverseReactions: this.getFirstValue(fdaResult.adverse_reactions),
      fdaLabelData: fdaResult,
      published: true,
      slug: this.generateSlug(drugName),
    }
    
    this.logger.log(`  Creating drug record...`)
    const drug = await this.drugsService.create(drugData)
    
    // Enhanced AI processing
    this.logger.log(`  Enhancing with AI...`)
    const enhanced = await this.aiService.enhanceDrugContent(
      drug.name,
      drug.fdaLabelData as any,
      {
        genericName: drug.genericName,
        brandNames: drug.fdaBrandName ? [drug.fdaBrandName] : [],
        manufacturer: drug.manufacturer,
        indications: drug.indications,
        warnings: drug.warnings,
        route: drug.route
      }
    )
    
    // Update drug with AI enhancements
    await this.drugsService.update(drug.id, {
      aiEnhancedTitle: enhanced.title,
      aiEnhancedDescription: enhanced.description,
      seoMetaTitle: enhanced.seoMetaTitle,
      seoMetaDescription: enhanced.seoMetaDescription,
    })
    
    // Create FAQs
    if (enhanced.faqs && enhanced.faqs.length > 0) {
      this.logger.log(`  Creating ${enhanced.faqs.length} FAQs...`)
      for (const faq of enhanced.faqs) {
        await this.prisma.drugFAQ.create({
          data: {
            drugId: drug.id,
            question: faq.question,
            answer: faq.answer,
          },
        })
      }
    }
    
    this.logger.log(`  ✓ Completed: ${drugName}`)
  }

  private getFirstValue(array?: string[]): string | undefined {
    return array && array.length > 0 ? array[0] : undefined
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  private async generateSummary() {
    const drugCount = await this.prisma.drug.count()
    const faqCount = await this.prisma.drugFAQ.count()
    const publishedCount = await this.prisma.drug.count({ where: { published: true } })
    
    this.logger.log('📊 Seeding Summary:')
    this.logger.log(`   Total drugs: ${drugCount}`)
    this.logger.log(`   Published drugs: ${publishedCount}`)
    this.logger.log(`   Total FAQs: ${faqCount}`)
    this.logger.log(`   Average FAQs per drug: ${drugCount > 0 ? (faqCount / drugCount).toFixed(1) : '0'}`)
    
    // List created drugs
    const drugs = await this.prisma.drug.findMany({
      select: {
        name: true,
        slug: true,
        aiEnhancedTitle: true,
        _count: {
          select: {
            faqs: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })
    
    this.logger.log('\n🏥 Created Drug Pages:')
    drugs.forEach((drug, index) => {
      const title = drug.aiEnhancedTitle || drug.name
      this.logger.log(`   ${index + 1}. ${title} (/${drug.slug}) - ${drug._count.faqs} FAQs`)
    })
    
    this.logger.log(`\n🌐 Demo URLs:`)
    this.logger.log(`   Frontend: http://localhost:3000`)
    this.logger.log(`   Search: http://localhost:3000/search`)
    drugs.slice(0, 3).forEach((drug) => {
      this.logger.log(`   Drug: http://localhost:3000/drugs/${drug.slug}`)
    })
  }
}

// Main execution
async function main() {
  const seeder = new DataSeeder()
  
  try {
    await seeder.initialize()
    await seeder.seedDatabase()
    process.exit(0)
  } catch (error) {
    console.error('Seeding failed:', error)
    process.exit(1)
  } finally {
    await seeder.cleanup()
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { DataSeeder }