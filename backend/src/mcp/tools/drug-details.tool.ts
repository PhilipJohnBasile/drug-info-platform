import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { McpToolDefinition, McpToolResult } from '../interfaces/mcp-protocol.interface';

@Injectable()
export class DrugDetailsTool {
  private readonly logger = new Logger(DrugDetailsTool.name);

  constructor(private prisma: PrismaService) {}

  getDefinition(): McpToolDefinition {
    return {
      name: 'get_drug_details',
      description: 'Get comprehensive details about a specific drug including FDA label information, AI-enhanced content, and FAQs.',
      inputSchema: {
        type: 'object',
        properties: {
          drugId: {
            type: 'string',
            description: 'The unique ID of the drug to retrieve details for',
          },
          includeRawFDAData: {
            type: 'boolean',
            description: 'Whether to include raw FDA label JSON data (default: false)',
          },
        },
        required: ['drugId'],
      },
    };
  }

  async execute(args: {
    drugId: string;
    includeRawFDAData?: boolean;
  }): Promise<McpToolResult> {
    try {
      const { drugId, includeRawFDAData = false } = args;
      
      this.logger.debug(`Getting drug details for ID: ${drugId}`);

      const drug = await this.prisma.drug.findUnique({
        where: { id: drugId },
        include: {
          faqs: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!drug) {
        return {
          content: [
            {
              type: 'text',
              text: `Drug with ID "${drugId}" not found.`,
            },
          ],
          isError: true,
        };
      }

      const resultText = this.formatDrugDetails(drug, includeRawFDAData);

      return {
        content: [
          {
            type: 'text',
            text: resultText,
          },
        ],
      };
    } catch (error) {
      this.logger.error('Error executing drug details retrieval:', error);
      
      return {
        content: [
          {
            type: 'text',
            text: `Error retrieving drug details: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  private formatDrugDetails(drug: any, includeRawFDAData: boolean): string {
    let result = `# ${drug.name}\n\n`;

    // Basic Information
    result += `## Basic Information\n`;
    result += `- **Drug ID**: ${drug.id}\n`;
    result += `- **Name**: ${drug.name}\n`;
    
    if (drug.genericName) {
      result += `- **Generic Name**: ${drug.genericName}\n`;
    }
    
    if (drug.fdaGenericName && drug.fdaGenericName !== drug.genericName) {
      result += `- **FDA Generic Name**: ${drug.fdaGenericName}\n`;
    }
    
    if (drug.fdaBrandName) {
      result += `- **FDA Brand Name**: ${drug.fdaBrandName}\n`;
    }
    
    if (drug.brandNames && drug.brandNames.length > 0) {
      result += `- **Brand Names**: ${drug.brandNames.join(', ')}\n`;
    }
    
    if (drug.manufacturer) {
      result += `- **Manufacturer**: ${drug.manufacturer}\n`;
    }
    
    if (drug.route) {
      result += `- **Route of Administration**: ${drug.route}\n`;
    }
    
    result += `- **Slug**: ${drug.slug}\n`;
    result += `- **Published**: ${drug.published ? 'Yes' : 'No'}\n`;
    result += `- **Created**: ${drug.createdAt.toISOString().split('T')[0]}\n`;
    result += `- **Last Updated**: ${drug.updatedAt.toISOString().split('T')[0]}\n\n`;

    // FDA Label Information
    if (drug.indications || drug.contraindications || drug.warnings || drug.dosageInfo || drug.adverseReactions) {
      result += `## FDA Label Information\n\n`;
      
      if (drug.indications) {
        result += `### Indications and Usage\n${drug.indications}\n\n`;
      }
      
      if (drug.contraindications) {
        result += `### Contraindications\n${drug.contraindications}\n\n`;
      }
      
      if (drug.boxedWarning) {
        result += `### ⚠️ Boxed Warning\n${drug.boxedWarning}\n\n`;
      }
      
      if (drug.warnings) {
        result += `### Warnings and Precautions\n${drug.warnings}\n\n`;
      }
      
      if (drug.dosageInfo) {
        result += `### Dosage and Administration\n${drug.dosageInfo}\n\n`;
      }
      
      if (drug.adverseReactions) {
        result += `### Adverse Reactions\n${drug.adverseReactions}\n\n`;
      }
    }

    // AI-Enhanced Content
    if (drug.aiEnhancedTitle || drug.aiEnhancedDescription || drug.seoMetaTitle || drug.seoMetaDescription) {
      result += `## AI-Enhanced Content\n\n`;
      
      if (drug.aiEnhancedTitle) {
        result += `### Enhanced Title\n${drug.aiEnhancedTitle}\n\n`;
      }
      
      if (drug.aiEnhancedDescription) {
        result += `### Patient-Friendly Description\n${drug.aiEnhancedDescription}\n\n`;
      }
      
      if (drug.seoMetaTitle) {
        result += `### SEO Meta Title\n${drug.seoMetaTitle}\n\n`;
      }
      
      if (drug.seoMetaDescription) {
        result += `### SEO Meta Description\n${drug.seoMetaDescription}\n\n`;
      }
    }

    // FAQs
    if (drug.faqs && drug.faqs.length > 0) {
      result += `## Frequently Asked Questions\n\n`;
      
      drug.faqs.forEach((faq, index) => {
        result += `### ${index + 1}. ${faq.question}\n`;
        result += `${faq.answer}\n\n`;
      });
    }

    // Raw FDA Data (if requested)
    if (includeRawFDAData && drug.fdaLabelData) {
      result += `## Raw FDA Label Data\n\n`;
      result += `\`\`\`json\n${JSON.stringify(drug.fdaLabelData, null, 2)}\n\`\`\`\n\n`;
    }

    // Usage Notes
    result += `---\n\n`;
    result += `**Note**: This information is for educational purposes only and should not replace professional medical advice. Always consult with a healthcare provider before making any decisions about medications.\n`;

    return result;
  }
}