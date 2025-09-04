import { Injectable, Logger } from '@nestjs/common';
import { ContentGeneratorService } from './services/content-generator.service';
import { MedicalValidatorService } from './services/medical-validator.service';
import { DrugContentContext, EnhancedDrugContent } from './interfaces/ai-provider.interface';

export interface EnhancedContent {
  title: string;
  description: string;
  seoMetaTitle: string;
  seoMetaDescription: string;
  faqs: Array<{ question: string; answer: string }>;
}

export interface ProviderExplanation {
  explanation: string;
  keyPoints: string[];
  clinicalContext: string;
  practiceConsiderations: string[];
  relatedInformation?: string[];
}

export interface RelatedContentSuggestions {
  relatedDrugs: Array<{ name: string; reason: string; category: string }>;
  relatedConditions: Array<{ condition: string; relationship: string; severity: string }>;
  drugInteractions: Array<{ drug: string; type: 'major' | 'moderate' | 'minor'; description: string }>;
  relatedTopics: Array<{ topic: string; relevance: string; category: string }>;
}

@Injectable()
export class AiServiceService {
  private readonly logger = new Logger(AiServiceService.name);

  constructor(
    private contentGenerator: ContentGeneratorService,
    private medicalValidator: MedicalValidatorService,
  ) {}

  async enhanceDrugContent(
    drugName: string,
    fdaLabelData: any,
    drugContext?: Partial<DrugContentContext>,
  ): Promise<EnhancedContent> {
    try {
      const context: DrugContentContext = {
        drugName,
        genericName: drugContext?.genericName,
        brandNames: drugContext?.brandNames,
        indications: drugContext?.indications,
        contraindications: drugContext?.contraindications,
        warnings: drugContext?.warnings,
        dosageInfo: drugContext?.dosageInfo,
        adverseReactions: drugContext?.adverseReactions,
        manufacturer: drugContext?.manufacturer,
      };

      this.logger.log(`Generating enhanced content for ${drugName}`);

      const enhancedContent = await this.contentGenerator.generateEnhancedContent(context);

      // Validate the generated content
      const seoTitleValidation = this.medicalValidator.validateSEOTitle(enhancedContent.seoTitle);
      const metaDescValidation = this.medicalValidator.validateMetaDescription(enhancedContent.metaDescription);
      const faqValidation = this.medicalValidator.validateFAQs(enhancedContent.faqs);

      if (!seoTitleValidation.isValid) {
        this.logger.warn(`SEO title validation failed for ${drugName}:`, seoTitleValidation.issues);
      }

      if (!metaDescValidation.isValid) {
        this.logger.warn(`Meta description validation failed for ${drugName}:`, metaDescValidation.issues);
      }

      if (!faqValidation.isValid) {
        this.logger.warn(`FAQ validation failed for ${drugName}:`, faqValidation.issues);
      }

      // Validate overall content for medical accuracy
      const contentValidation = this.medicalValidator.validateContent(
        enhancedContent.patientFriendlyDescription,
        context
      );

      if (!contentValidation.isValid) {
        this.logger.warn(`Content validation failed for ${drugName}:`, {
          warnings: contentValidation.warnings,
          suggestions: contentValidation.suggestions,
        });
      }

      return {
        title: enhancedContent.seoTitle,
        description: enhancedContent.patientFriendlyDescription,
        seoMetaTitle: enhancedContent.seoTitle,
        seoMetaDescription: enhancedContent.metaDescription,
        faqs: enhancedContent.faqs,
      };

    } catch (error) {
      this.logger.error(`Error enhancing content for ${drugName}:`, error);
      return this.getFallbackContent(drugName);
    }
  }

  async generateSEOTitle(context: DrugContentContext): Promise<string> {
    try {
      const title = await this.contentGenerator.generateSEOTitle(context);
      const validation = this.medicalValidator.validateSEOTitle(title);
      
      if (!validation.isValid) {
        this.logger.warn(`Generated SEO title failed validation:`, validation.issues);
      }
      
      return title;
    } catch (error) {
      this.logger.error(`Error generating SEO title for ${context.drugName}:`, error);
      return `${context.drugName} - Drug Information & Side Effects`;
    }
  }

