import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { DrugsService } from './drugs.service';
import { CreateDrugDto } from './dto/create-drug.dto';
import { UpdateDrugDto } from './dto/update-drug.dto';
import { ProcessFDALabelDto } from './dto/fda-label.dto';
import { Drug } from './entities/drug.entity';
import { RateLimitGuard, StandardRateLimit, AIRateLimit, SearchRateLimit } from '../common/guards/rate-limit.guard';

@ApiTags('drugs')
@Controller('drugs')
// @UseGuards(RateLimitGuard)
// @StandardRateLimit()
export class DrugsController {
  constructor(private readonly drugsService: DrugsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new drug' })
  @ApiResponse({ status: 201, description: 'Drug created successfully', type: Drug })
  create(@Body() createDrugDto: CreateDrugDto) {
    return this.drugsService.create(createDrugDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all drugs' })
  @ApiQuery({ name: 'published', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Drugs retrieved successfully', type: [Drug] })
  findAll(@Query('published') published?: string) {
    const publishedBool = published === 'true' ? true : published === 'false' ? false : undefined;
    return this.drugsService.findAll(publishedBool);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search drugs by name or generic name' })
  @ApiQuery({ name: 'query', required: true, type: String, description: 'Search query' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Maximum number of results' })
  @ApiQuery({ name: 'manufacturer', required: false, type: String, description: 'Filter by manufacturer' })
  @ApiQuery({ name: 'route', required: false, type: String, description: 'Filter by administration route' })
  @ApiResponse({ status: 200, description: 'Drugs found', type: [Drug] })
  // @SearchRateLimit()
  search(
    @Query('query') query: string,
    @Query('limit') limit?: string,
    @Query('manufacturer') manufacturer?: string,
    @Query('route') route?: string,
  ) {
    return this.drugsService.search(query, {
      limit: limit ? parseInt(limit, 10) : undefined,
      manufacturer,
      route,
    });
  }

  @Post('compare')
  @ApiOperation({ summary: 'Compare multiple drugs by IDs' })
  @ApiResponse({ status: 200, description: 'Drugs comparison data retrieved', type: [Drug] })
  @ApiResponse({ status: 400, description: 'Invalid drug IDs provided' })
  compare(@Body() drugIds: { ids: string[] }) {
    return this.drugsService.compareByIds(drugIds.ids);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get drug by slug' })
  @ApiResponse({ status: 200, description: 'Drug found', type: Drug })
  @ApiResponse({ status: 404, description: 'Drug not found' })
  findBySlug(@Param('slug') slug: string) {
    return this.drugsService.findBySlug(slug);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get drug by ID' })
  @ApiResponse({ status: 200, description: 'Drug found', type: Drug })
  @ApiResponse({ status: 404, description: 'Drug not found' })
  findOne(@Param('id') id: string) {
    return this.drugsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a drug' })
  @ApiResponse({ status: 200, description: 'Drug updated successfully', type: Drug })
  @ApiResponse({ status: 404, description: 'Drug not found' })
  update(@Param('id') id: string, @Body() updateDrugDto: UpdateDrugDto) {
    return this.drugsService.update(id, updateDrugDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a drug' })
  @ApiResponse({ status: 200, description: 'Drug deleted successfully' })
  @ApiResponse({ status: 404, description: 'Drug not found' })
  remove(@Param('id') id: string) {
    return this.drugsService.remove(id);
  }

  @Post('process-fda-label')
  @ApiOperation({ summary: 'Process FDA label data for a drug' })
  @ApiResponse({ status: 200, description: 'FDA label processed successfully', type: Drug })
  @ApiResponse({ status: 404, description: 'Drug not found' })
  @ApiResponse({ status: 400, description: 'Invalid FDA label data' })
  processFDALabel(@Body() processFDALabelDto: ProcessFDALabelDto) {
    return this.drugsService.processFDALabel(
      processFDALabelDto.drugId,
      processFDALabelDto.fdaLabel,
    );
  }

  @Post(':id/process-fda-label')
  @ApiOperation({ summary: 'Process FDA label data for a specific drug by ID' })
  @ApiResponse({ status: 200, description: 'FDA label processed successfully', type: Drug })
  @ApiResponse({ status: 404, description: 'Drug not found' })
  @ApiResponse({ status: 400, description: 'Invalid FDA label data' })
  processFDALabelById(@Param('id') id: string, @Body() fdaLabel: any) {
    return this.drugsService.processFDALabel(id, fdaLabel);
  }

  @Post(':id/enhance-with-ai')
  @ApiOperation({ summary: 'Enhance drug with AI-generated content' })
  @ApiResponse({ status: 200, description: 'Drug enhanced successfully', type: Drug })
  @ApiResponse({ status: 404, description: 'Drug not found' })
  @ApiResponse({ status: 400, description: 'AI enhancement failed' })
  // @AIRateLimit()
  enhanceDrugWithAI(@Param('id') id: string) {
    return this.drugsService.enhanceDrugWithAI(id);
  }

  @Post(':id/generate-seo')
  @ApiOperation({ summary: 'Generate SEO content for drug' })
  @ApiResponse({ status: 200, description: 'SEO content generated successfully' })
  @ApiResponse({ status: 404, description: 'Drug not found' })
  @ApiResponse({ status: 400, description: 'SEO generation failed' })
  // @AIRateLimit()
  generateSEOContent(@Param('id') id: string) {
    return this.drugsService.generateSEOContent(id);
  }
}