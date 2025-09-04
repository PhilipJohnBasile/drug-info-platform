import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { McpResourceDefinition, McpResourceContent } from '../interfaces/mcp-protocol.interface';

@Injectable()
export class DrugListResource {
  private readonly logger = new Logger(DrugListResource.name);

  constructor(private prisma: PrismaService) {}

  getDefinition(): McpResourceDefinition {
    return {
      uri: 'drugs://list',
      name: 'Drug List',
      description: 'Complete list of all available drugs with basic information',
      mimeType: 'application/json',
    };
  }

  async getContent(): Promise<McpResourceContent> {
    try {
      this.logger.debug('Generating drug list resource');

      const drugs = await this.prisma.drug.findMany({
        where: { published: true },
        select: {
          id: true,
          name: true,
          genericName: true,
          fdaGenericName: true,
          fdaBrandName: true,
          brandNames: true,
          slug: true,
          manufacturer: true,
          route: true,
          published: true,
          updatedAt: true,
        },
        orderBy: [
          { name: 'asc' },
        ],
      });

      const drugList = {
        total: drugs.length,
        lastUpdated: new Date().toISOString(),
        drugs: drugs.map(drug => ({
          id: drug.id,
          name: drug.name,
          genericName: drug.genericName || drug.fdaGenericName || null,
          brandName: drug.fdaBrandName || null,
          brandNames: drug.brandNames || [],
          slug: drug.slug,
          manufacturer: drug.manufacturer || null,
          route: drug.route || null,
          lastUpdated: drug.updatedAt.toISOString(),
        })),
      };

      return {
        uri: 'drugs://list',
        mimeType: 'application/json',
        text: JSON.stringify(drugList, null, 2),
      };
    } catch (error) {
      this.logger.error('Error generating drug list resource:', error);
      
      return {
        uri: 'drugs://list',
        mimeType: 'application/json',
        text: JSON.stringify({
          error: 'Failed to generate drug list',
          message: error.message,
        }, null, 2),
      };
    }
  }
}