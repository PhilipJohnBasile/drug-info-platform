#!/usr/bin/env ts-node

import { NestFactory } from '@nestjs/core'
import { Logger } from '@nestjs/common'
import { AppModule } from '../app.module'
import { PrismaService } from '../prisma/prisma.service'

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

class DemoSeeder {
  private readonly logger = new Logger(DemoSeeder.name)
  private app: any
  private prisma: PrismaService

  private demoData: DemoSeedData[] = [
    {
      name: 'Lisinopril',
      genericName: 'lisinopril',
      fdaBrandName: 'Prinivil',
      brandNames: ['Prinivil', 'Zestril'],
      manufacturer: 'Pfizer',
      route: 'oral',
      indications: 'Treatment of hypertension (high blood pressure) and heart failure. Also used after heart attack to improve survival and prevent complications.',
      contraindications: 'Hypersensitivity to ACE inhibitors, history of angioedema related to previous ACE inhibitor treatment, hereditary or idiopathic angioedema.',
      warnings: 'May cause dizziness, especially when getting up from sitting or lying position. Can cause hyperkalemia (high potassium). May impair kidney function. Should not be used during pregnancy.',
      dosageInfo: 'Initial dose: 10mg once daily. Maintenance dose: 20-40mg once daily. Maximum dose: 80mg daily. Take with or without food, preferably at the same time each day.',
      adverseReactions: 'Common: Dry cough (10-15%), dizziness, headache, fatigue. Serious but rare: Angioedema, severe hypotension, kidney problems, hyperkalemia.',
      aiEnhancedTitle: 'Lisinopril - ACE Inhibitor for Blood Pressure & Heart Health',
      aiEnhancedDescription: 'Lisinopril is a highly effective ACE inhibitor that helps lower blood pressure by relaxing blood vessels and reducing the workload on your heart. It\'s widely prescribed for hypertension and heart failure, with proven benefits for long-term cardiovascular health. Most patients tolerate it well, though a dry cough is a common side effect that usually resolves when switching medications.',
      seoMetaTitle: 'Lisinopril: Uses, Dosage, Side Effects & Interactions Guide',
      seoMetaDescription: 'Complete guide to Lisinopril (Prinivil, Zestril). Learn about uses for blood pressure, heart failure, dosing, side effects, and important safety information.',
      published: true,
      faqs: [
        {
          question: 'How long does it take for Lisinopril to start working?',
          answer: 'Lisinopril typically begins to lower blood pressure within 1-2 hours of taking the first dose, but it may take 2-4 weeks to see the full blood pressure-lowering effect. For heart failure, improvement may take several weeks to months.'
        },
        {
          question: 'Why does Lisinopril cause a dry cough?',
          answer: 'About 10-15% of people taking Lisinopril develop a dry, persistent cough. This happens because ACE inhibitors increase levels of bradykinin, which can irritate the airways. The cough is harmless but bothersome, and usually goes away within 1-4 weeks after stopping the medication.'
        },
        {
          question: 'Can I drink alcohol while taking Lisinopril?',
          answer: 'You should limit alcohol consumption while taking Lisinopril. Alcohol can enhance the blood pressure-lowering effects of the medication, potentially causing dizziness, lightheadedness, or fainting, especially when standing up.'
        },
        {
          question: 'What should I do if I miss a dose of Lisinopril?',
          answer: 'Take the missed dose as soon as you remember, unless it\'s almost time for your next dose. Don\'t double up on doses. If you frequently forget doses, consider setting a daily reminder or using a pill organizer.'
        },
        {
          question: 'Can Lisinopril be taken during pregnancy?',
          answer: 'No, Lisinopril should not be taken during pregnancy, especially during the second and third trimesters, as it can cause serious harm to the developing baby. If you\'re planning to become pregnant or discover you\'re pregnant, contact your doctor immediately to discuss alternative treatments.'
        }
      ]
    },
    {
      name: 'Metformin',
      genericName: 'metformin hydrochloride',
      fdaBrandName: 'Glucophage',
      brandNames: ['Glucophage', 'Fortamet', 'Glumetza', 'Riomet'],
      manufacturer: 'Bristol-Myers Squibb',
      route: 'oral',
      indications: 'Type 2 diabetes mellitus as an adjunct to diet and exercise to improve glycemic control. Also used for polycystic ovary syndrome (PCOS) and prevention of diabetes in high-risk individuals.',
      contraindications: 'Severe kidney disease (eGFR <30 mL/min/1.73m²), metabolic acidosis, diabetic ketoacidosis. Temporarily discontinue before iodinated contrast procedures and major surgery.',
      warnings: 'Risk of lactic acidosis (rare but serious). May cause vitamin B12 deficiency with long-term use. Can cause gastrointestinal side effects. Monitor kidney function regularly.',
      dosageInfo: 'Initial: 500mg twice daily with meals. Increase gradually by 500mg weekly. Maximum: 2550mg daily in divided doses. Extended-release: Start 500mg once daily, max 2000mg daily.',
      adverseReactions: 'Very common: Nausea, vomiting, diarrhea, stomach pain, loss of appetite, metallic taste. These usually improve over time. Rare: Lactic acidosis, vitamin B12 deficiency.',
      aiEnhancedTitle: 'Metformin - First-Line Type 2 Diabetes Treatment',
      aiEnhancedDescription: 'Metformin is the gold standard first-line treatment for type 2 diabetes, working by reducing glucose production in the liver and improving insulin sensitivity. Unlike many diabetes medications, it doesn\'t cause weight gain and may even promote modest weight loss. It has an excellent safety profile when used appropriately, with gastrointestinal side effects being the most common issue that typically resolves with continued use.',
      seoMetaTitle: 'Metformin for Diabetes: Complete Guide to Uses & Side Effects',
      seoMetaDescription: 'Comprehensive information about Metformin (Glucophage) for type 2 diabetes. Learn about dosing, side effects, benefits for PCOS, and important safety considerations.',
      published: true,
      faqs: [
        {
          question: 'How does Metformin help with weight loss?',
          answer: 'Metformin can promote modest weight loss (2-6 pounds on average) by reducing appetite, decreasing glucose absorption in the intestines, and improving insulin sensitivity. It\'s not primarily a weight loss medication, but the metabolic improvements often lead to gradual weight reduction.'
        },
        {
          question: 'What are the stomach side effects and how can I minimize them?',
          answer: 'About 25% of people experience nausea, diarrhea, or stomach upset when starting Metformin. To minimize these effects: take with meals, start with a low dose and increase gradually, consider extended-release formulations, and avoid alcohol. Most side effects improve within 2-4 weeks.'
        },
        {
          question: 'Can Metformin cause lactic acidosis and how dangerous is it?',
          answer: 'Lactic acidosis is an extremely rare but serious side effect (about 0.03 cases per 1,000 patient-years). Risk is higher in people with kidney disease, heart failure, or severe illness. Symptoms include muscle pain, breathing problems, stomach pain, and unusual tiredness. Seek immediate medical attention if these occur.'
        },
        {
          question: 'Should I take Metformin if my kidneys aren\'t working perfectly?',
          answer: 'Metformin can be used with mild to moderate kidney impairment, but the dose may need to be reduced. It\'s contraindicated when eGFR is below 30 mL/min/1.73m². Your doctor will monitor your kidney function regularly with blood tests to ensure safe use.'
        },
        {
          question: 'Why do I need to stop Metformin before CT scans with contrast?',
          answer: 'Iodinated contrast agents used in some CT scans can temporarily affect kidney function. Since Metformin is eliminated by the kidneys, there\'s a small risk of the medication accumulating and causing lactic acidosis. You\'ll typically stop it 48 hours before and after the procedure.'
        }
      ]
    },
    {
      name: 'Atorvastatin',
      genericName: 'atorvastatin calcium',
      fdaBrandName: 'Lipitor',
      brandNames: ['Lipitor'],
      manufacturer: 'Pfizer',
      route: 'oral',
      indications: 'Treatment of high cholesterol (hypercholesterolemia) and prevention of cardiovascular events in patients with coronary heart disease or risk factors for coronary heart disease.',
      contraindications: 'Active liver disease, unexplained persistent elevations of serum transaminases, pregnancy, breastfeeding, hypersensitivity to any component.',
      warnings: 'Risk of myopathy and rhabdomyolysis (rare but serious muscle problems). May increase blood sugar levels. Can cause liver enzyme elevations. Avoid grapefruit juice.',
      dosageInfo: 'Starting dose: 10-20mg once daily. Range: 10-80mg daily. Take any time of day, with or without food. For high-risk patients, may start at 40-80mg daily.',
      adverseReactions: 'Common: Muscle aches, headache, nausea, constipation, diarrhea. Rare but serious: Severe muscle problems (myopathy/rhabdomyolysis), liver problems, new-onset diabetes.',
      aiEnhancedTitle: 'Atorvastatin (Lipitor) - Powerful Cholesterol-Lowering Statin',
      aiEnhancedDescription: 'Atorvastatin is one of the most effective and widely prescribed statin medications for lowering cholesterol and preventing heart attacks and strokes. It works by blocking HMG-CoA reductase, the enzyme responsible for cholesterol production in the liver. Clinical studies show it can reduce LDL (bad) cholesterol by 39-60% depending on the dose, making it a cornerstone of cardiovascular disease prevention.',
      seoMetaTitle: 'Atorvastatin (Lipitor): Cholesterol Medication Guide & Side Effects',
      seoMetaDescription: 'Everything about Atorvastatin (Lipitor) for high cholesterol. Learn about effectiveness, dosing, muscle side effects, drug interactions, and heart benefits.',
      published: true,
      faqs: [
        {
          question: 'How much can Atorvastatin lower my cholesterol?',
          answer: 'Atorvastatin typically lowers LDL (bad) cholesterol by 39-60% depending on the dose. At 10mg daily, expect about 39% reduction; at 80mg daily, up to 60% reduction. It also raises HDL (good) cholesterol by 5-9% and lowers triglycerides by 19-37%.'
        },
        {
          question: 'What are the muscle side effects I should watch for?',
          answer: 'About 5-10% of people experience muscle aches or weakness. Most cases are mild and resolve when the medication is stopped. Serious muscle breakdown (rhabdomyolysis) is very rare (1 in 10,000). Contact your doctor if you experience unexplained muscle pain, tenderness, or weakness, especially with fever or dark urine.'
        },
        {
          question: 'Why can\'t I drink grapefruit juice with Atorvastatin?',
          answer: 'Grapefruit juice contains compounds that interfere with the enzyme (CYP3A4) that breaks down Atorvastatin. This can increase the medication\'s levels in your blood, raising the risk of side effects, particularly muscle problems. Avoid grapefruit juice entirely while taking this medication.'
        },
        {
          question: 'Does Atorvastatin increase diabetes risk?',
          answer: 'Statins, including Atorvastatin, may slightly increase the risk of developing type 2 diabetes (about 0.2% increased risk). This is more likely in people already at high risk for diabetes. However, the cardiovascular benefits far outweigh this small risk for most patients. Your doctor will monitor your blood sugar levels.'
        },
        {
          question: 'How long does it take to see cholesterol improvements?',
          answer: 'You\'ll typically see significant cholesterol reductions within 2-4 weeks of starting Atorvastatin, with maximum effects reached by 4-6 weeks. Your doctor will usually check your cholesterol levels after 6-8 weeks to assess the response and adjust the dose if needed.'
        }
      ]
    },
    {
      name: 'Sertraline',
      genericName: 'sertraline hydrochloride',
      fdaBrandName: 'Zoloft',
      brandNames: ['Zoloft'],
      manufacturer: 'Pfizer',
      route: 'oral',
      indications: 'Treatment of depression, panic disorder, obsessive-compulsive disorder (OCD), post-traumatic stress disorder (PTSD), social anxiety disorder, and premenstrual dysphoric disorder (PMDD).',
      contraindications: 'Use with MAOIs or within 14 days of MAOI discontinuation. Use with pimozide. Known hypersensitivity to sertraline.',
      warnings: 'Increased risk of suicidal thinking in children and young adults. Risk of serotonin syndrome when combined with other serotonergic drugs. May cause withdrawal symptoms if stopped abruptly.',
      boxedWarning: 'Increased risk of suicidal thoughts and behavior in children, adolescents, and young adults (up to age 24) with major depressive disorder and other psychiatric disorders.',
      dosageInfo: 'Depression/OCD: Start 50mg daily, range 50-200mg daily. Panic/PTSD/Social anxiety: Start 25mg daily for 1 week, then 50mg daily, range 50-200mg daily. Take with food to reduce stomach upset.',
      adverseReactions: 'Common: Nausea, diarrhea, insomnia, dizziness, drowsiness, dry mouth, sexual side effects, increased sweating. Usually improve over 2-4 weeks of continued treatment.',
      aiEnhancedTitle: 'Sertraline (Zoloft) - Versatile SSRI for Depression & Anxiety',
      aiEnhancedDescription: 'Sertraline is a widely prescribed selective serotonin reuptake inhibitor (SSRI) that effectively treats depression and various anxiety disorders. It works by increasing serotonin levels in the brain, helping to improve mood, reduce anxiety, and restore emotional balance. Known for having fewer drug interactions than some other antidepressants, Sertraline is often a first-choice treatment with a well-established safety profile.',
      seoMetaTitle: 'Sertraline (Zoloft) for Depression: Uses, Side Effects & Dosing',
      seoMetaDescription: 'Complete guide to Sertraline (Zoloft) for depression, anxiety, OCD, and PTSD. Learn about effectiveness, side effects, sexual effects, and withdrawal.',
      published: true,
      faqs: [
        {
          question: 'How long does it take for Sertraline to start working?',
          answer: 'Some people may notice slight improvements in sleep, appetite, and energy within 1-2 weeks. However, significant mood improvements typically take 4-6 weeks, and full benefits may not be apparent until 8-12 weeks of consistent treatment. Don\'t get discouraged if you don\'t feel better immediately.'
        },
        {
          question: 'What sexual side effects can Sertraline cause?',
          answer: 'About 30-60% of people experience some sexual side effects, including decreased libido, difficulty reaching orgasm, or erectile dysfunction. These effects are usually dose-related and may improve over time. If bothersome, discuss with your doctor about dose adjustment, timing of doses, or alternative medications.'
        },
        {
          question: 'Can I drink alcohol while taking Sertraline?',
          answer: 'While not absolutely forbidden, alcohol can worsen depression and anxiety symptoms and may increase side effects like drowsiness and dizziness. It\'s best to limit alcohol consumption and discuss your drinking habits with your doctor to determine what\'s safe for your situation.'
        },
        {
          question: 'What happens if I stop taking Sertraline suddenly?',
          answer: 'Stopping Sertraline abruptly can cause discontinuation syndrome with symptoms like dizziness, nausea, headache, irritability, and "brain zaps." Always work with your doctor to gradually taper the dose over several weeks when discontinuing. The tapering schedule depends on how long you\'ve been taking it and your current dose.'
        },
        {
          question: 'Is it safe to take Sertraline during pregnancy?',
          answer: 'Sertraline is generally considered one of the safer antidepressants during pregnancy, but all medications carry some risk. The benefits of treating depression often outweigh potential risks. Work closely with your doctor and obstetrician to make the best decision for your specific situation. Don\'t stop taking it suddenly if you become pregnant.'
        }
      ]
    },
    {
      name: 'Omeprazole',
      genericName: 'omeprazole',
      fdaBrandName: 'Prilosec',
      brandNames: ['Prilosec', 'Prilosec OTC'],
      manufacturer: 'Procter & Gamble',
      route: 'oral',
      indications: 'Treatment of gastroesophageal reflux disease (GERD), peptic ulcers, Zollinger-Ellison syndrome, and prevention of NSAID-induced ulcers. Also used with antibiotics to treat H. pylori infections.',
      contraindications: 'Hypersensitivity to omeprazole or other proton pump inhibitors. Use with rilpivirine-containing products.',
      warnings: 'Long-term use may increase risk of bone fractures, kidney disease, and vitamin B12 deficiency. May mask symptoms of stomach cancer. Can interact with many medications.',
      dosageInfo: 'GERD: 20mg daily for 4-8 weeks. Ulcers: 20-40mg daily. H. pylori: 20mg twice daily with antibiotics for 10-14 days. Take on empty stomach, 30-60 minutes before meals.',
      adverseReactions: 'Common: Headache, stomach pain, nausea, diarrhea, vomiting, gas. Long-term: Possible increased risk of bone fractures, kidney problems, low magnesium levels.',
      aiEnhancedTitle: 'Omeprazole (Prilosec) - Effective Acid Reflux & Ulcer Treatment',
      aiEnhancedDescription: 'Omeprazole is a proton pump inhibitor (PPI) that provides powerful, long-lasting relief from acid reflux, heartburn, and ulcers by dramatically reducing stomach acid production. It\'s highly effective for healing esophageal damage caused by GERD and preventing ulcers in people taking NSAIDs. Available both by prescription and over-the-counter, it\'s one of the most widely used medications for acid-related disorders.',
      seoMetaTitle: 'Omeprazole (Prilosec): GERD & Heartburn Medication Guide',
      seoMetaDescription: 'Complete information about Omeprazole (Prilosec) for acid reflux, GERD, and ulcers. Learn about effectiveness, proper dosing, long-term risks, and drug interactions.',
      published: true,
      faqs: [
        {
          question: 'How long can I safely take Omeprazole?',
          answer: 'For most conditions, Omeprazole is intended for short-term use (4-8 weeks). However, some people with severe GERD or other conditions may need long-term treatment. Long-term use (over 1 year) may increase risks of bone fractures, kidney problems, and nutrient deficiencies. Your doctor will weigh benefits against risks for extended use.'
        },
        {
          question: 'Why do I need to take Omeprazole on an empty stomach?',
          answer: 'Omeprazole works best when taken 30-60 minutes before your first meal of the day. Food can interfere with absorption and reduce effectiveness. The medication needs to be absorbed before stomach acid production increases with eating. If you take it twice daily, take the second dose before dinner.'
        },
        {
          question: 'Can Omeprazole cause nutrient deficiencies?',
          answer: 'Long-term use may reduce absorption of vitamin B12, magnesium, calcium, and iron. This is because stomach acid helps absorb these nutrients. Your doctor may monitor these levels with blood tests and recommend supplements if you\'re on long-term therapy. Most people don\'t develop clinically significant deficiencies.'
        },
        {
          question: 'What should I do if Omeprazole stops working as well?',
          answer: 'If symptoms return while taking Omeprazole, don\'t just increase the dose on your own. This could indicate you need a different medication, have H. pylori infection, or have another condition. See your doctor for evaluation, which may include testing for H. pylori or endoscopy to assess your condition.'
        },
        {
          question: 'Are there withdrawal symptoms when stopping Omeprazole?',
          answer: 'Some people experience "rebound acid hypersecretion" when stopping PPIs, where stomach acid production temporarily increases above normal levels, causing worse heartburn for 2-4 weeks. To minimize this, your doctor may recommend gradually tapering the dose or switching to an H2 blocker before stopping completely.'
        }
      ]
    }
  ]

