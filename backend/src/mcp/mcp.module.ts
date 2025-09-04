import { Module } from '@nestjs/common';
import { McpService } from './mcp.service';
import { McpController } from './mcp.controller';
import { McpProtocolService } from './services/mcp-protocol.service';
import { McpErrorHandlerService } from './services/mcp-error-handler.service';
import { DrugSearchTool } from './tools/drug-search.tool';
import { DrugDetailsTool } from './tools/drug-details.tool';
import { DrugCategoriesTool } from './tools/drug-categories.tool';
import { DrugListResource } from './resources/drug-list.resource';
import { DrugSchemaResource } from './resources/drug-schema.resource';

@Module({
  controllers: [McpController],
  providers: [
    McpService,
    McpProtocolService,
    McpErrorHandlerService,
    DrugSearchTool,
    DrugDetailsTool,
    DrugCategoriesTool,
    DrugListResource,
    DrugSchemaResource,
  ],
  exports: [McpService],
})
export class McpModule {}