  async generateMetaDescription(context: DrugContentContext): Promise<string> {
    try {
      const description = await this.contentGenerator.generateMetaDescription(context);
      const validation = this.medicalValidator.validateMetaDescription(description);
      
      if (!validation.isValid) {
        this.logger.warn(`Generated meta description failed validation:`, validation.issues);
      }
      
      return description;
    } catch (error) {
      this.logger.error(`Error generating meta description for ${context.drugName}:`, error);
      return `Learn about ${context.drugName} uses, dosage, side effects, and safety information. Consult your healthcare provider.`;
    }
  }

  async generatePatientFriendlyDescription(context: DrugContentContext): Promise<string> {
    try {
      const description = await this.contentGenerator.generatePatientFriendlyDescription(context);
      const validation = this.medicalValidator.validateContent(description, context);
      
      if (!validation.isValid) {
        this.logger.warn(`Generated description failed validation:`, validation.warnings);
      }
      
      return description;
    } catch (error) {
      this.logger.error(`Error generating description for ${context.drugName}:`, error);
      return `${context.drugName} is a medication prescribed by healthcare providers. Always follow your doctor's instructions and discuss any questions or concerns with your healthcare team.`;
    }
  }

  async generateFAQs(context: DrugContentContext): Promise<Array<{ question: string; answer: string }>> {
    try {
      const faqs = await this.contentGenerator.generateFAQs(context);
      const validation = this.medicalValidator.validateFAQs(faqs);
      
      if (!validation.isValid) {
        this.logger.warn(`Generated FAQs failed validation:`, validation.issues);
      }
      
      return faqs;
    } catch (error) {
      this.logger.error(`Error generating FAQs for ${context.drugName}:`, error);
      return this.getFallbackFAQs(context.drugName);
    }
  }

  async generateProviderExplanation(
    topic: string,
    type: 'medical_condition' | 'drug_mechanism' | 'treatment_approach' | 'pharmacology',
    options: {
      drugName?: string;
      indication?: string;
      targetAudience?: 'primary_care' | 'specialist' | 'pharmacy' | 'general_healthcare';
    } = {}
  ): Promise<ProviderExplanation> {
    try {
      this.logger.log(`Generating provider explanation for ${topic} (${type})`);

      const explanation = await this.contentGenerator.generateProviderExplanation(topic, type, options);

      // Validate the generated explanation
      const validation = this.medicalValidator.validateProviderContent(explanation.explanation);
      
      if (!validation.isValid) {
        this.logger.warn(`Provider explanation validation failed for ${topic}:`, validation.warnings);
      }

      return explanation;
    } catch (error) {
      this.logger.error(`Error generating provider explanation for ${topic}:`, error);
      return this.getFallbackProviderExplanation(topic, type, options);
    }
  }

  async generateRelatedContentSuggestions(
    drugName: string,
    context?: Partial<DrugContentContext>
  ): Promise<RelatedContentSuggestions> {
    try {
      this.logger.log(`Generating related content suggestions for ${drugName}`);

      // Add timeout to prevent long waits - use Promise.race for faster fallback
      const timeoutPromise = new Promise<RelatedContentSuggestions>((_, reject) => {
        setTimeout(() => reject(new Error('AI generation timed out after 25 seconds')), 25000);
      });

      const generationPromise = this.contentGenerator.generateRelatedContentSuggestions(
        drugName,
        context?.indications,
        undefined, // drugClass - we don't have this in context 
        undefined  // mechanism - we don't have this in context
      );

      const suggestions = await Promise.race([generationPromise, timeoutPromise]);
      return suggestions;
    } catch (error) {
      this.logger.error(`Error generating related content suggestions for ${drugName}:`, error);
      // Return enhanced fallback content with drug-specific information
      return this.getEnhancedFallbackRelatedContent(drugName, context);
    }
  }

