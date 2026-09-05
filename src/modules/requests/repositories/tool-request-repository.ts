import type {
  CreateToolRequestInput,
  ToolRequest,
} from "../domain/tool-request";

export interface ToolRequestRepository {
  create(
    input: CreateToolRequestInput,
  ): Promise<ToolRequest>;
}