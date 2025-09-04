import { Injectable, Logger } from '@nestjs/common';
import { DrugContentContext } from '../interfaces/ai-provider.interface';

@Injectable()
export class MedicalValidatorService {
  private readonly logger = new Logger(MedicalValidatorService.name);
  
  private readonly dangerousKeywords = [
    'cure', 'guaranteed', 'miracle', 'instant', 'immediate cure',
    'no side effects', '100% safe', 'completely safe',
    'replace doctor', 'no need for doctor', 'better than prescription'
  ];

  private readonly requiredDisclaimers = [
    'consult', 'healthcare provider', 'doctor', 'medical professional',
    'prescribed', 'medical advice', 'pharmacist'
  ];

  private readonly contraindicatedCombinations = [
    ['alcohol', 'sedative'],
    ['blood thinner', 'aspirin'],
    ['pregnancy', 'category x'],
  ];

  validateContent(content: string, context: DrugContentContext): {
    isValid: boolean;
    warnings: string[];
    suggestions: string[];
  } {
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Check for dangerous claims
    const dangerousClaims = this.checkDangerousClaims(content);
    warnings.push(...dangerousClaims);

    // Ensure medical disclaimers are present
    const missingDisclaimers = this.checkMedicalDisclaimers(content);
    if (missingDisclaimers.length > 0) {
      warnings.push('Missing medical disclaimers');
      suggestions.push('Include references to consulting healthcare providers');
    }

    // Check for overly specific medical advice
    const specificAdvice = this.checkSpecificMedicalAdvice(content);
    warnings.push(...specificAdvice);

    // Validate drug interaction warnings
    const interactionIssues = this.checkInteractionWarnings(content, context);
    warnings.push(...interactionIssues);

    // Check reading level
    const readingLevel = this.assessReadingLevel(content);
    if (readingLevel > 10) {
      suggestions.push('Consider simplifying language for better patient comprehension');
    }

    // Validate length constraints
    const lengthIssues = this.checkLengthConstraints(content);
    warnings.push(...lengthIssues);

    const isValid = warnings.length === 0;

    if (!isValid) {
      this.logger.warn(`Content validation failed for ${context.drugName}:`, {
        warnings,
        suggestions,
      });
    }

    return {
      isValid,
      warnings,
      suggestions,
    };
  }

  validateSEOTitle(title: string): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (title.length > 60) {
      issues.push(`Title too long: ${title.length} characters (max: 60)`);
    }

    if (title.length < 30) {
      issues.push(`Title too short: ${title.length} characters (min: 30)`);
    }

    if (this.containsDangerousKeywords(title)) {
      issues.push('Contains potentially misleading medical claims');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  validateMetaDescription(description: string): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (description.length > 155) {
      issues.push(`Meta description too long: ${description.length} characters (max: 155)`);
    }

    if (description.length < 120) {
      issues.push(`Meta description too short: ${description.length} characters (min: 120)`);
    }

    if (this.containsDangerousKeywords(description)) {
      issues.push('Contains potentially misleading medical claims');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  validateFAQs(faqs: Array<{ question: string; answer: string }>): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    if (faqs.length !== 5) {
      issues.push(`Expected 5 FAQs, got ${faqs.length}`);
    }

    faqs.forEach((faq, index) => {
      if (!faq.question || faq.question.length < 5) {
        issues.push(`FAQ ${index + 1}: Question too short or missing`);
      }

      if (!faq.answer || faq.answer.length < 20) {
        issues.push(`FAQ ${index + 1}: Answer too short or missing`);
      }

      if (this.containsDangerousKeywords(faq.answer)) {
        issues.push(`FAQ ${index + 1}: Contains potentially misleading medical claims`);
      }

      if (!this.containsMedicalDisclaimer(faq.answer)) {
        issues.push(`FAQ ${index + 1}: Missing medical disclaimer`);
      }
    });

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  private checkDangerousClaims(content: string): string[] {
    const warnings: string[] = [];
    const lowerContent = content.toLowerCase();

    this.dangerousKeywords.forEach(keyword => {
      if (lowerContent.includes(keyword.toLowerCase())) {
        warnings.push(`Contains potentially dangerous claim: "${keyword}"`);
      }
    });

    return warnings;
  }

  private checkMedicalDisclaimers(content: string): string[] {
    const lowerContent = content.toLowerCase();
    const hasDisclaimer = this.requiredDisclaimers.some(disclaimer =>
      lowerContent.includes(disclaimer.toLowerCase())
    );

    return hasDisclaimer ? [] : ['Missing medical disclaimer'];
  }

  private checkSpecificMedicalAdvice(content: string): string[] {
    const warnings: string[] = [];
    const specificAdvicePatterns = [
      /take \d+ (mg|tablets|pills)/i,
      /stop taking/i,
      /increase (dose|dosage)/i,
      /decrease (dose|dosage)/i,
      /switch to/i,
    ];

    specificAdvicePatterns.forEach(pattern => {
      if (pattern.test(content)) {
        warnings.push('Contains specific medical advice that should come from healthcare providers');
      }
    });

    return warnings;
  }

  private checkInteractionWarnings(content: string, context: DrugContentContext): string[] {
    const warnings: string[] = [];
    const lowerContent = content.toLowerCase();

    this.contraindicatedCombinations.forEach(([term1, term2]) => {
      if (lowerContent.includes(term1.toLowerCase()) && 
          lowerContent.includes(term2.toLowerCase()) &&
          !lowerContent.includes('avoid') && 
          !lowerContent.includes('consult')) {
        warnings.push(`Mentions ${term1} and ${term2} without adequate warnings`);
      }
    });

    return warnings;
  }

  private assessReadingLevel(content: string): number {
    const words = content.split(/\s+/).length;
    const sentences = content.split(/[.!?]+/).length;
    const syllables = this.countSyllables(content);

    // Flesch Reading Ease to Grade Level approximation
    const fleschScore = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));
    const gradeLevel = Math.max(1, Math.min(16, Math.round(0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59)));
    
    return gradeLevel;
  }

