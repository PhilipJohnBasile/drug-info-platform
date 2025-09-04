export interface AIProvider {
  generateContent(prompt: string, options?: AIGenerationOptions): Promise<string>;
  isHealthy(): Promise<boolean>;
  getProviderName(): string;
}

export interface AIGenerationOptions {
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

export interface EnhancedDrugContent {
  seoTitle: string;
  metaDescription: string;
  patientFriendlyDescription: string;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
}

export interface DrugContentContext {
  drugName: string;
  genericName?: string;
  brandNames?: string[];
  indications?: string;
  contraindications?: string;
  warnings?: string;
  dosageInfo?: string;
  adverseReactions?: string;
  manufacturer?: string;
  route?: string;
}