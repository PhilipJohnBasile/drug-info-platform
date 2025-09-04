import { Controller, Get, Post, Body, Param, Headers, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { McpService } from './mcp.service';
import { McpRequest, McpResponse } from './interfaces/mcp-protocol.interface';

@ApiTags('mcp')
@Controller('mcp')
export class McpController {
  private readonly logger = new Logger(McpController.name);

  constructor(private readonly mcpService: McpService) {}

  @Post()
  @ApiOperation({ summary: 'Handle MCP JSON-RPC requests' })
  @ApiHeader({ name: 'Content-Type', required: true, description: 'Must be application/json' })
  @ApiResponse({ status: 200, description: 'MCP response' })
  @ApiResponse({ status: 400, description: 'Invalid MCP request' })
  async handleMcpRequest(
    @Body() request: McpRequest,
    @Headers() headers: Record<string, string>,
  ): Promise<McpResponse> {
    this.logger.debug(`MCP Request: ${request.method}`, {
      id: request.id,
      method: request.method,
      hasParams: !!request.params,
    });

    const response = await this.mcpService.handleMcpRequest(request);

    if (response.error) {
      this.logger.warn(`MCP Error Response:`, {
        requestId: request.id,
        method: request.method,
        errorCode: response.error.code,
        errorMessage: response.error.message,
      });
    } else {
      this.logger.debug(`MCP Success Response:`, {
        requestId: request.id,
        method: request.method,
      });
    }

    return response;
  }

  @Get('tools')
  @ApiOperation({ summary: 'Get available MCP tools (legacy endpoint)' })
  @ApiResponse({ status: 200, description: 'List of available tools' })
  getTools() {
    return {
      tools: this.mcpService.getTools(),
    };
  }

  @Get('resources')
  @ApiOperation({ summary: 'Get available MCP resources (legacy endpoint)' })
  @ApiResponse({ status: 200, description: 'List of available resources' })
  getResources() {
    return {
      resources: this.mcpService.getResources(),
    };
  }

  @Post('tools/execute')
  @ApiOperation({ summary: 'Execute an MCP tool (legacy endpoint)' })
  @ApiResponse({ status: 200, description: 'Tool execution result' })
  async executeTool(@Body() body: { toolName: string; args: any }) {
    try {
      const result = await this.mcpService.executeTool(body.toolName, body.args);
      return {
        success: true,
        result,
      };
    } catch (error) {
      this.logger.error(`Tool execution error:`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('resources/:uri')
  @ApiOperation({ summary: 'Get MCP resource by URI (legacy endpoint)' })
  @ApiResponse({ status: 200, description: 'Resource content' })
  async getResource(@Param('uri') uri: string) {
    try {
      const decodedUri = decodeURIComponent(uri);
      const content = await this.mcpService.getResource(decodedUri);
      return {
        success: true,
        content,
      };
    } catch (error) {
      this.logger.error(`Resource access error:`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('health')
  @ApiOperation({ summary: 'MCP server health check' })
  @ApiResponse({ status: 200, description: 'Server health status' })
  getHealth() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      server: 'Drug Information MCP Server',
      version: '1.0.0',
      capabilities: {
        tools: ['search_drugs', 'get_drug_details', 'get_drug_categories'],
        resources: ['drugs://list', 'drugs://schema'],
      },
    };
  }

  @Get('capabilities')
  @ApiOperation({ summary: 'Get MCP server capabilities' })
  @ApiResponse({ status: 200, description: 'Server capabilities' })
  getCapabilities() {
    return {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {
          listChanged: true,
        },
        resources: {
          subscribe: false,
          listChanged: true,
        },
        logging: {
          level: 'info',
        },
      },
      serverInfo: {
        name: 'Drug Information MCP Server',
        version: '1.0.0',
      },
    };
  }
}