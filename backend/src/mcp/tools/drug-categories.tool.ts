import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { McpToolDefinition, McpToolResult } from '../interfaces/mcp-protocol.interface';

@Injectable()
export class DrugCategoriesTool {
  private readonly logger = new Logger(DrugCategoriesTool.name);

  constructor(private prisma: PrismaService) {}

  getDefinition(): McpToolDefinition {
    return {
      name: 'get_drug_categories',
      description: 'Get available drug categories and statistics about the drug database.',
      inputSchema: {
        type: 'object',
        properties: {
          includeStats: {
            type: 'boolean',
            description: 'Whether to include detailed statistics (default: true)',
          },
        },
      },
    };
  }

  async execute(args: { includeStats?: boolean } = {}): Promise<McpToolResult> {
    try {
      const { includeStats = true } = args;
      
      this.logger.debug('Getting drug categories and statistics');

      let resultText = '# Drug Database Overview\n\n';

      if (includeStats) {
        const stats = await this.getDatabaseStats();
        resultText += this.formatStats(stats);
      }

      const categories = await this.getDrugCategories();
      resultText += this.formatCategories(categories);

      return {
        content: [
          {
            type: 'text',
            text: resultText,
          },
        ],
      };
    } catch (error) {
      this.logger.error('Error executing drug categories retrieval:', error);
      
      return {
        content: [
          {
            type: 'text',
            text: `Error retrieving drug categories: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async getDatabaseStats() {
    const [
      totalDrugs,
      publishedDrugs,
      drugsWithFDAData,
      drugsWithAIContent,
      drugsWithFAQs,
      totalFAQs,
    ] = await Promise.all([
      this.prisma.drug.count(),
      this.prisma.drug.count({ where: { published: true } }),
      this.prisma.drug.count({
        where: {
          OR: [
            { fdaLabelData: { not: null } },
            { indications: { not: null } },
            { contraindications: { not: null } },
            { warnings: { not: null } },
          ],
        },
      }),
      this.prisma.drug.count({
        where: {
          OR: [
            { aiEnhancedTitle: { not: null } },
            { aiEnhancedDescription: { not: null } },
            { seoMetaTitle: { not: null } },
          ],
        },
      }),
      this.prisma.drug.count({
        where: {
          faqs: {
            some: {},
          },
        },
      }),
      this.prisma.drugFAQ.count(),
    ]);

    return {
      totalDrugs,
      publishedDrugs,
      drugsWithFDAData,
      drugsWithAIContent,
      drugsWithFAQs,
      totalFAQs,
    };
  }

  private async getDrugCategories() {
    // Get unique manufacturers
    const manufacturersResult = await this.prisma.drug.groupBy({
      by: ['manufacturer'],
      where: {
        manufacturer: { not: null },
        published: true,
      },
      _count: {
        manufacturer: true,
      },
      orderBy: {
        _count: {
          manufacturer: 'desc',
        },
      },
      take: 10,
    });

    // Get unique routes
    const routesResult = await this.prisma.drug.groupBy({
      by: ['route'],
      where: {
        route: { not: null },
        published: true,
      },
      _count: {
        route: true,
      },
      orderBy: {
        _count: {
          route: 'desc',
        },
      },
      take: 10,
    });

    // Get drugs with boxed warnings
    const boxedWarningsCount = await this.prisma.drug.count({
      where: {
        boxedWarning: { not: null },
        published: true,
      },
    });

    return {
      manufacturers: manufacturersResult.map(item => ({
        name: item.manufacturer,
        count: item._count.manufacturer,
      })),
      routes: routesResult.map(item => ({
        name: item.route,
        count: item._count.route,
      })),
      boxedWarningsCount,
    };
  }

  private formatStats(stats: any): string {
    let result = '## Database Statistics\n\n';
    
    result += `- **Total drugs**: ${stats.totalDrugs}\n`;
    result += `- **Published drugs**: ${stats.publishedDrugs}\n`;
    result += `- **Drugs with FDA data**: ${stats.drugsWithFDAData}\n`;
    result += `- **Drugs with AI content**: ${stats.drugsWithAIContent}\n`;
    result += `- **Drugs with FAQs**: ${stats.drugsWithFAQs}\n`;
    result += `- **Total FAQs**: ${stats.totalFAQs}\n\n`;

    return result;
  }

  private formatCategories(categories: any): string {
    let result = '## Drug Categories\n\n';

    if (categories.manufacturers.length > 0) {
      result += '### Top Manufacturers\n';
      categories.manufacturers.forEach((manufacturer, index) => {
        result += `${index + 1}. **${manufacturer.name}** (${manufacturer.count} drugs)\n`;
      });
      result += '\n';
    }

    if (categories.routes.length > 0) {
      result += '### Routes of Administration\n';
      categories.routes.forEach((route, index) => {
        result += `${index + 1}. **${route.name}** (${route.count} drugs)\n`;
      });
      result += '\n';
    }

    if (categories.boxedWarningsCount > 0) {
      result += `### Special Categories\n`;
      result += `- **Drugs with Boxed Warnings**: ${categories.boxedWarningsCount}\n\n`;
    }

    result += '## Available Tools\n\n';
    result += 'Use these tools to explore the drug database:\n';
    result += '- `search_drugs` - Search for drugs by name\n';
    result += '- `get_drug_details` - Get comprehensive drug information\n';
    result += '- `get_drug_categories` - Get this overview (current tool)\n\n';

    return result;
  }
}