import { Injectable } from '@nestjs/common';
import { McpResourceDefinition, McpResourceContent } from '../interfaces/mcp-protocol.interface';

@Injectable()
export class DrugSchemaResource {
  getDefinition(): McpResourceDefinition {
    return {
      uri: 'drugs://schema',
      name: 'Drug Schema',
      description: 'JSON schema definition for drug data structure',
      mimeType: 'application/json',
    };
  }

  async getContent(): Promise<McpResourceContent> {
    const schema = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      title: 'Drug',
      type: 'object',
      description: 'Schema for drug information in the drug database',
      properties: {
        id: {
          type: 'string',
          description: 'Unique identifier for the drug',
        },
        name: {
          type: 'string',
          description: 'Primary drug name',
        },
        genericName: {
          type: 'string',
          description: 'Generic name of the drug',
          nullable: true,
        },
        fdaGenericName: {
          type: 'string',
          description: 'FDA-specified generic name',
          nullable: true,
        },
        fdaBrandName: {
          type: 'string',
          description: 'FDA-specified brand name',
          nullable: true,
        },
        brandNames: {
          type: 'array',
          description: 'List of brand names for this drug',
          items: {
            type: 'string',
          },
        },
        slug: {
          type: 'string',
          description: 'URL-friendly identifier',
        },
        manufacturer: {
          type: 'string',
          description: 'Drug manufacturer',
          nullable: true,
        },
        route: {
          type: 'string',
          description: 'Route of administration (e.g., oral, injection)',
          nullable: true,
        },
        published: {
          type: 'boolean',
          description: 'Whether the drug information is published',
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
          description: 'When the drug record was created',
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
          description: 'When the drug record was last updated',
        },
        fdaLabelData: {
          type: 'object',
          description: 'Raw FDA label data in JSON format',
          nullable: true,
        },
        indications: {
          type: 'string',
          description: 'Indications and usage information',
          nullable: true,
        },
        contraindications: {
          type: 'string',
          description: 'Contraindications',
          nullable: true,
        },
        warnings: {
          type: 'string',
          description: 'Warnings and precautions',
          nullable: true,
        },
        boxedWarning: {
          type: 'string',
          description: 'Boxed warning (black box warning)',
          nullable: true,
        },
        dosageInfo: {
          type: 'string',
          description: 'Dosage and administration information',
          nullable: true,
        },
        adverseReactions: {
          type: 'string',
          description: 'Adverse reactions information',
          nullable: true,
        },
        aiEnhancedTitle: {
          type: 'string',
          description: 'AI-generated enhanced title',
          nullable: true,
        },
        aiEnhancedDescription: {
          type: 'string',
          description: 'AI-generated patient-friendly description',
          nullable: true,
        },
        seoMetaTitle: {
          type: 'string',
          description: 'SEO-optimized meta title',
          nullable: true,
        },
        seoMetaDescription: {
          type: 'string',
          description: 'SEO-optimized meta description',
          nullable: true,
        },
        faqs: {
          type: 'array',
          description: 'Frequently asked questions about the drug',
          items: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'FAQ unique identifier',
              },
              question: {
                type: 'string',
                description: 'The question',
              },
              answer: {
                type: 'string',
                description: 'The answer to the question',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
                description: 'When the FAQ was created',
              },
            },
            required: ['id', 'question', 'answer'],
          },
        },
      },
      required: ['id', 'name', 'slug', 'published'],
      examples: [
        {
          id: 'clx1234567890',
          name: 'Aspirin',
          genericName: 'Acetylsalicylic acid',
          fdaGenericName: 'Acetylsalicylic acid',
          fdaBrandName: 'Bayer Aspirin',
          brandNames: ['Bayer', 'Ecotrin'],
          slug: 'aspirin',
          manufacturer: 'Bayer',
          route: 'Oral',
          published: true,
          indications: 'Used for pain relief, fever reduction, and inflammation',
          warnings: 'May cause stomach bleeding when used long-term',
          seoMetaTitle: 'Aspirin - Uses, Dosage & Side Effects',
          seoMetaDescription: 'Learn about aspirin uses, dosage, side effects and safety information. Consult your healthcare provider.',
          faqs: [
            {
              id: 'faq1',
              question: 'What is aspirin used for?',
              answer: 'Aspirin is commonly used for pain relief, reducing fever, and treating inflammation.',
            },
          ],
        },
      ],
    };

    return {
      uri: 'drugs://schema',
      mimeType: 'application/json',
      text: JSON.stringify(schema, null, 2),
    };
  }
}