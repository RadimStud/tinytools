import { PostgresToolRepository } from "@/modules/tools/repositories/postgres-tool-repository";
import { ToolService } from "@/modules/tools/services/tool-service";

const toolRepository =
  new PostgresToolRepository();

export const services = {
  tools:
    new ToolService(
      toolRepository,
    ),
};
