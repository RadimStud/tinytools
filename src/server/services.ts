import { InMemoryToolRepository } from "@/modules/tools/repositories/in-memory-tool-repository";
import { ToolService } from "@/modules/tools/services/tool-service";

const toolRepository =
  new InMemoryToolRepository();

export const services = {
  tools: new ToolService(toolRepository),
};
