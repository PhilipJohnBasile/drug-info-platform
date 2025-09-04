#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client'

interface DemoSeedData {
  name: string
  genericName: string
  fdaBrandName: string
  brandNames: string[]
  manufacturer: string
  route: string
  indications: string
  contraindications: string
  warnings: string
  boxedWarning?: string
  dosageInfo: string
  adverseReactions: string
  aiEnhancedTitle: string
  aiEnhancedDescription: string
  seoMetaTitle: string
  seoMetaDescription: string
  published: boolean
  faqs: Array<{
    question: string
    answer: string
  }>
}

const DEMO_DRUGS: DemoSeedData[] = [
  {
    name: 'Lisinopril',
    genericName: 'lisinopril',
    fdaBrandName: 'Prinivil',
    brandNames: ['Zestril', 'Qbrelis'],
    manufacturer: 'Merck & Co., Inc.',
    route: 'oral',
    indications: 'Lisinopril is an ACE inhibitor used to treat high blood pressure (hypertension) and heart failure. It helps relax blood vessels, making it easier for the heart to pump blood throughout the body.',
    contraindications: 'Hypersensitivity to lisinopril or any other ACE inhibitor. History of angioedema related to previous treatment with an ACE inhibitor. Concomitant use with aliskiren in patients with diabetes.',
    warnings: 'Can cause serious side effects including angioedema (swelling of face, lips, tongue, or throat), kidney problems, liver problems, and low blood pressure. May cause harm to unborn baby when used during pregnancy.',
    boxedWarning: undefined,
    dosageInfo: 'For hypertension: Initial dose 10 mg once daily. Maintenance dose: 20-40 mg once daily. For heart failure: Initial dose 5 mg once daily. Target dose: 20-35 mg once daily. Take with or without food.',
    adverseReactions: 'Common side effects include dizziness, headache, fatigue, cough, nausea, diarrhea, upper respiratory tract infection, and chest pain. Serious reactions may include angioedema and severe hypotension.',
    aiEnhancedTitle: 'Lisinopril (Prinivil, Zestril) - Blood Pressure Medication Guide',
    aiEnhancedDescription: 'Lisinopril is a widely prescribed ACE inhibitor that helps lower blood pressure and treat heart failure. It works by relaxing blood vessels, making it easier for your heart to pump blood effectively throughout your body.',
    seoMetaTitle: 'Lisinopril Guide: Uses, Dosage, Side Effects | Drug Information',
    seoMetaDescription: 'Complete guide to Lisinopril (Prinivil, Zestril) - ACE inhibitor for high blood pressure and heart failure. Learn about dosage, side effects, precautions.',
    published: true,
    faqs: [
      {
        question: 'What is Lisinopril used for?',
        answer: 'Lisinopril is primarily used to treat high blood pressure (hypertension) and heart failure. It belongs to a class of medications called ACE inhibitors, which help relax blood vessels and reduce the workload on your heart.'
      },
      {
        question: 'How should I take Lisinopril?',
        answer: 'Take Lisinopril exactly as prescribed by your doctor, usually once daily. You can take it with or without food. It\'s important to take it at the same time each day and not to skip doses, even if you feel well.'
      },
      {
        question: 'What are the common side effects?',
        answer: 'Common side effects include dizziness, headache, fatigue, and a dry cough. Most people tolerate Lisinopril well. Contact your doctor if you experience severe dizziness, swelling of face or throat, or persistent cough.'
      },
      {
        question: 'Can I drink alcohol while taking Lisinopril?',
        answer: 'Alcohol can increase the blood pressure-lowering effects of Lisinopril, potentially causing dizziness or fainting. It\'s best to limit alcohol consumption and discuss with your doctor about safe limits.'
      },
      {
        question: 'What should I do if I miss a dose?',
        answer: 'If you miss a dose, take it as soon as you remember. However, if it\'s almost time for your next dose, skip the missed dose and continue with your regular schedule. Never take two doses at once.'
      }
    ]
  },
  {
    name: 'Metformin',
    genericName: 'metformin hydrochloride',
    fdaBrandName: 'Glucophage',
    brandNames: ['Fortamet', 'Glumetza', 'Riomet'],
    manufacturer: 'Bristol Myers Squibb',
    route: 'oral',
    indications: 'Metformin is used to treat type 2 diabetes mellitus. It helps control blood sugar levels by decreasing glucose production in the liver and improving insulin sensitivity.',
    contraindications: 'Severe kidney disease, metabolic acidosis, diabetic ketoacidosis. Hypersensitivity to metformin. Severe liver disease or acute alcohol intoxication.',
    warnings: 'Risk of lactic acidosis, especially in patients with kidney or liver problems. May cause vitamin B12 deficiency with long-term use. Use with caution in elderly patients.',
    boxedWarning: 'Lactic acidosis is a rare but serious complication that can occur due to metformin accumulation. Risk increases with conditions such as sepsis, dehydration, excess alcohol intake, hepatic impairment, renal impairment, and acute congestive heart failure.',
    dosageInfo: 'Initial: 500 mg twice daily with meals or 850 mg once daily with breakfast. Maintenance: 1500-2550 mg daily in divided doses. Extended-release: 500-2000 mg once daily with evening meal.',
    adverseReactions: 'Most common side effects include nausea, vomiting, diarrhea, abdominal pain, loss of appetite, and metallic taste. May cause vitamin B12 deficiency with prolonged use.',
    aiEnhancedTitle: 'Metformin (Glucophage) - Type 2 Diabetes Treatment Guide',
    aiEnhancedDescription: 'Metformin is the most commonly prescribed medication for type 2 diabetes. It helps control blood sugar by reducing glucose production in the liver and improving how your body responds to insulin.',
    seoMetaTitle: 'Metformin Guide: Diabetes Treatment, Dosage, Side Effects',
    seoMetaDescription: 'Comprehensive Metformin guide for type 2 diabetes. Learn about proper dosage, side effects, precautions, and how this medication helps control blood sugar.',
    published: true,
    faqs: [
      {
        question: 'How does Metformin work for diabetes?',
        answer: 'Metformin works in three main ways: it reduces the amount of glucose your liver produces, decreases glucose absorption in your intestines, and improves your body\'s sensitivity to insulin, helping your cells use glucose more effectively.'
      },
      {
        question: 'When should I take Metformin?',
        answer: 'Take Metformin with meals to reduce stomach upset. If you\'re taking it twice daily, take it with breakfast and dinner. Extended-release formulations are usually taken once daily with the evening meal.'
      },
      {
        question: 'What are the serious side effects to watch for?',
        answer: 'The most serious side effect is lactic acidosis, which is rare but can be life-threatening. Signs include muscle pain, difficulty breathing, stomach pain, dizziness, and unusual tiredness. Seek immediate medical attention if these occur.'
      },
      {
        question: 'Can Metformin cause low blood sugar?',
        answer: 'Metformin alone typically doesn\'t cause low blood sugar (hypoglycemia). However, when combined with other diabetes medications like insulin or sulfonylureas, the risk of low blood sugar increases.'
      },
      {
        question: 'Do I need to monitor anything while taking Metformin?',
        answer: 'Your doctor will regularly monitor your blood sugar levels, kidney function, and vitamin B12 levels. Long-term Metformin use can sometimes lead to B12 deficiency, which may require supplementation.'
      }
    ]
  },
  {
    name: 'Atorvastatin',
    genericName: 'atorvastatin calcium',
    fdaBrandName: 'Lipitor',
    brandNames: [],
    manufacturer: 'Pfizer Inc.',
    route: 'oral',
    indications: 'Atorvastatin is used to lower cholesterol and triglyceride levels in the blood. It helps reduce the risk of heart attack, stroke, and other cardiovascular complications in people with or at risk for heart disease.',
    contraindications: 'Active liver disease, unexplained persistent elevations of serum transaminases, hypersensitivity to atorvastatin, pregnancy, and nursing mothers.',
    warnings: 'May cause muscle problems including myopathy and rhabdomyolysis. Liver enzyme monitoring required. May increase blood sugar levels. Use with caution in patients with history of liver disease.',
    boxedWarning: undefined,
    dosageInfo: 'Starting dose: 10-20 mg once daily. Range: 10-80 mg once daily. Take at any time of day, with or without food. Maximum dose: 80 mg daily.',
    adverseReactions: 'Common side effects include muscle pain, joint pain, diarrhea, upper respiratory tract infection, and nasopharyngitis. Serious reactions include myopathy, rhabdomyolysis, and liver problems.',
    aiEnhancedTitle: 'Atorvastatin (Lipitor) - Cholesterol Lowering Medication Guide',
    aiEnhancedDescription: 'Atorvastatin is a statin medication that effectively lowers cholesterol and reduces cardiovascular risk. It works by blocking an enzyme your liver needs to make cholesterol, helping prevent heart attacks and strokes.',
    seoMetaTitle: 'Atorvastatin Guide: Cholesterol Treatment, Dosage, Side Effects',
    seoMetaDescription: 'Complete Atorvastatin (Lipitor) guide for cholesterol management. Learn about dosage, side effects, drug interactions, and cardiovascular benefits.',
    published: true,
    faqs: [
      {
        question: 'How does Atorvastatin lower cholesterol?',
        answer: 'Atorvastatin works by blocking HMG-CoA reductase, an enzyme your liver uses to make cholesterol. This reduces cholesterol production and forces your liver to remove cholesterol from your blood, lowering overall cholesterol levels.'
      },
      {
        question: 'When should I take Atorvastatin?',
        answer: 'You can take Atorvastatin at any time of day, with or without food. Many people prefer taking it in the evening, but the most important thing is to take it at the same time each day consistently.'
      },
      {
        question: 'What should I know about muscle pain while taking this medication?',
        answer: 'Muscle pain or weakness can be a side effect of Atorvastatin. While usually mild, it can rarely lead to a serious condition called rhabdomyolysis. Contact your doctor immediately if you experience unexplained muscle pain, tenderness, or weakness.'
      },
      {
        question: 'Can I eat grapefruit while taking Atorvastatin?',
        answer: 'Grapefruit and grapefruit juice can increase Atorvastatin levels in your blood, raising the risk of side effects. It\'s best to avoid grapefruit products or discuss with your doctor about safe amounts.'
      },
      {
        question: 'How long does it take to see results?',
        answer: 'Cholesterol levels typically begin to improve within 2 weeks of starting Atorvastatin, with maximum effects usually seen within 4-6 weeks. Your doctor will monitor your cholesterol levels regularly to assess effectiveness.'
      }
    ]
  },
  {
    name: 'Sertraline',
    genericName: 'sertraline hydrochloride',
    fdaBrandName: 'Zoloft',
    brandNames: [],
    manufacturer: 'Pfizer Inc.',
    route: 'oral',
    indications: 'Sertraline is used to treat major depressive disorder, obsessive-compulsive disorder, panic disorder, social anxiety disorder, post-traumatic stress disorder, and premenstrual dysphoric disorder.',
    contraindications: 'Concomitant use with MAOIs or within 14 days of discontinuing MAOIs. Concomitant use with pimozide. Hypersensitivity to sertraline.',
    warnings: 'Increased risk of suicidal thinking and behavior in children, adolescents, and young adults. May cause serotonin syndrome when combined with other serotonergic drugs. Withdrawal symptoms may occur.',
    boxedWarning: 'Increased risk of suicidal thinking and behavior in children, adolescents, and young adults taking antidepressants for major depressive disorder and other psychiatric disorders.',
    dosageInfo: 'Depression/OCD: Initial 50 mg once daily. Range: 50-200 mg daily. Panic disorder: Initial 25 mg daily for one week, then 50 mg daily. Take with or without food, preferably in the morning.',
    adverseReactions: 'Common side effects include nausea, diarrhea, insomnia, dizziness, drowsiness, dry mouth, loss of appetite, sweating, and sexual side effects.',
    aiEnhancedTitle: 'Sertraline (Zoloft) - Antidepressant Medication Guide',
    aiEnhancedDescription: 'Sertraline is an SSRI antidepressant used to treat depression, anxiety disorders, and other mental health conditions. It works by increasing serotonin levels in the brain to improve mood and emotional well-being.',
    seoMetaTitle: 'Sertraline Guide: Depression Treatment, Dosage, Side Effects',
    seoMetaDescription: 'Comprehensive Sertraline (Zoloft) guide for depression and anxiety. Learn about proper dosage, side effects, precautions, and what to expect during treatment.',
    published: true,
    faqs: [
      {
        question: 'How long does it take for Sertraline to work?',
        answer: 'While some people may notice improvements in sleep, energy, or appetite within the first 1-2 weeks, it typically takes 4-6 weeks to feel the full antidepressant effects of Sertraline. Don\'t stop taking it if you don\'t feel better immediately.'
      },
      {
        question: 'Should I take Sertraline in the morning or evening?',
        answer: 'Sertraline can be taken at any time, but many doctors recommend taking it in the morning because it can sometimes cause insomnia. If it makes you drowsy, you can take it in the evening. Choose a consistent time each day.'
      },
      {
        question: 'What should I do if I want to stop taking Sertraline?',
        answer: 'Never stop Sertraline suddenly. Work with your doctor to gradually reduce your dose over several weeks to avoid withdrawal symptoms like dizziness, flu-like symptoms, and "brain zaps." This process is called tapering.'
      },
      {
        question: 'Can Sertraline affect my sexual function?',
        answer: 'Sexual side effects are common with Sertraline, including decreased libido, difficulty reaching orgasm, or erectile dysfunction. These effects are usually temporary and may improve over time. Discuss any concerns with your doctor.'
      },
      {
        question: 'Is it safe to drink alcohol while taking Sertraline?',
        answer: 'While alcohol doesn\'t interact dangerously with Sertraline, it can worsen depression and anxiety symptoms and increase side effects like drowsiness. It\'s best to limit or avoid alcohol while taking this medication.'
      }
    ]
  },
  {
    name: 'Omeprazole',
    genericName: 'omeprazole',
    fdaBrandName: 'Prilosec',
    brandNames: ['Losec'],
    manufacturer: 'AstraZeneca',
    route: 'oral',
    indications: 'Omeprazole is used to treat gastroesophageal reflux disease (GERD), stomach and duodenal ulcers, and conditions where the stomach produces too much acid such as Zollinger-Ellison syndrome.',
    contraindications: 'Hypersensitivity to omeprazole or any component of the formulation. Concomitant use with rilpivirine-containing products.',
    warnings: 'Long-term use may increase risk of bone fractures, vitamin B12 deficiency, hypomagnesemia, and C. diff-associated diarrhea. May mask symptoms of gastric malignancy.',
    boxedWarning: undefined,
    dosageInfo: 'GERD: 20 mg once daily for 4-8 weeks. Ulcers: 20-40 mg once daily. Take before eating, preferably in the morning. Swallow capsules whole, do not crush or chew.',
    adverseReactions: 'Common side effects include headache, abdominal pain, nausea, diarrhea, flatulence, and dizziness. Long-term use may lead to vitamin deficiencies and increased infection risk.',
    aiEnhancedTitle: 'Omeprazole (Prilosec) - Acid Reflux and Ulcer Treatment Guide',
    aiEnhancedDescription: 'Omeprazole is a proton pump inhibitor that reduces stomach acid production. It\'s commonly used to treat acid reflux, GERD, and stomach ulcers by blocking the acid-producing pumps in your stomach.',
    seoMetaTitle: 'Omeprazole Guide: GERD Treatment, Dosage, Side Effects',
    seoMetaDescription: 'Complete Omeprazole (Prilosec) guide for acid reflux and ulcer treatment. Learn about proper dosage, side effects, and long-term use considerations.',
    published: true,
    faqs: [
      {
        question: 'How does Omeprazole work for acid reflux?',
        answer: 'Omeprazole is a proton pump inhibitor (PPI) that works by blocking the pumps in your stomach that produce acid. This dramatically reduces the amount of acid your stomach makes, allowing damaged tissue to heal and preventing further irritation.'
      },
      {
        question: 'When should I take Omeprazole for best results?',
        answer: 'Take Omeprazole before eating, preferably in the morning before breakfast. This allows the medication to be most effective when your stomach starts producing acid in response to food. Swallow the capsules whole - don\'t crush or chew them.'
      },
      {
        question: 'How long can I safely take Omeprazole?',
        answer: 'For most conditions, Omeprazole is prescribed for 4-8 weeks initially. Long-term use (more than a year) may increase risks of bone fractures, vitamin deficiencies, and infections. Your doctor will determine if continued use is necessary.'
      },
      {
        question: 'Are there foods I should avoid while taking Omeprazole?',
        answer: 'While there are no specific food restrictions, it\'s helpful to avoid trigger foods that worsen acid reflux, such as spicy foods, citrus, tomatoes, chocolate, caffeine, and alcohol. Eating smaller meals can also help reduce symptoms.'
      },
      {
        question: 'What should I know about stopping Omeprazole?',
        answer: 'Don\'t stop Omeprazole suddenly after long-term use, as this can cause "rebound" acid production, making symptoms worse than before. Your doctor may recommend gradually reducing the dose or switching to a less powerful acid reducer.'
      }
    ]
  }
]