  private getFallbackProviderExplanation(
    topic: string,
    type: string,
    options: any
  ): ProviderExplanation {
    const drugContext = options.drugName ? ` related to ${options.drugName}` : '';
    
    return {
      explanation: `${topic}${drugContext} is a clinical topic requiring professional medical assessment and individualized patient care. Healthcare providers should refer to current clinical guidelines, peer-reviewed literature, and institutional protocols when evaluating and treating patients.`,
      keyPoints: [
        'Clinical assessment required',
        'Individualized patient care essential', 
        'Refer to current guidelines',
        'Consider patient-specific factors'
      ],
      clinicalContext: `When evaluating ${topic.toLowerCase()}${drugContext}, healthcare providers should consider patient history, comorbidities, current medications, and individual risk factors to provide optimal care.`,
      practiceConsiderations: [
        'Document clinical decision-making rationale',
        'Monitor patient response and adjust as needed',
        'Coordinate care with other healthcare providers as appropriate',
        'Provide patient education and follow-up'
      ],
      relatedInformation: [
        'Consult institutional clinical guidelines',
        'Review current peer-reviewed literature',
        'Consider specialist consultation when appropriate'
      ]
    };
  }

  private getFallbackContent(drugName: string): EnhancedContent {
    return {
      title: `${drugName} - Drug Information`,
      description: `Learn about ${drugName}, including its uses, dosage, side effects, and important safety information. Always consult your healthcare provider for personalized medical advice.`,
      seoMetaTitle: `${drugName} Information - Uses, Dosage & Side Effects`,
      seoMetaDescription: `Comprehensive information about ${drugName}. Learn about uses, dosage, side effects, and safety guidelines. Consult your doctor.`,
      faqs: this.getFallbackFAQs(drugName),
    };
  }

  private getFallbackFAQs(drugName: string): Array<{ question: string; answer: string }> {
    return [
      {
        question: `What is ${drugName} used for?`,
        answer: `${drugName} is a medication prescribed by healthcare providers to treat specific conditions. Consult your doctor about its specific uses for your situation.`,
      },
      {
        question: `How should I take ${drugName}?`,
        answer: `Always take ${drugName} exactly as prescribed by your healthcare provider. Follow the dosing instructions and duration recommended by your doctor.`,
      },
      {
        question: `What are the side effects of ${drugName}?`,
        answer: `Side effects can vary between individuals. Contact your healthcare provider if you experience any unusual symptoms while taking ${drugName}.`,
      },
      {
        question: `Can I take ${drugName} with other medications?`,
        answer: `Always inform your healthcare provider about all medications you are taking to avoid potential interactions with ${drugName}.`,
      },
      {
        question: `What should I do if I miss a dose?`,
        answer: `If you miss a dose of ${drugName}, contact your healthcare provider or pharmacist for guidance. Do not double doses without medical supervision.`,
      },
    ];
  }

  private getFallbackRelatedContent(drugName: string): RelatedContentSuggestions {
    return {
      relatedDrugs: [
        {
          name: 'Similar medications in the same class',
          reason: `Alternative treatments similar to ${drugName}`,
          category: 'therapeutic_alternative'
        },
        {
          name: 'Generic equivalents',
          reason: 'Cost-effective alternatives',
          category: 'generic_option'
        }
      ],
      relatedConditions: [
        {
          condition: 'Primary indication',
          relationship: `Condition commonly treated with ${drugName}`,
          severity: 'moderate'
        },
        {
          condition: 'Secondary uses',
          relationship: 'Off-label applications',
          severity: 'mild'
        }
      ],
      drugInteractions: [
        {
          drug: 'Common interacting medications',
          type: 'moderate' as const,
          description: 'Consult healthcare provider about potential interactions'
        }
      ],
      relatedTopics: [
        {
          topic: 'Dosage and administration',
          relevance: 'Essential information for safe use',
          category: 'safety'
        },
        {
          topic: 'Side effects and monitoring',
          relevance: 'Important safety considerations',
          category: 'monitoring'
        }
      ]
    };
  }

