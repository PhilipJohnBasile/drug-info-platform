import { Injectable, Logger } from '@nestjs/common';
import { HuggingFaceProvider } from '../providers/huggingface.provider';
import { RetryService } from './retry.service';
import { CacheService } from './cache.service';
import { 
  AIProvider, 
  EnhancedDrugContent, 
  DrugContentContext,
  AIGenerationOptions 
} from '../interfaces/ai-provider.interface';

@Injectable()
export class ContentGeneratorService {
  private readonly logger = new Logger(ContentGeneratorService.name);
  private readonly providers: AIProvider[];

  constructor(
    private huggingFaceProvider: HuggingFaceProvider,
    private retryService: RetryService,
    private cacheService: CacheService,
  ) {
    // Only HuggingFace provider
    this.providers = [this.huggingFaceProvider];
  }

  async generateSEOTitle(context: DrugContentContext): Promise<string> {
    const cacheKey = this.cacheService.generateCacheKey('seo-title', context);
    
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const prompt = this.buildSEOTitlePrompt(context);
        const content = await this.generateWithFallback(prompt, {
          maxTokens: 100,
          temperature: 0.5,
        });
        return this.extractAndValidateSEOTitle(content);
      }
    );
  }

  async generateMetaDescription(context: DrugContentContext): Promise<string> {
    const cacheKey = this.cacheService.generateCacheKey('meta-description', context);
    
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const prompt = this.buildMetaDescriptionPrompt(context);
        const content = await this.generateWithFallback(prompt, {
          maxTokens: 200,
          temperature: 0.5,
        });
        return this.extractAndValidateMetaDescription(content);
      }
    );
  }

  async generatePatientFriendlyDescription(context: DrugContentContext): Promise<string> {
    const cacheKey = this.cacheService.generateCacheKey('patient-description', context);
    
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const prompt = this.buildPatientDescriptionPrompt(context);
        const content = await this.generateWithFallback(prompt, {
          maxTokens: 500,
          temperature: 0.6,
        });
        return this.extractAndValidateDescription(content);
      }
    );
  }

  async generateFAQs(context: DrugContentContext): Promise<Array<{ question: string; answer: string }>> {
    const cacheKey = this.cacheService.generateCacheKey('faqs', context);
    
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const prompt = this.buildFAQPrompt(context);
        const content = await this.generateWithFallback(prompt, {
          maxTokens: 1500,
          temperature: 0.7,
        });
        return this.extractAndValidateFAQs(content);
      }
    );
  }

  async generateEnhancedContent(context: DrugContentContext): Promise<EnhancedDrugContent> {
    const cacheKey = this.cacheService.generateCacheKey('enhanced-content', context);
    
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const [seoTitle, metaDescription, patientFriendlyDescription, faqs] = await Promise.all([
          this.generateSEOTitle(context),
          this.generateMetaDescription(context),
          this.generatePatientFriendlyDescription(context),
          this.generateFAQs(context),
        ]);

        return {
          seoTitle,
          metaDescription,
          patientFriendlyDescription,
          faqs,
        };
      }
    );
  }

  private async generateWithFallback(
    prompt: string, 
    options: AIGenerationOptions = {}
  ): Promise<string> {
    return this.retryService.executeWithRetry(
      async () => {
        for (const provider of this.providers) {
          try {
            if (await provider.isHealthy()) {
              this.logger.debug(`Using ${provider.getProviderName()} for content generation`);
              return await provider.generateContent(prompt, options);
            }
          } catch (error) {
            this.logger.warn(`${provider.getProviderName()} failed: ${error.message}`);
            continue;
          }
        }
        throw new Error('All AI providers failed');
      },
      'AI Content Generation'
    );
  }

  async generateProviderExplanation(
    topic: string,
    type: 'medical_condition' | 'drug_mechanism' | 'treatment_approach' | 'pharmacology',
    options: {
      drugName?: string;
      indication?: string;
      targetAudience?: 'primary_care' | 'specialist' | 'pharmacy' | 'general_healthcare';
    } = {}
  ): Promise<any> {
    const cacheKey = this.cacheService.generateCacheKey('provider-explanation', { topic, type, ...options });
    
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const prompt = this.buildProviderExplanationPrompt(topic, type, options);
        const content = await this.generateWithFallback(prompt, {
          maxTokens: 1000,
          temperature: 0.3,
        });
        return this.extractAndValidateProviderExplanation(content);
      }
    );
  }

  private buildProviderExplanationPrompt(
    topic: string,
    type: string,
    options: any
  ): string {
    const audienceContext = this.getAudienceContext(options.targetAudience || 'general_healthcare');
    const drugContext = options.drugName ? `related to ${options.drugName}` : '';
    const indicationContext = options.indication ? `for ${options.indication}` : '';

    return `Generate a professional healthcare provider explanation about "${topic}" (${type})${drugContext}${indicationContext}.

Target audience: ${audienceContext}

Requirements:
- Use medical terminology appropriate for healthcare professionals
- Include clinical context and evidence-based information
- Provide key clinical points for practice
- Include practice considerations and monitoring
- Maintain professional, objective tone
- Be comprehensive yet concise (500-800 words)
- Include related clinical information when relevant

Format as JSON:
{
  "explanation": "comprehensive explanation text",
  "keyPoints": ["key point 1", "key point 2", "key point 3", "key point 4"],
  "clinicalContext": "clinical context and evidence-based considerations",
  "practiceConsiderations": ["consideration 1", "consideration 2", "consideration 3"],
  "relatedInformation": ["related info 1", "related info 2", "related info 3"]
}

Return only the JSON object, no explanation.`;
  }

  private getAudienceContext(audience: string): string {
    switch (audience) {
      case 'primary_care':
        return 'Primary care physicians and family medicine practitioners';
      case 'specialist':
        return 'Medical specialists and subspecialty physicians';
      case 'pharmacy':
        return 'Pharmacists and pharmacy professionals';
      case 'general_healthcare':
      default:
        return 'General healthcare professionals including physicians, nurses, and pharmacists';
    }
  }

  private extractAndValidateProviderExplanation(content: string): any {
    try {
      const cleanContent = content.trim().replace(/^```json\n?|\n?```$/g, '');
      const explanation = JSON.parse(cleanContent);
      
      if (!explanation.explanation || !explanation.keyPoints || !explanation.clinicalContext) {
        throw new Error('Missing required fields in provider explanation');
      }
      
      return {
        explanation: explanation.explanation.trim(),
        keyPoints: Array.isArray(explanation.keyPoints) ? explanation.keyPoints.slice(0, 6) : [],
        clinicalContext: explanation.clinicalContext.trim(),
        practiceConsiderations: Array.isArray(explanation.practiceConsiderations) ? 
          explanation.practiceConsiderations.slice(0, 5) : [],
        relatedInformation: Array.isArray(explanation.relatedInformation) ? 
          explanation.relatedInformation.slice(0, 5) : []
      };
    } catch (error) {
      this.logger.error('Error parsing provider explanation:', error);
      return this.getFallbackProviderExplanation();
    }
  }

  private getFallbackProviderExplanation(): any {
    return {
      explanation: 'Clinical topic requiring professional medical assessment and individualized patient care. Healthcare providers should refer to current clinical guidelines, peer-reviewed literature, and institutional protocols.',
      keyPoints: [
        'Clinical assessment required',
        'Individualized patient care essential',
        'Refer to current guidelines',
        'Consider patient-specific factors'
      ],
      clinicalContext: 'Healthcare providers should consider patient history, comorbidities, current medications, and individual risk factors when providing care.',
      practiceConsiderations: [
        'Document clinical decision-making rationale',
        'Monitor patient response and adjust as needed',
        'Coordinate care with other providers as appropriate'
      ],
      relatedInformation: [
        'Consult institutional clinical guidelines',
        'Review current peer-reviewed literature',
        'Consider specialist consultation when appropriate'
      ]
    };
  }

  private buildSEOTitlePrompt(context: DrugContentContext): string {
    const { drugName, genericName, indications } = context;
    
    return `Create an SEO-optimized title for the drug "${drugName}" that:
- Is exactly 50-60 characters long
- Includes the primary drug name
- Mentions key use case if available
- Is compelling for search results
- Follows medical content guidelines

Drug details:
- Generic name: ${genericName || 'Not specified'}
- Primary uses: ${indications || 'General medication'}

Return only the title, no explanation.`;
  }

  private buildMetaDescriptionPrompt(context: DrugContentContext): string {
    const { drugName, genericName, indications, warnings } = context;
    
    return `Create an SEO-optimized meta description for the drug "${drugName}" that:
- Is exactly 150-155 characters long
- Summarizes key drug information
- Includes primary uses and important safety info
- Is informative and compelling
- Encourages clicks while being medically accurate

Drug details:
- Generic name: ${genericName || 'Not specified'}
- Primary uses: ${indications || 'General medication'}
- Key warnings: ${warnings || 'Standard precautions apply'}

Return only the meta description, no explanation.`;
  }

  private buildPatientDescriptionPrompt(context: DrugContentContext): string {
    const { drugName, genericName, indications, contraindications, warnings, dosageInfo } = context;
    
    return `Create a patient-friendly description for the drug "${drugName}" that:
- Explains what the drug is and what it's used for in simple terms
- Mentions key safety information patients should know
- Is 150-250 words long
- Uses accessible language (8th grade reading level)
- Emphasizes the importance of following doctor's instructions
- Is medically accurate but not overly technical

Drug details:
- Generic name: ${genericName || 'Not specified'}
- Uses: ${indications || 'As prescribed by healthcare provider'}
- Important warnings: ${warnings || 'Follow healthcare provider instructions'}
- Contraindications: ${contraindications || 'Discuss with healthcare provider'}
- Dosage info: ${dosageInfo || 'As prescribed'}

Return only the description, no explanation.`;
  }

  private buildFAQPrompt(context: DrugContentContext): string {
    const { drugName, genericName, indications, contraindications, warnings, adverseReactions, dosageInfo } = context;
    
    return `Create exactly 5 frequently asked questions and answers about the drug "${drugName}":

Drug details:
- Generic name: ${genericName || 'Not specified'}
- Uses: ${indications || 'As prescribed by healthcare provider'}
- Warnings: ${warnings || 'Follow healthcare provider instructions'}
- Contraindications: ${contraindications || 'Discuss with healthcare provider'}
- Side effects: ${adverseReactions || 'May vary by individual'}
- Dosage: ${dosageInfo || 'As prescribed'}

Requirements:
- Each question should be 10-15 words
- Each answer should be 50-100 words
- Cover common patient concerns (uses, side effects, dosage, interactions, precautions)
- Use patient-friendly language
- Emphasize consulting healthcare providers
- Be medically accurate

Format as JSON:
[
  {"question": "...", "answer": "..."},
  {"question": "...", "answer": "..."},
  {"question": "...", "answer": "..."},
  {"question": "...", "answer": "..."},
  {"question": "...", "answer": "..."}
]

Return only the JSON array, no explanation.`;
  }

  private extractAndValidateSEOTitle(content: string): string {
    const title = content.trim().replace(/^"|"$/g, '');
    
    if (title.length > 60) {
      return title.substring(0, 57) + '...';
    }
    
    if (title.length < 30) {
      this.logger.warn('Generated SEO title is too short, using fallback');
      return 'Drug Information - Uses, Dosage & Side Effects';
    }
    
    return title;
  }

  private extractAndValidateMetaDescription(content: string): string {
    const description = content.trim().replace(/^"|"$/g, '');
    
    if (description.length > 155) {
      return description.substring(0, 152) + '...';
    }
    
    if (description.length < 120) {
      this.logger.warn('Generated meta description is too short, using fallback');
      return 'Comprehensive drug information including uses, dosage, side effects, and safety guidelines. Consult your healthcare provider.';
    }
    
    return description;
  }

  private extractAndValidateDescription(content: string): string {
    const description = content.trim();
    
    if (description.length > 2000) {
      return description.substring(0, 1997) + '...';
    }
    
    if (description.length < 100) {
      this.logger.warn('Generated description is too short, using fallback');
      return 'This medication is used to treat various conditions as prescribed by healthcare providers. Always follow your doctor\'s instructions and consult them about any questions or concerns.';
    }
    
    return description;
  }

  private extractAndValidateFAQs(content: string): Array<{ question: string; answer: string }> {
    try {
      const cleanContent = content.trim().replace(/^```json\n?|\n?```$/g, '');
      const faqs = JSON.parse(cleanContent);
      
      if (!Array.isArray(faqs)) {
        throw new Error('FAQs is not an array');
      }
      
      const validFaqs = faqs
        .filter(faq => faq.question && faq.answer)
        .slice(0, 5)
        .map(faq => ({
          question: faq.question.trim(),
          answer: faq.answer.trim(),
        }));
      
      if (validFaqs.length < 3) {
        this.logger.warn('Generated FAQs are invalid, using fallback');
        return this.getFallbackFAQs();
      }
      
      return validFaqs;
    } catch (error) {
      this.logger.error('Error parsing generated FAQs:', error);
      return this.getFallbackFAQs();
    }
  }

  private getFallbackFAQs(): Array<{ question: string; answer: string }> {
    return [
      {
        question: 'What is this medication used for?',
        answer: 'This medication is prescribed by healthcare providers to treat specific conditions. The exact uses depend on your individual medical situation and should be discussed with your doctor.',
      },
      {
        question: 'How should I take this medication?',
        answer: 'Always follow your healthcare provider\'s instructions exactly. Take the medication as prescribed, at the recommended times, and for the full duration specified by your doctor.',
      },
      {
        question: 'What are the common side effects?',
        answer: 'Side effects can vary between individuals. Contact your healthcare provider if you experience any unusual symptoms or side effects while taking this medication.',
      },
      {
        question: 'Can I take this with other medications?',
        answer: 'Always inform your healthcare provider about all medications, supplements, and over-the-counter drugs you are taking to avoid potential interactions.',
      },
      {
        question: 'What should I do if I miss a dose?',
        answer: 'If you miss a dose, contact your healthcare provider or pharmacist for guidance. Do not double doses unless specifically instructed by your healthcare provider.',
      },
    ];
  }

  async generateRelatedContentSuggestions(
    drugName: string,
    indication?: string,
    drugClass?: string,
    mechanism?: string
  ): Promise<any> {
    const cacheKey = this.cacheService.generateCacheKey('related-content', { 
      drugName, 
      indication, 
      drugClass, 
      mechanism 
    });

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const prompt = this.buildRelatedContentPrompt(drugName, indication, drugClass, mechanism);
        
        const content = await this.generateWithFallback(prompt, {
          maxTokens: 300,
          temperature: 0.7,
        });

        return this.parseRelatedContentResponse(content, drugName);
      },
      7200 // Cache for 2 hours
    );
  }

  private buildRelatedContentPrompt(
    drugName: string, 
    indication?: string, 
    drugClass?: string, 
    mechanism?: string
  ): string {
    const contextParts = [];
    
    if (indication) contextParts.push(`used for ${indication}`);
    if (drugClass) contextParts.push(`belongs to ${drugClass} class`);
    if (mechanism) contextParts.push(`works by ${mechanism}`);
    
    const context = contextParts.length > 0 ? ` (${contextParts.join(', ')})` : '';

    return `Generate clinically accurate related content suggestions for the medication ${drugName}${context}.

Based on the drug's pharmacology, therapeutic class, and clinical use, please provide:

1. Related drugs: List 4-5 medications with similar mechanisms, therapeutic class, or indications
   - Include both generic and brand names when relevant
   - Focus on clinically appropriate alternatives
   
2. Related conditions: List 3-4 medical conditions this drug treats or is associated with
   - Include primary and secondary indications
   - Consider off-label uses if clinically relevant
   
3. Drug interactions: List 3-4 important drug classes or specific medications that interact
   - Focus on clinically significant interactions
   - Include mechanism of interaction when relevant
   
4. Related topics: List 3-4 medical topics healthcare providers should understand
   - Include monitoring requirements, contraindications, or therapeutic considerations
   - Focus on clinically actionable information

Requirements:
- Use current medical knowledge and evidence-based information
- Provide clinically relevant and accurate suggestions
- Format responses for healthcare professional use
- Avoid generic or vague recommendations

Format as JSON with this exact structure:
{
  "relatedDrugs": [
    {"name": "Drug Name (Brand)", "reason": "therapeutic relationship", "category": "therapeutic_alternative|mechanism_similar|class_related"},
    ...
  ],
  "relatedConditions": [
    {"condition": "Medical Condition", "relationship": "primary_indication|secondary_use|contraindication", "severity": "mild|moderate|severe"},
    ...
  ],
  "drugInteractions": [
    {"drug": "Interacting Drug/Class", "type": "major|moderate|minor", "description": "brief mechanism or effect"},
    ...
  ],
  "relatedTopics": [
    {"topic": "Clinical Topic", "relevance": "monitoring|contraindication|mechanism|therapeutic", "category": "safety|efficacy|administration"},
    ...
  ]
}

Return only the JSON object.`;
  }

  private parseRelatedContentResponse(content: string, drugName: string): any {
    try {
      // Try to parse as JSON first
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if ((parsed.similarDrugs || parsed.relatedDrugs) && parsed.relatedConditions) {
          return parsed;
        }
      }
    } catch (error) {
      this.logger.warn(`Failed to parse JSON response for ${drugName}, using fallback`);
    }

    // Fallback: Generate structured suggestions based on drug name
    return this.generateFallbackRelatedContent(drugName);
  }

  private generateFallbackRelatedContent(drugName: string): any {
    // Dynamic fallback that asks healthcare providers to consult clinical resources
    return {
      relatedDrugs: [
        {
          name: "Consult clinical references",
          reason: "Professional medication references should be consulted for therapeutic alternatives",
          category: "reference_required"
        },
        {
          name: "Consider formulary alternatives",
          reason: "Institution-specific formulary may have preferred alternatives",
          category: "formulary_dependent"
        },
        {
          name: "Review drug class options",
          reason: "Other medications in the same therapeutic class may be appropriate",
          category: "class_related"
        }
      ],
      relatedConditions: [
        {
          condition: "Primary indication",
          relationship: "primary_indication", 
          severity: "moderate"
        },
        {
          condition: "Consult prescribing information",
          relationship: "reference_required",
          severity: "mild"
        },
        {
          condition: "Review clinical guidelines",
          relationship: "guideline_dependent",
          severity: "mild"
        }
      ],
      drugInteractions: [
        {
          drug: "Review drug interaction database",
          type: "moderate",
          description: "Consult comprehensive drug interaction checking tools"
        },
        {
          drug: "Consider CYP enzyme interactions", 
          type: "moderate",
          description: "Check for cytochrome P450 mediated interactions"
        },
        {
          drug: "Monitor for protein binding displacement",
          type: "minor", 
          description: "Consider highly protein-bound drug interactions"
        }
      ],
      relatedTopics: [
        {
          topic: "Prescribing information review",
          relevance: "therapeutic",
          category: "efficacy"
        },
        {
          topic: "Clinical monitoring requirements", 
          relevance: "monitoring",
          category: "safety"
        },
        {
          topic: "Patient counseling points",
          relevance: "therapeutic",
          category: "administration"
        }
      ]
    };
  }
}