import { Injectable, Logger } from '@nestjs/common';
import { 
  McpError, 
  McpResponse, 
  MCP_ERROR_CODES,
  McpErrorCode 
} from '../interfaces/mcp-protocol.interface';

export interface McpErrorContext {
  method?: string;
  toolName?: string;
  resourceUri?: string;
  userId?: string;
  requestId?: string;
}

@Injectable()
export class McpErrorHandlerService {
  private readonly logger = new Logger(McpErrorHandlerService.name);

  handleToolError(
    error: any,
    toolName: string,
    id: string | number | null,
    context?: McpErrorContext,
  ): McpResponse {
    this.logger.error(`Tool execution error for ${toolName}:`, {
      error: error.message,
      stack: error.stack,
      context,
    });

    let mcpError: McpError;

    if (this.isValidationError(error)) {
      mcpError = {
        code: MCP_ERROR_CODES.INVALID_PARAMS,
        message: `Invalid parameters for tool ${toolName}: ${error.message}`,
        data: { toolName, validationDetails: this.extractValidationDetails(error) },
      };
    } else if (this.isDatabaseError(error)) {
      mcpError = {
        code: MCP_ERROR_CODES.SERVER_ERROR,
        message: `Database error while executing tool ${toolName}`,
        data: { 
          toolName,
          errorType: 'database',
          details: process.env.NODE_ENV === 'development' ? error.message : 'Internal database error',
        },
      };
    } else if (this.isNotFoundError(error)) {
      mcpError = {
        code: MCP_ERROR_CODES.APPLICATION_ERROR,
        message: `Resource not found for tool ${toolName}`,
        data: { toolName, errorType: 'not_found' },
      };
    } else if (this.isTimeoutError(error)) {
      mcpError = {
        code: MCP_ERROR_CODES.SERVER_ERROR,
        message: `Tool ${toolName} execution timed out`,
        data: { toolName, errorType: 'timeout' },
      };
    } else {
      mcpError = {
        code: MCP_ERROR_CODES.INTERNAL_ERROR,
        message: `Internal error executing tool ${toolName}`,
        data: { 
          toolName,
          errorType: 'internal',
          details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        },
      };
    }

    return {
      jsonrpc: '2.0',
      id,
      error: mcpError,
    };
  }

  handleResourceError(
    error: any,
    resourceUri: string,
    id: string | number | null,
    context?: McpErrorContext,
  ): McpResponse {
    this.logger.error(`Resource access error for ${resourceUri}:`, {
      error: error.message,
      stack: error.stack,
      context,
    });

    let mcpError: McpError;

    if (this.isNotFoundError(error)) {
      mcpError = {
        code: MCP_ERROR_CODES.APPLICATION_ERROR,
        message: `Resource not found: ${resourceUri}`,
        data: { resourceUri, errorType: 'not_found' },
      };
    } else if (this.isDatabaseError(error)) {
      mcpError = {
        code: MCP_ERROR_CODES.SERVER_ERROR,
        message: `Database error accessing resource ${resourceUri}`,
        data: { 
          resourceUri,
          errorType: 'database',
          details: process.env.NODE_ENV === 'development' ? error.message : 'Internal database error',
        },
      };
    } else {
      mcpError = {
        code: MCP_ERROR_CODES.INTERNAL_ERROR,
        message: `Internal error accessing resource ${resourceUri}`,
        data: { 
          resourceUri,
          errorType: 'internal',
          details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        },
      };
    }

    return {
      jsonrpc: '2.0',
      id,
      error: mcpError,
    };
  }

  handleProtocolError(
    error: any,
    method: string,
    id: string | number | null,
    context?: McpErrorContext,
  ): McpResponse {
    this.logger.error(`Protocol error for method ${method}:`, {
      error: error.message,
      stack: error.stack,
      context,
    });

    let mcpError: McpError;

    if (error.code && this.isValidMcpErrorCode(error.code)) {
      mcpError = {
        code: error.code,
        message: error.message,
        data: error.data,
      };
    } else {
      mcpError = {
        code: MCP_ERROR_CODES.INTERNAL_ERROR,
        message: `Protocol error in method ${method}`,
        data: { 
          method,
          errorType: 'protocol',
          details: process.env.NODE_ENV === 'development' ? error.message : 'Internal protocol error',
        },
      };
    }

    return {
      jsonrpc: '2.0',
      id,
      error: mcpError,
    };
  }

  createMethodNotFoundError(method: string, id: string | number | null): McpResponse {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: MCP_ERROR_CODES.METHOD_NOT_FOUND,
        message: `Method not found: ${method}`,
        data: { 
          method,
          availableMethods: [
            'initialize',
            'tools/list',
            'tools/call',
            'resources/list',
            'resources/read',
          ],
        },
      },
    };
  }

  createToolNotFoundError(toolName: string, id: string | number | null): McpResponse {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: MCP_ERROR_CODES.METHOD_NOT_FOUND,
        message: `Tool not found: ${toolName}`,
        data: { 
          toolName,
          availableTools: [
            'search_drugs',
            'get_drug_details',
            'get_drug_categories',
          ],
        },
      },
    };
  }

  createResourceNotFoundError(resourceUri: string, id: string | number | null): McpResponse {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: MCP_ERROR_CODES.APPLICATION_ERROR,
        message: `Resource not found: ${resourceUri}`,
        data: { 
          resourceUri,
          availableResources: [
            'drugs://list',
            'drugs://schema',
          ],
        },
      },
    };
  }

  createValidationError(message: string, id: string | number | null, details?: any): McpResponse {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: MCP_ERROR_CODES.INVALID_PARAMS,
        message,
        data: details,
      },
    };
  }

  private isValidationError(error: any): boolean {
    return error.name === 'ValidationError' || 
           error.message?.includes('validation') ||
           error.message?.includes('Invalid') ||
           error.message?.includes('required');
  }

  private isDatabaseError(error: any): boolean {
    return error.name === 'PrismaClientKnownRequestError' ||
           error.name === 'PrismaClientUnknownRequestError' ||
           error.name === 'PrismaClientInitializationError' ||
           error.code?.startsWith('P') || // Prisma error codes
           error.message?.includes('database') ||
           error.message?.includes('connection');
  }

  private isNotFoundError(error: any): boolean {
    return error.name === 'NotFoundError' ||
           error.message?.includes('not found') ||
           error.message?.includes('NotFound') ||
           error.status === 404;
  }

  private isTimeoutError(error: any): boolean {
    return error.name === 'TimeoutError' ||
           error.code === 'ETIMEDOUT' ||
           error.message?.includes('timeout');
  }

  private isValidMcpErrorCode(code: number): code is McpErrorCode {
    return Object.values(MCP_ERROR_CODES).includes(code as McpErrorCode);
  }

  private extractValidationDetails(error: any): any {
    if (error.details) {
      return error.details;
    }

    if (error.errors && Array.isArray(error.errors)) {
      return error.errors;
    }

    return null;
  }
}