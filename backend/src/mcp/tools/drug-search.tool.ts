import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { McpToolDefinition, McpToolResult } from '../interfaces/mcp-protocol.interface';

@Injectable()
export class DrugSearchTool {
  private readonly logger = new Logger(DrugSearchTool.name);

  constructor(private prisma: PrismaService) {}

  getDefinition(): McpToolDefinition {
    return {
      name: 'search_drugs',
      description: 'Search for drugs by name, generic name, or brand name. Returns basic drug information.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query for drug name, generic name, or brand name',
          },
          limit: {
            type: 'integer',
            description: 'Maximum number of results to return (default: 10, max: 50)',
            minimum: 1,
            maximum: 50,
          },
          published: {
            type: 'boolean',
            description: 'Filter by published status (optional)',
          },
        },
        required: ['query'],
      },
    };
  }

  async execute(args: {
    query: string;
    limit?: number;
    published?: boolean;
  }): Promise<McpToolResult> {
    try {
      const { query, limit = 10, published } = args;
      
      this.logger.debug(`Searching drugs with query: "${query}"`);

      const searchLimit = Math.min(Math.max(1, limit), 50);

      const drugs = await this.prisma.drug.findMany({
        where: {
          AND: [
            published !== undefined ? { published } : {},
            {
              OR: [
                {
                  name: {
                    contains: query,
                    mode: 'insensitive',
                  },
                },
                {
                  genericName: {
                    contains: query,
                    mode: 'insensitive',
                  },
                },
                {
                  fdaGenericName: {
                    contains: query,
                    mode: 'insensitive',
                  },
                },
                {
                  fdaBrandName: {
                    contains: query,
                    mode: 'insensitive',
                  },
                },
                {
                  brandNames: {
                    hasSome: [query],
                  },
                },
              ],
            },
          ],
        },
        select: {
          id: true,
          name: true,
          genericName: true,
          fdaGenericName: true,
          fdaBrandName: true,
          brandNames: true,
          slug: true,
          published: true,
          manufacturer: true,
          route: true,
          createdAt: true,
          updatedAt: true,
        },
        take: searchLimit,
        orderBy: [
          { published: 'desc' },
          { updatedAt: 'desc' },
        ],
      });

      const resultText = this.formatSearchResults(drugs, query);

      return {
        content: [
          {
            type: 'text',
            text: resultText,
          },
        ],
      };
    } catch (error) {
      this.logger.error('Error executing drug search:', error);
      
      return {
        content: [
          {
            type: 'text',
            text: `Error searching drugs: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  private formatSearchResults(drugs: any[], query: string): string {
    if (drugs.length === 0) {
      return `No drugs found matching "${query}".`;
    }

    let result = `Found ${drugs.length} drug(s) matching "${query}":\n\n`;

    drugs.forEach((drug, index) => {
      result += `${index + 1}. **${drug.name}**\n`;
      
      if (drug.genericName || drug.fdaGenericName) {
        const genericName = drug.genericName || drug.fdaGenericName;
        result += `   Generic: ${genericName}\n`;
      }
      
      if (drug.fdaBrandName) {
        result += `   Brand: ${drug.fdaBrandName}\n`;
      }
      
      if (drug.brandNames && drug.brandNames.length > 0) {
        result += `   Other brands: ${drug.brandNames.join(', ')}\n`;
      }
      
      if (drug.manufacturer) {
        result += `   Manufacturer: ${drug.manufacturer}\n`;
      }
      
      if (drug.route) {
        result += `   Route: ${drug.route}\n`;
      }
      
      result += `   ID: ${drug.id}\n`;
      result += `   Slug: ${drug.slug}\n`;
      result += `   Published: ${drug.published ? 'Yes' : 'No'}\n`;
      result += `   Last updated: ${drug.updatedAt.toISOString().split('T')[0]}\n\n`;
    });

    result += `Use the "get_drug_details" tool with a drug ID to get comprehensive information about any specific drug.`;

    return result;
  }
}