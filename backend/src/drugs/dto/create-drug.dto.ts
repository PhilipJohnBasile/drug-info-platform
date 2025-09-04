import { IsString, IsOptional, IsArray, IsObject, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDrugDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  genericName?: string;

  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  brandNames?: string[];

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  fdaLabelData?: any;

  @ApiProperty()
  @IsString()
  slug: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  published?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  aiEnhancedTitle?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  aiEnhancedDescription?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  seoMetaTitle?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  seoMetaDescription?: string;
}