class SimpleDemoSeeder {
  private prisma: PrismaClient

  constructor() {
    this.prisma = new PrismaClient()
  }

  async seed() {
    console.log('🌱 Starting demo database seeding...')
    
    try {
      // Connect to database
      await this.prisma.$connect()
      
      // Clear existing data
      await this.clearData()
      
      // Seed demo drugs
      for (const drugData of DEMO_DRUGS) {
        console.log(`  Creating drug: ${drugData.name}`)
        await this.createDrug(drugData)
      }
      
      // Generate summary
      await this.generateSummary()
      
      console.log('✅ Demo seeding completed successfully!')
    } catch (error) {
      console.error('❌ Demo seeding failed:', error)
      throw error
    } finally {
      await this.prisma.$disconnect()
    }
  }

  private async clearData() {
    console.log('  Clearing existing data...')
    await this.prisma.drugFAQ.deleteMany({})
    await this.prisma.drug.deleteMany({})
  }

  private async createDrug(drugData: DemoSeedData) {
    const { faqs, ...drugFields } = drugData
    
    // Generate slug
    const slug = drugFields.name
      .toLowerCase()
      .replace(/[^a-z0-9\\s-]/g, '')
      .replace(/\\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    // Create drug record
    const drug = await this.prisma.drug.create({
      data: {
        ...drugFields,
        slug,
        fdaLabelData: {},
      },
    })

    // Create FAQs
    if (faqs && faqs.length > 0) {
      for (const faq of faqs) {
        await this.prisma.drugFAQ.create({
          data: {
            drugId: drug.id,
            question: faq.question,
            answer: faq.answer,
          },
        })
      }
    }

    console.log(`    ✓ Created ${drugFields.name} with ${faqs.length} FAQs`)
  }

  private async generateSummary() {
    const drugCount = await this.prisma.drug.count()
    const faqCount = await this.prisma.drugFAQ.count()
    const publishedCount = await this.prisma.drug.count({ where: { published: true } })
    
    console.log('📊 Demo Seeding Summary:')
    console.log(`   Total drugs: ${drugCount}`)
    console.log(`   Published drugs: ${publishedCount}`)
    console.log(`   Total FAQs: ${faqCount}`)
    console.log(`   Average FAQs per drug: ${drugCount > 0 ? (faqCount / drugCount).toFixed(1) : '0'}`)
    
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
    
    console.log('\\n🏥 Created Drug Pages:')
    drugs.forEach((drug, index) => {
      const title = drug.aiEnhancedTitle || drug.name
      console.log(`   ${index + 1}. ${title} (/${drug.slug}) - ${drug._count.faqs} FAQs`)
    })
    
    console.log(`\\n🌐 Demo URLs:`)
    console.log(`   Frontend: http://localhost:3000`)
    console.log(`   Search: http://localhost:3000/search`)
    drugs.slice(0, 3).forEach((drug) => {
      console.log(`   Drug: http://localhost:3000/drugs/${drug.slug}`)
    })
  }
}

// Main execution
async function main() {
  const seeder = new SimpleDemoSeeder()
  
  try {
    await seeder.seed()
    process.exit(0)
  } catch (error) {
    console.error('Seeding failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}