  async bootstrap() {
    this.app = await NestFactory.createApplicationContext(AppModule)
    this.prisma = this.app.get(PrismaService)
  }

  async seedDemoData() {
    this.logger.log('Starting demo data seeding...')

    try {
      // Clear existing data
      await this.prisma.drugFAQ.deleteMany()
      await this.prisma.drug.deleteMany()
      this.logger.log('Cleared existing data')

      // Create demo drugs
      for (const drugData of this.demoData) {
        const slug = drugData.name.toLowerCase().replace(/[^a-z0-9]/g, '-')
        
        const drug = await this.prisma.drug.create({
          data: {
            name: drugData.name,
            slug,
            genericName: drugData.genericName,
            fdaBrandName: drugData.fdaBrandName,
            brandNames: drugData.brandNames,
            manufacturer: drugData.manufacturer,
            route: drugData.route,
            indications: drugData.indications,
            contraindications: drugData.contraindications,
            warnings: drugData.warnings,
            boxedWarning: drugData.boxedWarning,
            dosageInfo: drugData.dosageInfo,
            adverseReactions: drugData.adverseReactions,
            aiEnhancedTitle: drugData.aiEnhancedTitle,
            aiEnhancedDescription: drugData.aiEnhancedDescription,
            seoMetaTitle: drugData.seoMetaTitle,
            seoMetaDescription: drugData.seoMetaDescription,
            published: drugData.published,
            fdaLabelData: {
              demo: true,
              lastUpdated: new Date().toISOString()
            }
          }
        })

        // Create FAQs
        for (const faq of drugData.faqs) {
          await this.prisma.drugFAQ.create({
            data: {
              question: faq.question,
              answer: faq.answer,
              drugId: drug.id
            }
          })
        }

        this.logger.log(`Created drug: ${drug.name} with ${drugData.faqs.length} FAQs`)
      }

      this.logger.log(`Successfully seeded ${this.demoData.length} demo drugs`)
    } catch (error) {
      this.logger.error('Demo seeding failed:', error)
      throw error
    }
  }

  async close() {
    await this.prisma.$disconnect()
    await this.app.close()
  }
}

async function bootstrap() {
  const seeder = new DemoSeeder()
  
  try {
    await seeder.bootstrap()
    await seeder.seedDemoData()
    console.log('✅ Demo data seeding completed successfully!')
  } catch (error) {
    console.error('❌ Demo data seeding failed:', error)
    process.exit(1)
  } finally {
    await seeder.close()
    process.exit(0)
  }
}

// Run if called directly
if (require.main === module) {
  bootstrap()
}