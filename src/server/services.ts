import { PostgresToolRequestRepository } from "@/modules/requests/repositories/postgres-tool-request-repository";
import { ToolRequestService } from "@/modules/requests/services/tool-request-service";

import { PostgresToolPublishingRepository } from "@/modules/tools/repositories/postgres-tool-publishing-repository";
import { PostgresToolRepository } from "@/modules/tools/repositories/postgres-tool-repository";

import { ToolPublishingService } from "@/modules/tools/services/tool-publishing-service";
import { ToolService } from "@/modules/tools/services/tool-service";

const toolRepository =
  new PostgresToolRepository();

const toolRequestRepository =
  new PostgresToolRequestRepository();

const toolPublishingRepository =
  new PostgresToolPublishingRepository();

export const services = {
  tools:
    new ToolService(
      toolRepository,
    ),

  requests:
    new ToolRequestService(
      toolRequestRepository,
    ),

  publishing:
    new ToolPublishingService(
      toolPublishingRepository,
    ),
};