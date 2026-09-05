import { AuthService } from "@/modules/auth/services/auth-service";

import { PostgresToolRequestRepository } from "@/modules/requests/repositories/postgres-tool-request-repository";
import { ToolRequestService } from "@/modules/requests/services/tool-request-service";

import { PostgresDeveloperToolRepository } from "@/modules/tools/repositories/postgres-developer-tool-repository";
import { PostgresToolPublishingRepository } from "@/modules/tools/repositories/postgres-tool-publishing-repository";
import { PostgresToolRepository } from "@/modules/tools/repositories/postgres-tool-repository";

import { DeveloperToolService } from "@/modules/tools/services/developer-tool-service";
import { ToolPublishingService } from "@/modules/tools/services/tool-publishing-service";
import { ToolService } from "@/modules/tools/services/tool-service";

import { PostgresUserRepository } from "@/modules/users/repositories/postgres-user-repository";

const userRepository =
  new PostgresUserRepository();

const toolRepository =
  new PostgresToolRepository();

const toolRequestRepository =
  new PostgresToolRequestRepository();

const toolPublishingRepository =
  new PostgresToolPublishingRepository();

const developerToolRepository =
  new PostgresDeveloperToolRepository();

export const services = {
  auth:
    new AuthService(
      userRepository,
    ),

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

  developerTools:
    new DeveloperToolService(
      developerToolRepository,
    ),
};