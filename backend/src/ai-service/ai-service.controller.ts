import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray } from 'class-validator';
import { AiServiceService } from './ai-service.service';

class EnhanceDrugContentDto {
  @IsString()
  drugName: string;

  @IsOptional()
  fdaLabelData?: any;

  @IsOptional()
  @IsString()
  genericName?: string;

  @IsOptional()
  @IsArray()
  brandNames?: string[];

  @IsOptional()
  @IsString()
  indications?: string;

  @IsOptional()
  @IsString()
  contraindications?: string;

  @IsOptional()
  @IsString()
  warnings?: string;

  @IsOptional()
  @IsString()
  dosageInfo?: string;

  @IsOptional()
  @IsString()
  adverseReactions?: string;

  @IsOptional()
  @IsString()
  manufacturer?: string;
}

class GenerateProviderExplanationDto {
  @IsString()
  topic: string;

  @IsString()
  type: 'medical_condition' | 'drug_mechanism' | 'treatment_approach' | 'pharmacology';

  @IsOptional()
  @IsString()
  drugName?: string;

  @IsOptional()
  @IsString()
  indication?: string;

  @IsOptional()
  @IsString()
  targetAudience?: 'primary_care' | 'specialist' | 'pharmacy' | 'general_healthcare';
}

class GenerateRelatedContentDto {
  @IsString()
  drugName: string;

  @IsOptional()
  @IsString()
  genericName?: string;

  @IsOptional()
  @IsArray()
  brandNames?: string[];

  @IsOptional()
  @IsString()
  indications?: string;

  @IsOptional()
  @IsString()
  contraindications?: string;

  @IsOptional()
  @IsString()
  warnings?: string;

  @IsOptional()
  @IsString()
  dosageInfo?: string;

  @IsOptional()
  @IsString()
  adverseReactions?: string;

  @IsOptional()
  @IsString()
  manufacturer?: string;
}

@ApiTags('ai-service')
@Controller('ai-service')
export class AiServiceController {
  constructor(private readonly aiServiceService: AiServiceService) {}

  @Post('enhance-drug-content')
  @ApiOperation({ summary: 'Enhance drug content with AI' })
  @ApiResponse({ status: 200, description: 'Content enhanced successfully' })
  enhanceDrugContent(@Body() dto: EnhanceDrugContentDto) {
    const drugContext = {
      genericName: dto.genericName,
      brandNames: dto.brandNames,
      indications: dto.indications,
      contraindications: dto.contraindications,
      warnings: dto.warnings,
      dosageInfo: dto.dosageInfo,
      adverseReactions: dto.adverseReactions,
      manufacturer: dto.manufacturer,
    };
    return this.aiServiceService.enhanceDrugContent(dto.drugName, dto.fdaLabelData, drugContext);
  }

  @Post('generate-provider-explanation')
  @ApiOperation({ summary: 'Generate provider-friendly explanations for medical conditions and drug mechanisms' })
  @ApiResponse({ status: 200, description: 'Provider explanation generated successfully' })
  generateProviderExplanation(@Body() dto: GenerateProviderExplanationDto) {
    return this.aiServiceService.generateProviderExplanation(
      dto.topic,
      dto.type,
      {
        drugName: dto.drugName,
        indication: dto.indication,
        targetAudience: dto.targetAudience || 'general_healthcare'
      }
    );
  }

  @Post('generate-related-content')
  @ApiOperation({ summary: 'Generate related content suggestions for drugs using AI' })
  @ApiResponse({ status: 200, description: 'Related content suggestions generated successfully' })
  generateRelatedContent(@Body() dto: GenerateRelatedContentDto) {
    // Generate related content for the drug
    const drugContext = {
      genericName: dto.genericName,
      brandNames: dto.brandNames,
      indications: dto.indications,
      contraindications: dto.contraindications,
      warnings: dto.warnings,
      dosageInfo: dto.dosageInfo,
      adverseReactions: dto.adverseReactions,
      manufacturer: dto.manufacturer,
    };
    return this.aiServiceService.generateRelatedContentSuggestions(dto.drugName, drugContext);
  }
}