  private getEnhancedFallbackRelatedContent(drugName: string, context?: Partial<DrugContentContext>): RelatedContentSuggestions {
    // Determine if this is likely a diabetes medication based on the drug name
    const isDiabetesMed = drugName.toLowerCase().includes('dulaglutide') || drugName.toLowerCase().includes('trulicity') || 
                         context?.indications?.toLowerCase().includes('diabetes');

    const isCardiovascularMed = context?.indications?.toLowerCase().includes('hypertension') || 
                               context?.indications?.toLowerCase().includes('blood pressure') ||
                               context?.indications?.toLowerCase().includes('cardiovascular');

    if (isDiabetesMed) {
      return {
        relatedDrugs: [
          {
            name: 'Metformin',
            reason: 'First-line diabetes medication often used in combination',
            category: 'combination_therapy'
          },
          {
            name: 'Insulin',
            reason: 'May be used alongside GLP-1 agonists for comprehensive glucose control',
            category: 'combination_therapy'
          },
          {
            name: 'Semaglutide (Ozempic/Wegovy)',
            reason: 'Similar GLP-1 receptor agonist with comparable mechanism',
            category: 'same_class'
          }
        ],
        relatedConditions: [
          {
            condition: 'Type 2 Diabetes Mellitus',
            relationship: 'Primary indication for GLP-1 receptor agonists',
            severity: 'major'
          },
          {
            condition: 'Cardiovascular Disease',
            relationship: 'Secondary prevention benefit demonstrated in clinical trials',
            severity: 'major'
          },
          {
            condition: 'Diabetic Nephropathy',
            relationship: 'Renal protective effects observed',
            severity: 'moderate'
          }
        ],
        drugInteractions: [
          {
            drug: 'Insulin',
            type: 'moderate' as const,
            description: 'May increase risk of hypoglycemia - monitor blood glucose closely'
          },
          {
            drug: 'Sulfonylureas',
            type: 'moderate' as const,
            description: 'Increased hypoglycemia risk - may require dose adjustment'
          }
        ],
        relatedTopics: [
          {
            topic: 'Blood Glucose Monitoring',
            relevance: 'Essential for diabetes management and dose optimization',
            category: 'monitoring'
          },
          {
            topic: 'Injection Technique',
            relevance: 'Proper subcutaneous injection for optimal absorption',
            category: 'administration'
          },
          {
            topic: 'Hypoglycemia Management',
            relevance: 'Recognition and treatment of low blood sugar episodes',
            category: 'safety'
          }
        ]
      };
    }

    if (isCardiovascularMed) {
      return {
        relatedDrugs: [
          {
            name: 'ACE Inhibitors',
            reason: 'First-line antihypertensive medications',
            category: 'same_indication'
          },
          {
            name: 'Diuretics',
            reason: 'Often used in combination for blood pressure control',
            category: 'combination_therapy'
          }
        ],
        relatedConditions: [
          {
            condition: 'Hypertension',
            relationship: 'Primary cardiovascular risk factor',
            severity: 'major'
          },
          {
            condition: 'Heart Disease',
            relationship: 'Complication of uncontrolled hypertension',
            severity: 'major'
          }
        ],
        drugInteractions: [
          {
            drug: 'NSAIDs',
            type: 'moderate' as const,
            description: 'May reduce antihypertensive effects and increase cardiovascular risk'
          }
        ],
        relatedTopics: [
          {
            topic: 'Blood Pressure Monitoring',
            relevance: 'Regular monitoring essential for treatment optimization',
            category: 'monitoring'
          },
          {
            topic: 'Lifestyle Modifications',
            relevance: 'Diet, exercise, and lifestyle changes complement medication',
            category: 'lifestyle'
          }
        ]
      };
    }

    // Default fallback for other medications
    return this.getFallbackRelatedContent(drugName);
  }
}