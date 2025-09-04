import { ApiProperty } from '@nestjs/swagger';

export class Drug {
  @ApiProperty()
  id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  genericName?: string;

  @ApiProperty({ type: [String], required: false })
  brandNames?: string[];

  @ApiProperty({ required: false })
  fdaLabelData?: any;

  @ApiProperty({ required: false })
  aiEnhancedTitle?: string;

  @ApiProperty({ required: false })
  aiEnhancedDescription?: string;

  @ApiProperty({ required: false })
  seoMetaTitle?: string;

  @ApiProperty({ required: false })
  seoMetaDescription?: string;

  @ApiProperty()
  published: boolean;

  @ApiProperty()
  slug: string;
}