import { IsString, IsArray, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FDALabelSectionDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  text?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  items?: string[];
}

export class FDALabelIndicationsDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  usage?: string;

  @ApiPropertyOptional({ type: FDALabelSectionDto })
  @ValidateNested()
  @Type(() => FDALabelSectionDto)
  @IsOptional()
  indications_and_usage?: FDALabelSectionDto;
}

export class FDALabelWarningsDto {
  @ApiPropertyOptional({ type: FDALabelSectionDto })
  @ValidateNested()
  @Type(() => FDALabelSectionDto)
  @IsOptional()
  warnings?: FDALabelSectionDto;

  @ApiPropertyOptional({ type: FDALabelSectionDto })
  @ValidateNested()
  @Type(() => FDALabelSectionDto)
  @IsOptional()
  warnings_and_precautions?: FDALabelSectionDto;

  @ApiPropertyOptional({ type: FDALabelSectionDto })
  @ValidateNested()
  @Type(() => FDALabelSectionDto)
  @IsOptional()
  boxed_warning?: FDALabelSectionDto;
}

export class FDALabelContraindicationsDto {
  @ApiPropertyOptional({ type: FDALabelSectionDto })
  @ValidateNested()
  @Type(() => FDALabelSectionDto)
  @IsOptional()
  contraindications?: FDALabelSectionDto;
}

export class FDALabelDosageDto {
  @ApiPropertyOptional({ type: FDALabelSectionDto })
  @ValidateNested()
  @Type(() => FDALabelSectionDto)
  @IsOptional()
  dosage_and_administration?: FDALabelSectionDto;

  @ApiPropertyOptional({ type: FDALabelSectionDto })
  @ValidateNested()
  @Type(() => FDALabelSectionDto)
  @IsOptional()
  dosage_forms_and_strengths?: FDALabelSectionDto;
}

export class FDALabelAdverseReactionsDto {
  @ApiPropertyOptional({ type: FDALabelSectionDto })
  @ValidateNested()
  @Type(() => FDALabelSectionDto)
  @IsOptional()
  adverse_reactions?: FDALabelSectionDto;
}

export class FDALabelDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  generic_name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  brand_name?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  brand_name_suffix?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  route?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  manufacturer?: string;

  @ApiPropertyOptional({ type: FDALabelIndicationsDto })
  @ValidateNested()
  @Type(() => FDALabelIndicationsDto)
  @IsOptional()
  indications?: FDALabelIndicationsDto;

  @ApiPropertyOptional({ type: FDALabelWarningsDto })
  @ValidateNested()
  @Type(() => FDALabelWarningsDto)
  @IsOptional()
  warnings?: FDALabelWarningsDto;

  @ApiPropertyOptional({ type: FDALabelContraindicationsDto })
  @ValidateNested()
  @Type(() => FDALabelContraindicationsDto)
  @IsOptional()
  contraindications?: FDALabelContraindicationsDto;

  @ApiPropertyOptional({ type: FDALabelDosageDto })
  @ValidateNested()
  @Type(() => FDALabelDosageDto)
  @IsOptional()
  dosage?: FDALabelDosageDto;

  @ApiPropertyOptional({ type: FDALabelAdverseReactionsDto })
  @ValidateNested()
  @Type(() => FDALabelAdverseReactionsDto)
  @IsOptional()
  adverse_reactions?: FDALabelAdverseReactionsDto;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  raw_data?: any;
}

export class ProcessFDALabelDto {
  @ApiProperty()
  @IsString()
  drugId: string;

  @ApiProperty({ type: FDALabelDto })
  @ValidateNested()
  @Type(() => FDALabelDto)
  fdaLabel: FDALabelDto;
}