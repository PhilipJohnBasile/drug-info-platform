import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { McpProtocolService } from './services/mcp-protocol.service';
import { McpErrorHandlerService } from './services/mcp-error-handler.service';
import { DrugSearchTool } from './tools/drug-search.tool';
import { DrugDetailsTool } from './tools/drug-details.tool';
import { DrugCategoriesTool } from './tools/drug-categories.tool';
import { DrugListResource } from './resources/drug-list.resource';
import { DrugSchemaResource } from './resources/drug-schema.resource';
import {
  McpRequest,
  McpResponse,
  McpToolDefinition,
  McpResourceDefinition,
  McpCapabilities,
  McpServerInfo,
  McpErrorCode,
} from './interfaces/mcp-protocol.interface';

export interface McpTool {
  name: string;
  description: string;
  inputSchema: any;
}

export interface McpResource {
  uri: string;
  name: string;
  description: string;
  mimeType?: string;
}

@Injectable()
export class McpService {
  private readonly logger = new Logger(McpService.name);

  constructor(
    private configService: ConfigService,
    private protocolService: McpProtocolService,
    private errorHandler: McpErrorHandlerService,
    private drugSearchTool: DrugSearchTool,
    private drugDetailsTool: DrugDetailsTool,
    private drugCategoriesTool: DrugCategoriesTool,
    private drugListResource: DrugListResource,
    private drugSchemaResource: DrugSchemaResource,
  ) {}

  async handleMcpRequest(request: McpRequest): Promise<McpResponse> {
    const validation = this.protocolService.validateRequest(request);
    if (!validation.isValid) {
      return this.protocolService.createErrorResponse(
        request.id || null,
        validation.error.code as McpErrorCode,
        validation.error.message,
        validation.error.data,
      );
    }

    try {
      switch (request.method) {
        case 'initialize':
          return this.handleInitialize(request);
        case 'tools/list':
          return this.handleToolsList(request);
        case 'tools/call':
          return this.handleToolCall(request);
        case 'resources/list':
          return this.handleResourcesList(request);
        case 'resources/read':
          return this.handleResourceRead(request);
        default:
          return this.errorHandler.createMethodNotFoundError(request.method, request.id);
      }
    } catch (error) {
      return this.errorHandler.handleProtocolError(error, request.method, request.id);
    }
  }

  private async handleInitialize(request: McpRequest): Promise<McpResponse> {
    const capabilities = this.protocolService.getServerCapabilities();
    const serverInfo = this.protocolService.getServerInfo();

    return this.protocolService.createResponse(request.id, {
      protocolVersion: '2024-11-05',
      capabilities,
      serverInfo,
    });
  }

  private async handleToolsList(request: McpRequest): Promise<McpResponse> {
    const tools = this.getToolDefinitions();
    return this.protocolService.createResponse(request.id, { tools });
  }

  private async handleToolCall(request: McpRequest): Promise<McpResponse> {
    const { name: toolName, arguments: args } = request.params;

    if (!toolName) {
      return this.errorHandler.createValidationError(
        'Tool name is required',
        request.id,
        { missingParameter: 'name' },
      );
    }

    try {
      const tool = this.getToolByName(toolName);
      if (!tool) {
        return this.errorHandler.createToolNotFoundError(toolName, request.id);
      }

      const validation = this.protocolService.validateToolArguments(
        toolName,
        tool.inputSchema,
        args || {},
      );

      if (!validation.isValid) {
        return this.errorHandler.createValidationError(
          validation.error,
          request.id,
          { toolName, arguments: args },
        );
      }

      const result = await this.executeToolByName(toolName, args || {});
      return this.protocolService.createResponse(request.id, result);
    } catch (error) {
      return this.errorHandler.handleToolError(error, toolName, request.id);
    }
  }

  private async handleResourcesList(request: McpRequest): Promise<McpResponse> {
    const resources = this.getResourceDefinitions();
    return this.protocolService.createResponse(request.id, { resources });
  }

  private async handleResourceRead(request: McpRequest): Promise<McpResponse> {
    const { uri } = request.params;

    if (!uri) {
      return this.errorHandler.createValidationError(
        'Resource URI is required',
        request.id,
        { missingParameter: 'uri' },
      );
    }

    try {
      const content = await this.getResourceByUri(uri);
      return this.protocolService.createResponse(request.id, { contents: [content] });
    } catch (error) {
      return this.errorHandler.handleResourceError(error, uri, request.id);
    }
  }

  private getToolDefinitions(): McpToolDefinition[] {
    return [
      this.drugSearchTool.getDefinition(),
      this.drugDetailsTool.getDefinition(),
      this.drugCategoriesTool.getDefinition(),
    ];
  }

  private getResourceDefinitions(): McpResourceDefinition[] {
    return [
      this.drugListResource.getDefinition(),
      this.drugSchemaResource.getDefinition(),
    ];
  }

  private getToolByName(toolName: string): McpToolDefinition | null {
    const tools = this.getToolDefinitions();
    return tools.find(tool => tool.name === toolName) || null;
  }

  private async executeToolByName(toolName: string, args: any) {
    switch (toolName) {
      case 'search_drugs':
        return await this.drugSearchTool.execute(args);
      case 'get_drug_details':
        return await this.drugDetailsTool.execute(args);
      case 'get_drug_categories':
        return await this.drugCategoriesTool.execute(args);
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  private async getResourceByUri(uri: string) {
    switch (uri) {
      case 'drugs://list':
        return await this.drugListResource.getContent();
      case 'drugs://schema':
        return await this.drugSchemaResource.getContent();
      default:
        throw new Error(`Unknown resource: ${uri}`);
    }
  }

  // Legacy methods for backward compatibility
  getTools(): McpTool[] {
    return this.getToolDefinitions().map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }));
  }

  getResources(): McpResource[] {
    return this.getResourceDefinitions().map(resource => ({
      uri: resource.uri,
      name: resource.name,
      description: resource.description || '',
      mimeType: resource.mimeType,
    }));
  }

  async executeTool(toolName: string, args: any): Promise<any> {
    const result = await this.executeToolByName(toolName, args);
    return result.content?.[0]?.text || result;
  }

  async getResource(uri: string): Promise<any> {
    const content = await this.getResourceByUri(uri);
    return content.text ? JSON.parse(content.text) : content;
  }
}