  private countSyllables(text: string): number {
    const words: string[] = text.toLowerCase().match(/[a-z]+/g) || [];
    return words.reduce((total: number, word: string) => {
      const vowelMatches = word.match(/[aeiouy]+/g);
      const syllableCount = vowelMatches ? vowelMatches.length : 1;
      return total + Math.max(1, syllableCount);
    }, 0);
  }

  private checkLengthConstraints(content: string): string[] {
    const warnings: string[] = [];

    if (content.length > 5000) {
      warnings.push('Content exceeds recommended maximum length');
    }

    return warnings;
  }

  validateProviderContent(content: string): {
    isValid: boolean;
    warnings: string[];
    suggestions: string[];
  } {
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Check for overly definitive statements without evidence
    const definitiveStatements = this.checkDefinitiveStatements(content);
    warnings.push(...definitiveStatements);

    // Check for appropriate professional language
    const professionalLanguage = this.checkProfessionalLanguage(content);
    warnings.push(...professionalLanguage);

    // Check for evidence-based language
    const evidenceReferences = this.checkEvidenceBasedLanguage(content);
    if (evidenceReferences.length === 0) {
      suggestions.push('Consider adding references to evidence-based guidelines or literature');
    }

    // Check length for provider content
    if (content.length < 200) {
      warnings.push('Provider content may be too brief for clinical context');
    }

    return {
      isValid: warnings.length === 0,
      warnings,
      suggestions
    };
  }

  private checkDefinitiveStatements(content: string): string[] {
    const warnings: string[] = [];
    const definitiveTerms = ['always', 'never', 'all patients', 'no patients', 'guaranteed', 'certain'];
    const lowerContent = content.toLowerCase();

    definitiveTerms.forEach(term => {
      if (lowerContent.includes(term) && 
          !lowerContent.includes('may') && 
          !lowerContent.includes('typically') &&
          !lowerContent.includes('generally')) {
        warnings.push(`Contains definitive statement: "${term}" - consider more nuanced language`);
      }
    });

    return warnings;
  }

  private checkProfessionalLanguage(content: string): string[] {
    const warnings: string[] = [];
    const unprofessionalTerms = ['awesome', 'amazing', 'incredible', 'fantastic', 'terrible', 'awful'];
    const lowerContent = content.toLowerCase();

    unprofessionalTerms.forEach(term => {
      if (lowerContent.includes(term)) {
        warnings.push(`Contains unprofessional language: "${term}"`);
      }
    });

    return warnings;
  }

  private checkEvidenceBasedLanguage(content: string): string[] {
    const evidenceTerms = [
      'evidence', 'studies', 'research', 'clinical trial', 'guideline', 
      'literature', 'peer-reviewed', 'meta-analysis', 'systematic review',
      'according to', 'based on'
    ];
    const lowerContent = content.toLowerCase();

    return evidenceTerms.filter(term => lowerContent.includes(term));
  }

  private containsDangerousKeywords(text: string): boolean {
    const lowerText = text.toLowerCase();
    return this.dangerousKeywords.some(keyword => 
      lowerText.includes(keyword.toLowerCase())
    );
  }

  private containsMedicalDisclaimer(text: string): boolean {
    const lowerText = text.toLowerCase();
    return this.requiredDisclaimers.some(disclaimer =>
      lowerText.includes(disclaimer.toLowerCase())
    );
  }
}