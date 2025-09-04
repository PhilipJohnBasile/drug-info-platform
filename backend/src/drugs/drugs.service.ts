import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDrugDto } from './dto/create-drug.dto';
import { UpdateDrugDto } from './dto/update-drug.dto';
import { FDALabelDto } from './dto/fda-label.dto';
import { DataSanitizer } from '../common/utils/data-sanitizer.util';
import { AiServiceService } from '../ai-service/ai-service.service';
import { DrugContentContext } from '../ai-service/interfaces/ai-provider.interface';

@Injectable()
export class DrugsService {
  private readonly logger = new Logger(DrugsService.name);
  
  constructor(
    private prisma: PrismaService,
    private aiService: AiServiceService,
  ) {}

  async create(createDrugDto: CreateDrugDto) {
    return this.prisma.drug.create({
      data: createDrugDto,
      include: {
        faqs: true,
      },
    });
  }

  async findAll(published?: boolean) {
    return this.prisma.drug.findMany({
      where: published !== undefined ? { published } : undefined,
      include: {
        faqs: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async search(query: string, options?: {
    limit?: number;
    manufacturer?: string;
    route?: string;
  }) {
    const { limit = 20, manufacturer, route } = options || {};
    
    const whereClause: any = {
      published: true,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { genericName: { contains: query, mode: 'insensitive' } },
        { fdaBrandName: { contains: query, mode: 'insensitive' } },
        { manufacturer: { contains: query, mode: 'insensitive' } },
      ],
    };

    if (manufacturer) {
      whereClause.manufacturer = { contains: manufacturer, mode: 'insensitive' };
    }

    if (route) {
      whereClause.route = { contains: route, mode: 'insensitive' };
    }

    return this.prisma.drug.findMany({
      where: whereClause,
      include: {
        faqs: true,
      },
      take: limit,
      orderBy: [
        { name: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async compareByIds(drugIds: string[]) {
    if (!drugIds || drugIds.length === 0) {
      throw new BadRequestException('At least one drug ID is required');
    }

    if (drugIds.length > 4) {
      throw new BadRequestException('Maximum of 4 drugs can be compared at once');
    }

    const drugs = await this.prisma.drug.findMany({
      where: {
        id: { in: drugIds },
        published: true,
      },
      include: {
        faqs: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Check if all requested drugs were found
    const foundIds = drugs.map(drug => drug.id);
    const notFoundIds = drugIds.filter(id => !foundIds.includes(id));
    
    if (notFoundIds.length > 0) {
      this.logger.warn(`Drugs not found for comparison: ${notFoundIds.join(', ')}`);
      // Still return found drugs instead of throwing an error
    }

    return drugs;
  }

  async findOne(id: string) {
    const drug = await this.prisma.drug.findUnique({
      where: { id },
      include: {
        faqs: true,
      },
    });

    if (!drug) {
      throw new NotFoundException(`Drug with ID ${id} not found`);
    }

    return drug;
  }

  async findBySlug(slug: string) {
    const drug = await this.prisma.drug.findUnique({
      where: { slug },
      include: {
        faqs: true,
      },
    });

    if (!drug) {
      throw new NotFoundException(`Drug with slug ${slug} not found`);
    }

    return drug;
  }

  async update(id: string, updateDrugDto: UpdateDrugDto) {
    const drug = await this.prisma.drug.findUnique({
      where: { id },
    });

    if (!drug) {
      throw new NotFoundException(`Drug with ID ${id} not found`);
    }

    return this.prisma.drug.update({
      where: { id },
      data: updateDrugDto,
      include: {
        faqs: true,
      },
    });
  }

  async remove(id: string) {
    const drug = await this.prisma.drug.findUnique({
      where: { id },
    });

    if (!drug) {
      throw new NotFoundException(`Drug with ID ${id} not found`);
    }

    return this.prisma.drug.delete({
      where: { id },
    });
  }

  async processFDALabel(drugId: string, fdaLabel: FDALabelDto | any) {
    try {
      const drug = await this.findOne(drugId);
      
      if (!drug) {
        throw new NotFoundException(`Drug with ID ${drugId} not found`);
      }

      const sanitizedLabel = DataSanitizer.validateAndCleanFDALabel(fdaLabel);
      
      if (!sanitizedLabel) {
        this.logger.warn(`No valid FDA label data provided for drug ${drugId}`);
        throw new BadRequestException('No valid FDA label data provided');
      }

      const parsedData = this.parseFDALabelData(sanitizedLabel);
      
      const updateData = {
        fdaLabelData: sanitizedLabel.raw_data || sanitizedLabel,
        fdaGenericName: DataSanitizer.sanitizeString(sanitizedLabel.generic_name),
        fdaBrandName: DataSanitizer.sanitizeString(sanitizedLabel.brand_name),
        manufacturer: DataSanitizer.sanitizeString(sanitizedLabel.manufacturer),
        route: DataSanitizer.sanitizeString(sanitizedLabel.route),
        indications: parsedData.indications,
        contraindications: parsedData.contraindications,
        warnings: parsedData.warnings,
        boxedWarning: parsedData.boxedWarning,
        dosageInfo: parsedData.dosageInfo,
        adverseReactions: parsedData.adverseReactions,
      };

      this.logger.log(`Processing FDA label for drug ${drugId}`, {
        hasIndications: !!updateData.indications,
        hasWarnings: !!updateData.warnings,
        hasContraindications: !!updateData.contraindications,
      });

      return await this.prisma.drug.update({
        where: { id: drugId },
        data: updateData,
        include: {
          faqs: true,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      
      this.logger.error(`Error processing FDA label for drug ${drugId}:`, error);
      throw new BadRequestException('Failed to process FDA label data');
    }
  }

  private parseFDALabelData(fdaLabel: FDALabelDto) {
    return {
      indications: this.extractIndications(fdaLabel.indications),
      contraindications: this.extractContraindications(fdaLabel.contraindications),
      warnings: this.extractWarnings(fdaLabel.warnings),
      boxedWarning: this.extractBoxedWarning(fdaLabel.warnings),
      dosageInfo: this.extractDosageInfo(fdaLabel.dosage),
      adverseReactions: this.extractAdverseReactions(fdaLabel.adverse_reactions),
    };
  }

  private extractIndications(indications: any): string | null {
    if (!indications) return null;
    
    try {
      return DataSanitizer.extractTextContent(indications);
    } catch (error) {
      this.logger.warn('Error extracting indications:', error);
      return null;
    }
  }

  private extractContraindications(contraindications: any): string | null {
    if (!contraindications) return null;
    
    try {
      return DataSanitizer.extractTextContent(contraindications.contraindications || contraindications);
    } catch (error) {
      this.logger.warn('Error extracting contraindications:', error);
      return null;
    }
  }

  private extractWarnings(warnings: any): string | null {
    if (!warnings) return null;
    
    try {
      const warningTexts = [];
      
      const warningsContent = DataSanitizer.extractTextContent(warnings.warnings);
      if (warningsContent) warningTexts.push(warningsContent);
      
      const precautionsContent = DataSanitizer.extractTextContent(warnings.warnings_and_precautions);
      if (precautionsContent) warningTexts.push(precautionsContent);
      
      return warningTexts.length > 0 ? warningTexts.join('. ') : null;
    } catch (error) {
      this.logger.warn('Error extracting warnings:', error);
      return null;
    }
  }

  private extractBoxedWarning(warnings: any): string | null {
    if (!warnings?.boxed_warning) return null;
    
    try {
      return DataSanitizer.extractTextContent(warnings.boxed_warning);
    } catch (error) {
      this.logger.warn('Error extracting boxed warning:', error);
      return null;
    }
  }

  private extractDosageInfo(dosage: any): string | null {
    if (!dosage) return null;
    
    try {
      const dosageTexts = [];
      
      const administrationContent = DataSanitizer.extractTextContent(dosage.dosage_and_administration);
      if (administrationContent) dosageTexts.push(administrationContent);
      
      const formsContent = DataSanitizer.extractTextContent(dosage.dosage_forms_and_strengths);
      if (formsContent) dosageTexts.push(formsContent);
      
      return dosageTexts.length > 0 ? dosageTexts.join('. ') : null;
    } catch (error) {
      this.logger.warn('Error extracting dosage info:', error);
      return null;
    }
  }

  private extractAdverseReactions(adverseReactions: any): string | null {
    if (!adverseReactions) return null;
    
    try {
      return DataSanitizer.extractTextContent(adverseReactions.adverse_reactions || adverseReactions);
    } catch (error) {
      this.logger.warn('Error extracting adverse reactions:', error);
      return null;
    }
  }

  async enhanceDrugWithAI(drugId: string) {
    try {
      const drug = await this.findOne(drugId);
      
      if (!drug) {
        throw new NotFoundException(`Drug with ID ${drugId} not found`);
      }

      const context: DrugContentContext = {
        drugName: drug.name,
        genericName: drug.genericName || drug.fdaGenericName || undefined,
        brandNames: drug.brandNames || (drug.fdaBrandName ? [drug.fdaBrandName] : undefined),
        indications: drug.indications || undefined,
        contraindications: drug.contraindications || undefined,
        warnings: drug.warnings || undefined,
        dosageInfo: drug.dosageInfo || undefined,
        adverseReactions: drug.adverseReactions || undefined,
        manufacturer: drug.manufacturer || undefined,
      };

      this.logger.log(`Enhancing drug ${drugId} with AI-generated content`);

      const enhancedContent = await this.aiService.enhanceDrugContent(
        drug.name,
        drug.fdaLabelData,
        context
      );

      // Create FAQs if they were generated
      const faqsToCreate = enhancedContent.faqs.map(faq => ({
        question: faq.question,
        answer: faq.answer,
        drugId: drugId,
      }));

      // Update drug with AI-enhanced content
      const updatedDrug = await this.prisma.drug.update({
        where: { id: drugId },
        data: {
          aiEnhancedTitle: enhancedContent.title,
          aiEnhancedDescription: enhancedContent.description,
          seoMetaTitle: enhancedContent.seoMetaTitle,
          seoMetaDescription: enhancedContent.seoMetaDescription,
          faqs: {
            deleteMany: {},
            create: faqsToCreate,
          },
        },
        include: {
          faqs: true,
        },
      });

      this.logger.log(`Successfully enhanced drug ${drugId} with AI content`);
      return updatedDrug;

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.error(`Error enhancing drug ${drugId} with AI:`, error);
      throw new BadRequestException('Failed to enhance drug with AI content');
    }
  }

  async generateSEOContent(drugId: string) {
    try {
      const drug = await this.findOne(drugId);
      
      if (!drug) {
        throw new NotFoundException(`Drug with ID ${drugId} not found`);
      }

      const context: DrugContentContext = {
        drugName: drug.name,
        genericName: drug.genericName || drug.fdaGenericName || undefined,
        brandNames: drug.brandNames || (drug.fdaBrandName ? [drug.fdaBrandName] : undefined),
        indications: drug.indications || undefined,
        contraindications: drug.contraindications || undefined,
        warnings: drug.warnings || undefined,
        dosageInfo: drug.dosageInfo || undefined,
        adverseReactions: drug.adverseReactions || undefined,
        manufacturer: drug.manufacturer || undefined,
      };

      const [seoTitle, metaDescription] = await Promise.all([
        this.aiService.generateSEOTitle(context),
        this.aiService.generateMetaDescription(context),
      ]);

      const updatedDrug = await this.prisma.drug.update({
        where: { id: drugId },
        data: {
          seoMetaTitle: seoTitle,
          seoMetaDescription: metaDescription,
        },
        include: {
          faqs: true,
        },
      });

      return {
        drug: updatedDrug,
        seoContent: {
          title: seoTitle,
          metaDescription: metaDescription,
        },
      };

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.error(`Error generating SEO content for drug ${drugId}:`, error);
      throw new BadRequestException('Failed to generate SEO content');
    }
  }
}