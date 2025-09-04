import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly defaultTTL: number;
  private readonly memoryCache = new Map<string, { value: any; expires: number }>();

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
  ) {
    this.defaultTTL = this.configService.get<number>('AI_CACHE_TTL', 3600);
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const result = await this.cacheManager.get<T>(key);
      if (result) {
        this.logger.debug(`Cache hit for key: ${key}`);
        return result;
      }
    } catch (error) {
      this.logger.warn(`Cache get error for key ${key}: ${error.message}, using memory fallback`);
    }

    // Fallback to in-memory cache
    const cached = this.memoryCache.get(key);
    if (cached && cached.expires > Date.now()) {
      this.logger.debug(`Memory cache hit for key: ${key}`);
      return cached.value;
    }

    return null;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const finalTTL = ttl || this.defaultTTL;
    
    try {
      await this.cacheManager.set(key, value, finalTTL);
      this.logger.debug(`Cache set for key: ${key}`);
    } catch (error) {
      this.logger.warn(`Cache set error for key ${key}: ${error.message}, using memory fallback`);
    }

    // Always store in memory cache as backup
    this.memoryCache.set(key, {
      value,
      expires: Date.now() + (finalTTL * 1000)
    });
    this.logger.debug(`Memory cache set for key: ${key}`);
  }

  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Cache delete for key: ${key}`);
    } catch (error) {
      this.logger.error(`Cache delete error for key ${key}: ${error.message}`);
    }
  }

  async clear(): Promise<void> {
    try {
      await this.cacheManager.reset();
      this.memoryCache.clear();
      this.logger.debug('Cache cleared successfully');
    } catch (error) {
      this.logger.error(`Cache clear error: ${error.message}`);
      this.memoryCache.clear();
    }
  }

  async clearPattern(pattern: string): Promise<number> {
    try {
      // For Redis or other caches that support pattern matching
      // Note: This is a simplified implementation
      // In a real Redis implementation, you'd use KEYS or SCAN commands
      let clearedCount = 0;
      
      // Clear from memory cache first
      const memoryKeys = Array.from(this.memoryCache.keys());
      for (const key of memoryKeys) {
        if (this.matchesPattern(key, pattern)) {
          this.memoryCache.delete(key);
          clearedCount++;
        }
      }
      
      this.logger.debug(`Cleared ${clearedCount} entries matching pattern: ${pattern}`);
      return clearedCount;
    } catch (error) {
      this.logger.error(`Cache clear pattern error for ${pattern}: ${error.message}`);
      return 0;
    }
  }

  private matchesPattern(key: string, pattern: string): boolean {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(key);
  }

  generateCacheKey(prefix: string, data: any): string {
    const serialized = JSON.stringify(data);
    const hash = crypto.createHash('sha256').update(serialized).digest('hex');
    return `${prefix}:${hash}`;
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    let cached = await this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttl);
    
    return value;
  }

  async preWarmProviderExplanations(): Promise<void> {
    this.logger.log('Pre-warming cache with common provider explanations...');
    
    const commonExplanations = [
      {
        topic: 'Hypertension Management',
        type: 'medical_condition' as const,
        drugName: 'Lisinopril',
        indication: 'blood pressure control',
        targetAudience: 'primary_care' as const,
        explanation: 'Hypertension is a chronic medical condition characterized by persistently elevated blood pressure readings of 140/90 mmHg or higher. It is often called the "silent killer" because it typically presents without symptoms while causing significant cardiovascular damage. Primary hypertension accounts for 90-95% of cases and has no identifiable cause, while secondary hypertension results from underlying conditions such as kidney disease, endocrine disorders, or medication effects.',
        keyPoints: [
          'Target blood pressure goals vary by patient population: <130/80 mmHg for most adults, <140/90 mmHg for adults ≥60 years without diabetes or CKD',
          'First-line medications include ACE inhibitors, ARBs, calcium channel blockers, and thiazide-type diuretics',
          'Lifestyle modifications are essential: DASH diet, sodium reduction (<2.3g daily), regular exercise, weight management, and alcohol limitation',
          'Regular monitoring is crucial with home BP measurements and periodic in-office assessments'
        ],
        clinicalContext: 'Hypertension management requires a comprehensive approach combining pharmacological and non-pharmacological interventions. The 2017 AHA/ACC guidelines lowered the threshold for hypertension diagnosis, emphasizing earlier intervention to prevent cardiovascular events. ACE inhibitors like lisinopril are particularly effective as first-line therapy due to their cardio-renal protective effects and favorable side effect profile.',
        practiceConsiderations: [
          'Screen for white coat hypertension and masked hypertension using ambulatory or home BP monitoring',
          'Assess for target organ damage with ECG, urinalysis, and basic metabolic panel',
          'Consider combination therapy if BP remains elevated after 4-6 weeks of monotherapy',
          'Monitor for medication adherence and discuss common side effects',
          'Schedule follow-up visits every 4-6 weeks until BP is controlled, then every 3-6 months'
        ]
      },
      {
        topic: 'ACE Inhibitor Mechanism',
        type: 'drug_mechanism' as const,
        drugName: 'Lisinopril',
        targetAudience: 'pharmacy' as const,
        explanation: 'ACE inhibitors like lisinopril work by blocking the angiotensin-converting enzyme, which is responsible for converting angiotensin I to angiotensin II. This mechanism interrupts the renin-angiotensin-aldosterone system (RAAS), a critical pathway in blood pressure regulation and fluid balance. By reducing angiotensin II production, ACE inhibitors decrease vasoconstriction, aldosterone release, and sodium retention.',
        keyPoints: [
          'Blocks conversion of angiotensin I to angiotensin II by inhibiting ACE enzyme',
          'Reduces peripheral vascular resistance through decreased vasoconstriction',
          'Decreases aldosterone production, leading to reduced sodium and water retention',
          'Increases bradykinin levels, contributing to vasodilation and potential side effects like dry cough'
        ],
        clinicalContext: 'The RAAS system is fundamental to cardiovascular homeostasis. ACE inhibitors provide both immediate hemodynamic benefits and long-term organ protection. The elevation of bradykinin levels explains both therapeutic benefits (vasodilation) and the characteristic dry cough seen in 10-15% of patients. This mechanism also underlies the cardio-renal protective effects that extend beyond blood pressure reduction.',
        practiceConsiderations: [
          'Monitor for hyperkalemia, especially in patients with kidney disease or those taking potassium supplements',
          'Watch for the development of dry cough (10-15% incidence) and consider ARB if problematic',
          'Be aware of potential for angioedema, particularly in African American patients',
          'Counsel patients on the importance of consistent timing and adherence for optimal BP control',
          'Consider dose adjustments in renal impairment and monitor creatinine levels'
        ]
      },
      {
        topic: 'Diabetes Type 2 Management',
        type: 'medical_condition' as const,
        drugName: 'Metformin',
        indication: 'glucose control',
        targetAudience: 'primary_care' as const,
        explanation: 'Type 2 diabetes mellitus is a progressive metabolic disorder characterized by insulin resistance and relative insulin deficiency. Unlike Type 1 diabetes, patients retain some pancreatic beta-cell function initially. The condition develops when insulin resistance in peripheral tissues combines with inadequate compensatory insulin secretion, leading to chronic hyperglycemia and associated complications.',
        keyPoints: [
          'First-line pharmacotherapy is metformin unless contraindicated or not tolerated',
          'HbA1c targets are typically <7% for most adults, but individualized based on patient factors',
          'Comprehensive diabetes care includes cardiovascular risk reduction and screening for complications',
          'Lifestyle modifications remain fundamental: medical nutrition therapy, regular physical activity, weight management'
        ],
        clinicalContext: 'The 2023 ADA Standards of Care emphasize a patient-centered approach to diabetes management. Metformin remains the preferred initial medication due to its efficacy, safety profile, potential cardiovascular benefits, and cost-effectiveness. The progressive nature of Type 2 diabetes often requires combination therapy over time as beta-cell function declines.',
        practiceConsiderations: [
          'Screen for diabetic complications annually: retinopathy, nephropathy, neuropathy, and cardiovascular disease',
          'Monitor HbA1c every 3-6 months depending on glycemic control and treatment changes',
          'Consider SGLT-2 inhibitors or GLP-1 agonists for patients with established cardiovascular disease',
          'Provide diabetes self-management education and support (DSMES)',
          'Address cardiovascular risk factors: blood pressure, lipids, aspirin therapy when appropriate'
        ]
      }
    ];

    for (const explanation of commonExplanations) {
      const key = this.generateCacheKey('provider-explanation', {
        topic: explanation.topic,
        type: explanation.type,
        drugName: explanation.drugName,
        indication: explanation.indication,
        targetAudience: explanation.targetAudience
      });

      await this.set(key, {
        explanation: explanation.explanation,
        keyPoints: explanation.keyPoints,
        clinicalContext: explanation.clinicalContext,
        practiceConsiderations: explanation.practiceConsiderations
      }, 86400); // Cache for 24 hours
    }

    this.logger.log(`Pre-warmed ${commonExplanations.length} provider explanations`);
  }
}