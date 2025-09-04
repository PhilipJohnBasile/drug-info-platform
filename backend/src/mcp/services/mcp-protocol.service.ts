import { Injectable, Logger } from '@nestjs/common';
import {
  McpRequest,
  McpResponse,
  McpError,
  McpCapabilities,
  McpServerInfo,
  MCP_ERROR_CODES,
  McpErrorCode,
} from '../interfaces/mcp-protocol.interface';

@Injectable()
export class McpProtocolService {
  private readonly logger = new Logger(McpProtocolService.name);

  createResponse(id: string | number | null, result: any): McpResponse {
    return {
      jsonrpc: '2.0',
      id,
      result,
    };
  }

  createErrorResponse(
    id: string | number | null,
    code: McpErrorCode,
    message: string,
    data?: any,
  ): McpResponse {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code,
        message,
        data,
      },
    };
  }

  validateRequest(request: any): { isValid: boolean; error?: McpError } {
    if (!request || typeof request !== 'object') {
      return {
        isValid: false,
        error: {
          code: MCP_ERROR_CODES.PARSE_ERROR,
          message: 'Invalid JSON-RPC request',
        },
      };
    }

    if (request.jsonrpc !== '2.0') {
      return {
        isValid: false,
        error: {
          code: MCP_ERROR_CODES.INVALID_REQUEST,
          message: 'Invalid JSON-RPC version',
        },
      };
    }

    if (typeof request.method !== 'string') {
      return {
        isValid: false,
        error: {
          code: MCP_ERROR_CODES.INVALID_REQUEST,
          message: 'Method must be a string',
        },
      };
    }

    if (request.id !== undefined && typeof request.id !== 'string' && typeof request.id !== 'number') {
      return {
        isValid: false,
        error: {
          code: MCP_ERROR_CODES.INVALID_REQUEST,
          message: 'ID must be a string or number',
        },
      };
    }

    return { isValid: true };
  }

  handleProtocolError(error: any, id: string | number | null = null): McpResponse {
    this.logger.error('MCP Protocol Error:', error);

    if (error.code && typeof error.code === 'number') {
      return this.createErrorResponse(id, error.code, error.message, error.data);
    }

    return this.createErrorResponse(
      id,
      MCP_ERROR_CODES.INTERNAL_ERROR,
      'Internal server error',
      process.env.NODE_ENV === 'development' ? error.message : undefined,
    );
  }

  getServerCapabilities(): McpCapabilities {
    return {
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
    };
  }

  getServerInfo(): McpServerInfo {
    return {
      name: 'Drug Information MCP Server',
      version: '1.0.0',
    };
  }

  validateToolArguments(
    toolName: string,
    inputSchema: any,
    arguments_: Record<string, any> = {},
  ): { isValid: boolean; error?: string } {
    try {
      if (!inputSchema || !inputSchema.properties) {
        return { isValid: true };
      }

      const required = inputSchema.required || [];
      const properties = inputSchema.properties;

      // Check required properties
      for (const prop of required) {
        if (!(prop in arguments_)) {
          return {
            isValid: false,
            error: `Missing required parameter: ${prop}`,
          };
        }
      }

      // Validate property types
      for (const [prop, value] of Object.entries(arguments_)) {
        const propSchema = properties[prop];
        if (!propSchema) {
          this.logger.warn(`Unknown parameter ${prop} for tool ${toolName}`);
          continue;
        }

        const typeValid = this.validatePropertyType(value, propSchema);
        if (!typeValid.isValid) {
          return {
            isValid: false,
            error: `Invalid type for parameter ${prop}: ${typeValid.error}`,
          };
        }
      }

      return { isValid: true };
    } catch (error) {
      this.logger.error(`Error validating tool arguments for ${toolName}:`, error);
      return {
        isValid: false,
        error: 'Failed to validate arguments',
      };
    }
  }

  private validatePropertyType(
    value: any,
    schema: any,
  ): { isValid: boolean; error?: string } {
    const { type } = schema;

    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          return { isValid: false, error: 'Expected string' };
        }
        break;
      case 'number':
        if (typeof value !== 'number') {
          return { isValid: false, error: 'Expected number' };
        }
        break;
      case 'integer':
        if (!Number.isInteger(value)) {
          return { isValid: false, error: 'Expected integer' };
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          return { isValid: false, error: 'Expected boolean' };
        }
        break;
      case 'array':
        if (!Array.isArray(value)) {
          return { isValid: false, error: 'Expected array' };
        }
        break;
      case 'object':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          return { isValid: false, error: 'Expected object' };
        }
        break;
    }

    return { isValid: true };
  }

  createToolNotFoundError(toolName: string): McpError {
    return {
      code: MCP_ERROR_CODES.METHOD_NOT_FOUND,
      message: `Tool not found: ${toolName}`,
    };
  }

  createInvalidParamsError(message: string): McpError {
    return {
      code: MCP_ERROR_CODES.INVALID_PARAMS,
      message,
    };
  }

  createInternalError(message: string, data?: any): McpError {
    return {
      code: MCP_ERROR_CODES.INTERNAL_ERROR,
      message,
      data,
    };
  }
}