#!/usr/bin/env node

import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

// Extract text content from HTML
function extractTextFromHtml(html: string): string {
  if (!html) return ''
  // Remove HTML tags and clean up text
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Create URL-friendly slug
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// Extract key data from FDA label
function processFDALabel(drugData: any) {
  const label = drugData.label || {}
  
  return {
    name: drugData.drugName || 'Unknown Drug',
    genericName: label.genericName || null,
    brandNames: drugData.drugName ? [drugData.drugName] : [],
    slug: drugData.slug || createSlug(drugData.drugName || 'unknown'),
    fdaLabelData: drugData,
    fdaGenericName: label.genericName || null,
    fdaBrandName: drugData.drugName || null,
    manufacturer: drugData.labeler || label.labelerName || null,
    route: null, // This would need to be extracted from dosage info
    indications: extractTextFromHtml(label.indicationsAndUsage || ''),
    contraindications: null, // Would need to be extracted from other sections
    warnings: extractTextFromHtml(label.warningsAndPrecautions || ''),
    boxedWarning: null, // Would need to be extracted from warnings
    dosageInfo: extractTextFromHtml(label.dosageAndAdministration || ''),
    adverseReactions: extractTextFromHtml(label.adverseReactions || ''),
    published: true
  }
}

async function seedFDAData() {
  try {
    console.log('🌱 Starting FDA data seeding...')
    
    // Read the Labels.json file
    const labelsPath = join(process.cwd(), 'Labels.json')
    console.log('📁 Reading FDA labels from:', labelsPath)
    
    const labelsData = JSON.parse(readFileSync(labelsPath, 'utf8'))
    console.log(`📊 Found ${labelsData.length} drugs to process`)
    
    // Clear existing data
    console.log('🗑️  Clearing existing data...')
    await prisma.drugFAQ.deleteMany()
    await prisma.drug.deleteMany()
    
    // Process each drug
    for (let i = 0; i < labelsData.length; i++) {
      const drugData = labelsData[i]
      console.log(`\n📋 Processing drug ${i + 1}/${labelsData.length}: ${drugData.drugName}`)
      
      const processedData = processFDALabel(drugData)
      
      try {
        // Create drug record
        const drug = await prisma.drug.create({
          data: processedData
        })
        
        console.log(`✅ Created drug: ${drug.name} (${drug.id})`)
        
        // Create sample FAQs for each drug
        const sampleFAQs = [
          {
            question: `What is ${drug.name} used for?`,
            answer: processedData.indications 
              ? processedData.indications.substring(0, 500) + '...'
              : `${drug.name} is a prescription medication. Please consult your healthcare provider for specific uses and indications.`,
            drugId: drug.id
          },
          {
            question: `How should I take ${drug.name}?`,
            answer: processedData.dosageInfo
              ? processedData.dosageInfo.substring(0, 500) + '...'
              : `Follow your healthcare provider's instructions for taking ${drug.name}. Do not adjust dosage without medical supervision.`,
            drugId: drug.id
          },
          {
            question: `What are the side effects of ${drug.name}?`,
            answer: processedData.adverseReactions
              ? processedData.adverseReactions.substring(0, 500) + '...'
              : `Contact your healthcare provider if you experience any unusual symptoms while taking ${drug.name}.`,
            drugId: drug.id
          }
        ]
        
        // Create FAQs
        for (const faq of sampleFAQs) {
          await prisma.drugFAQ.create({ data: faq })
        }
        
        console.log(`📝 Created ${sampleFAQs.length} FAQs for ${drug.name}`)
        
      } catch (error) {
        console.error(`❌ Error creating drug ${drugData.drugName}:`, error)
      }
    }
    
    console.log('\n🎉 FDA data seeding completed!')
    
    // Show summary
    const totalDrugs = await prisma.drug.count()
    const totalFAQs = await prisma.drugFAQ.count()
    
    console.log('\n📊 Database Summary:')
    console.log(`   Drugs: ${totalDrugs}`)
    console.log(`   FAQs: ${totalFAQs}`)
    
  } catch (error) {
    console.error('💥 Seeding failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedFDAData()
}

export { seedFDAData }